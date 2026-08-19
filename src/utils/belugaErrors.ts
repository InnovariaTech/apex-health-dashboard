import { isApiError } from "@/api/types";
import { extractErrorMessage } from "@/utils/errorHandler";

/**
 * Classify a thrown Beluga error into something the UI can act on.
 *
 * Beluga refusals reach us as our 4xx with `provider: "beluga"` and Beluga's
 * verbatim text in `message`. Several are NOT retryable — the UI should show the
 * message plainly instead of a generic "try again". See `beluga-api.md`.
 */

export interface BelugaErrorInfo {
  /** Best human-readable message (Beluga's verbatim text when present). */
  message: string;
  /** HTTP status our API returned. */
  status: number;
  /** Our error code (`VALIDATION_ERROR`, `NOT_FOUND`, …) when present. */
  code?: string;
  /** True when the failure originated at Beluga (vs. our validation). */
  fromBeluga: boolean;
  /**
   * True when retrying the same request cannot succeed (eligibility window,
   * landline, disallowed state, bad medId, …). The UI should surface `message`
   * and NOT offer a retry.
   */
  retryable: boolean;
}

/** Beluga refusal substrings that a retry cannot fix. Matched case-insensitively. */
const NON_RETRYABLE_SIGNALS = [
  "not eligible for new visit",
  "state not valid",
  "phone number error",
  "no match for",
  "pharmacy mismatch",
  "branded med with compounding",
  "does not have that visit type",
  "missing values",
];

function getResponseData(error: unknown): Record<string, unknown> | null {
  if (isApiError(error) && error.details && typeof error.details === "object") {
    return error.details as Record<string, unknown>;
  }
  if (error && typeof error === "object" && "response" in error) {
    const resp = (error as { response?: { data?: unknown } }).response;
    if (resp?.data && typeof resp.data === "object") {
      return resp.data as Record<string, unknown>;
    }
  }
  return null;
}

export function describeBelugaError(error: unknown): BelugaErrorInfo {
  const message = extractErrorMessage(error);
  const status = isApiError(error) ? error.status : 500;
  const data = getResponseData(error);

  const code = typeof data?.code === "string" ? data.code : undefined;
  const fromBeluga = data?.provider === "beluga";

  const lower = message.toLowerCase();
  const isNonRetryable = NON_RETRYABLE_SIGNALS.some((s) => lower.includes(s));

  // Our own 5xx is retryable; a Beluga refusal that matches a known permanent
  // signal is not. Everything else (transient network, 502) stays retryable.
  const retryable = status >= 500 ? true : !isNonRetryable;

  return { message, status, fromBeluga, retryable, ...(code ? { code } : {}) };
}
