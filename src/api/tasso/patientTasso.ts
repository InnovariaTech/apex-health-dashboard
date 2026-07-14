import { axiosService } from "@/api/http/axiosInstance";
import type {
  ListTassoOrderEventsParams,
  ListTassoOrderEventsResult,
  ListTassoTestResultsParams,
  ListTassoTestResultsResult,
  TassoTestResult,
} from "@/types/tasso/patient_types";

/**
 * Patient-facing Tasso endpoints. All three require the auth cookie and
 * resolve the patient's Tasso ID server-side. Documented in
 * `docs/tasso/new-patient-api-and-tasso-implementation.md` §3–5, with
 * actual response samples in `docs/tasso/test_results.md`.
 *
 * Envelope: `{ success, message, data }`. We unwrap `data` here so call
 * sites work with the bare payload. The shared axios singleton handles
 * the apex_access_token cookie + 401 refresh dance.
 */

const ORDER_EVENTS_ENDPOINT = "/api/patient/tasso/orders/events";
const TEST_RESULTS_ENDPOINT = "/api/patient/tasso/test-results";

interface TassoEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  provider?: string;
  providerStatus?: number;
}

function unwrap<T>(envelope: unknown): T {
  if (envelope && typeof envelope === "object" && "data" in envelope) {
    const e = envelope as TassoEnvelope<T>;
    if (e.success === false) {
      throw new Error(e.message || "Tasso request failed");
    }
    return e.data as T;
  }
  return envelope as T;
}

export async function listTassoOrderEvents(
  params: ListTassoOrderEventsParams = {},
): Promise<ListTassoOrderEventsResult> {
  const res = await axiosService.get<TassoEnvelope<ListTassoOrderEventsResult>>(
    ORDER_EVENTS_ENDPOINT,
    { params: cleanQueryParams(params as Record<string, unknown>) },
  );
  return unwrap<ListTassoOrderEventsResult>(res.data) ?? { results: [] };
}

export async function listTassoTestResults(
  params: ListTassoTestResultsParams = {},
): Promise<ListTassoTestResultsResult> {
  const res = await axiosService.get<TassoEnvelope<ListTassoTestResultsResult>>(
    TEST_RESULTS_ENDPOINT,
    { params: cleanQueryParams(params as Record<string, unknown>) },
  );
  return unwrap<ListTassoTestResultsResult>(res.data) ?? { results: [] };
}

export async function getTassoTestResult(
  testResultId: string,
): Promise<TassoTestResult> {
  const res = await axiosService.get<TassoEnvelope<TassoTestResult>>(
    `${TEST_RESULTS_ENDPOINT}/${encodeURIComponent(testResultId)}`,
  );
  return unwrap<TassoTestResult>(res.data);
}

/**
 * Strip undefined / empty-string params before they hit axios. The
 * backend treats `?status=` (empty) and `?status=anything` as different
 * inputs, so we only forward truthy values.
 */
function cleanQueryParams(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

/**
 * Detect whether the patient is registered on Tasso by probing the
 * cheapest endpoint. Doc §"Prerequisite" says unregistered patients get
 * a 400, but the live backend returns 404 with the same message
 * `"Your account is not yet registered on Tasso Care…"`. We key off the
 * message text rather than the status code so we tolerate either.
 *
 * Registration state is a normal product condition, not an error.
 * Returns:
 *   - `linked: true`  → endpoint responded normally
 *   - `linked: false` → any 4xx whose body says "not yet registered"
 *   - bubbles other errors up (network, 401, 5xx without that message)
 */
export async function probeTassoLink(): Promise<{
  linked: boolean;
  message?: string;
}> {
  try {
    await listTassoOrderEvents({ limit: 1 });
    return { linked: true };
  } catch (err) {
    // The shared axios interceptor normalises errors to ApiError shape
    // (`{ message, status, code?, details? }`) — there is no raw
    // `err.response` here. Key off the message text so 400 / 404 / any
    // 4xx with the "not yet registered" body is treated as "not linked".
    const e = err as {
      status?: number;
      message?: string;
      details?: { message?: string } | unknown;
    };
    const status = typeof e?.status === "number" ? e.status : 0;
    const detailsMessage =
      e?.details && typeof e.details === "object" && "message" in e.details
        ? (e.details as { message?: string }).message
        : undefined;
    const apiMessage = detailsMessage ?? e?.message ?? "";
    const isNotRegistered = /not yet registered/i.test(apiMessage);
    if (isNotRegistered && status >= 400 && status < 500) {
      return { linked: false, message: apiMessage };
    }
    throw err;
  }
}
