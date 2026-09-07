import { axiosService } from "@/api/http/axiosInstance";
import type { IntakeAnswer, IntakeStep } from "@/types/intake/intake_types";

/**
 * Patient intake runtime — `/api/intake/:token/*`. No login: the token in the
 * path is the only credential. Every endpoint returns the same step union.
 *
 * SECURITY: the token is a bearer credential for a form of medical answers.
 * It must never be logged, sent to analytics, or handed to a third party.
 * See `Documents/Intake-Form/patient_form_api_guide.md`.
 */

const BASE = "/api/intake";

function unwrap<T>(body: unknown): T {
  const envelope = body as { data?: T } | T;
  if (envelope && typeof envelope === "object" && "data" in (envelope as object)) {
    return (envelope as { data: T }).data;
  }
  return envelope as T;
}

/** Pure read — safe on mount, refresh, reconnect. Returns the true state. */
export async function getIntakeStep(token: string): Promise<IntakeStep> {
  const res = await axiosService.get(`${BASE}/${encodeURIComponent(token)}`);
  return unwrap<IntakeStep>(res.data);
}

/** Submit fact answers (all or a subset). Keys are the prompt `key`. */
export async function submitFacts(
  token: string,
  values: Record<string, unknown>,
): Promise<IntakeStep> {
  const res = await axiosService.post(
    `${BASE}/${encodeURIComponent(token)}/facts`,
    values,
  );
  return unwrap<IntakeStep>(res.data);
}

/** Submit one answer. Grouped screens POST each field one at a time. */
export async function submitAnswer(
  token: string,
  key: string,
  answer: IntakeAnswer,
): Promise<IntakeStep> {
  const res = await axiosService.post(
    `${BASE}/${encodeURIComponent(token)}/answer`,
    { key, answer },
  );
  return unwrap<IntakeStep>(res.data);
}

/** Server-driven back — it forgets the previous screen's answers and re-derives. */
export async function goBack(token: string): Promise<IntakeStep> {
  const res = await axiosService.post(
    `${BASE}/${encodeURIComponent(token)}/back`,
    {},
  );
  return unwrap<IntakeStep>(res.data);
}

/** The whole form up front (progress bar / review). Carries no conditions. */
export async function getManifest(token: string): Promise<unknown> {
  const res = await axiosService.get(
    `${BASE}/${encodeURIComponent(token)}/manifest`,
  );
  return unwrap<unknown>(res.data);
}
