import type { AxiosRequestConfig } from "axios";
import { axiosService } from "./axiosInstance";
import type {
  CancelResult,
  ChatMessage,
  CreateVisitPayload,
  CreateVisitResult,
  IntakeRequirements,
  LabAuthorizationPayload,
  LabVisitPayload,
  Pharmacy,
  PharmacySearchParams,
  PrescriptionPayload,
  PrescriptionResult,
  Visit,
  VisitRefresh,
  VisitStatus,
} from "@/types/beluga/beluga_types";

/**
 * Patient-facing Beluga endpoints. Cookie auth (`apex_access_token`) is sent by
 * the shared axios instance. Each function unwraps the `{ success, message,
 * data }` envelope and returns the `data` payload. See `beluga-api.md`.
 *
 * Refusals from Beluga surface as our 4xx with `provider: "beluga"` and Beluga's
 * verbatim message; those reach callers as thrown ApiErrors (message + details).
 * Use `describeBelugaError` in `@/utils/belugaErrors` to classify them.
 */

const BASE = "/api/beluga";

/** Unwrap the envelope: axiosService returns `{ data: <body>, ... }`; the body
 *  is `{ success, message, data }`. Tolerate a bare payload too. */
function unwrap<T>(body: unknown): T {
  const envelope = body as { data?: T } | T;
  if (envelope && typeof envelope === "object" && "data" in (envelope as object)) {
    return (envelope as { data: T }).data;
  }
  return envelope as T;
}

// --- Intake readiness -------------------------------------------------------

export async function getIntakeRequirements(): Promise<IntakeRequirements> {
  const res = await axiosService.get(`${BASE}/intake-requirements`);
  return unwrap<IntakeRequirements>(res.data);
}

// --- Pharmacies -------------------------------------------------------------

export async function searchPharmacies(
  params: PharmacySearchParams,
): Promise<Pharmacy[]> {
  // Drop blanks so we never send `?name=` and trip the "at least one" rule.
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string" && v.trim()) clean[k] = v.trim();
  }
  const res = await axiosService.get(`${BASE}/pharmacies`, { params: clean });
  const data = unwrap<Pharmacy[]>(res.data);
  return Array.isArray(data) ? data : [];
}

// --- Creates ----------------------------------------------------------------

export async function createVisit(
  payload: CreateVisitPayload,
): Promise<CreateVisitResult> {
  const res = await axiosService.post(`${BASE}/visits`, payload);
  return unwrap<CreateVisitResult>(res.data);
}

export async function createLabAuthorization(
  payload: LabAuthorizationPayload,
): Promise<CreateVisitResult> {
  const res = await axiosService.post(`${BASE}/lab-authorizations`, payload);
  return unwrap<CreateVisitResult>(res.data);
}

export async function createLabVisit(
  payload: LabVisitPayload,
): Promise<CreateVisitResult> {
  // When testToTreat is false the key must be dropped, not sent empty.
  const body: LabVisitPayload = { ...payload };
  if (!body.testToTreat) delete body.patientPreference;
  const res = await axiosService.post(`${BASE}/lab-visits`, body);
  return unwrap<CreateVisitResult>(res.data);
}

// --- Reads ------------------------------------------------------------------

export async function listVisits(statuses?: VisitStatus[]): Promise<Visit[]> {
  // `?status=` is repeatable; axios serializes an array as repeated params.
  const config = statuses?.length ? { params: { status: statuses } } : undefined;
  const res = await axiosService.get(`${BASE}/visits`, config);
  const data = unwrap<Visit[]>(res.data);
  return Array.isArray(data) ? data : [];
}

export async function getVisit(masterId: string): Promise<Visit> {
  const res = await axiosService.get(`${BASE}/visits/${masterId}`);
  return unwrap<Visit>(res.data);
}

/** POST (it writes): live read from Beluga that reconciles our row. */
export async function refreshVisit(masterId: string): Promise<VisitRefresh> {
  const res = await axiosService.post(`${BASE}/visits/${masterId}/refresh`);
  return unwrap<VisitRefresh>(res.data);
}

// --- Chat -------------------------------------------------------------------

/** Oldest-first, doctor channel only. */
export async function getVisitChat(masterId: string): Promise<ChatMessage[]> {
  const res = await axiosService.get(`${BASE}/visits/${masterId}/chat`);
  const data = unwrap<ChatMessage[]>(res.data);
  return Array.isArray(data) ? data : [];
}

export async function sendVisitChat(
  masterId: string,
  content: string,
): Promise<null> {
  await axiosService.post(`${BASE}/visits/${masterId}/chat`, { content });
  return null; // 201, data: null
}

// --- Photos -----------------------------------------------------------------

/**
 * Multipart, one file part. We MUST NOT set Content-Type ourselves — the
 * browser sets `multipart/form-data` with the boundary. The axios instance
 * defaults to `application/json`, so override it to `undefined` here (same
 * trick the admin shop image upload uses). Do NOT base64 the file.
 */
export async function uploadVisitPhoto(
  masterId: string,
  file: File,
): Promise<null> {
  const form = new FormData();
  form.append("image", file);
  // Force the browser to set `multipart/form-data; boundary=…`; the axios
  // instance defaults Content-Type to application/json, which would break the
  // upload. Cast because axios's header types don't model `undefined`.
  const config = {
    headers: { "Content-Type": undefined },
  } as unknown as AxiosRequestConfig;
  await axiosService.post(`${BASE}/visits/${masterId}/photos`, form, config);
  return null; // 201, data: null; side effect: awaiting_photos → active
}

// --- Prescription / cancel --------------------------------------------------

export async function updatePrescription(
  masterId: string,
  payload: PrescriptionPayload,
): Promise<PrescriptionResult> {
  const res = await axiosService.post(
    `${BASE}/visits/${masterId}/prescription`,
    payload,
  );
  return unwrap<PrescriptionResult>(res.data);
}

export async function cancelVisit(masterId: string): Promise<CancelResult> {
  const res = await axiosService.post(`${BASE}/visits/${masterId}/cancel`);
  return unwrap<CancelResult>(res.data);
}
