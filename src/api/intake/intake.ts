import { axiosService } from "@/api/http/axiosInstance";
import type { IntakeManifest, PublicIntakeForm } from "@/types/intake/intake_types";
import type {
  IntakeAnswer,
  IntakeStep,
  PatientIntake,
  PendingIntake,
  PublicStartPayload,
  PublicStartResult,
} from "@/types/intake/intake_types";

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

/**
 * The details page's title and theme, read before the public door. Same 404 cases as `/start`
 * (unknown, unpublished, not public, sold through Healthie, another partner's form). Never cached.
 */
export async function getPublicIntakeForm(formKey: string): Promise<PublicIntakeForm> {
  const res = await axiosService.get(`${BASE}/public/${encodeURIComponent(formKey)}`);
  return unwrap<PublicIntakeForm>(res.data);
}

/**
 * The public door: a stranger mints their own token by posting an identity
 * block. No auth. Every refusal is a flat 404 ("This form is not available").
 * Rate limited 10/min per IP. From here the walk is identical to invited.
 */
export async function startPublicIntake(
  payload: PublicStartPayload,
): Promise<PublicStartResult> {
  const res = await axiosService.post(`${BASE}/public/start`, payload);
  return unwrap<PublicStartResult>(res.data);
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

/**
 * The whole form up front (progress bar / review). Carries no conditions. Also carries the
 * `theme` the walk wears: the partner it was started through, else the form's own, with the
 * form's published override merged in.
 */
export async function getManifest(token: string): Promise<IntakeManifest> {
  const res = await axiosService.get(
    `${BASE}/${encodeURIComponent(token)}/manifest`,
  );
  return unwrap<IntakeManifest>(res.data);
}

/**
 * Paid, unfinished forms for the signed-in patient — someone who bought a form on the public buy
 * page pays first and answers after logging in. Session required. Every call mints new tokens.
 */
export async function getPendingIntakes(): Promise<PendingIntake[]> {
  const res = await axiosService.get("/api/patient/intakes/pending");
  return unwrap<{ intakes: PendingIntake[] }>(res.data).intakes ?? [];
}

/** All the patient's forms and their status. Session required; safe to re-read (mints nothing). */
export async function getMyIntakes(): Promise<PatientIntake[]> {
  const res = await axiosService.get("/api/patient/intakes");
  return unwrap<{ intakes: PatientIntake[] }>(res.data).intakes ?? [];
}
