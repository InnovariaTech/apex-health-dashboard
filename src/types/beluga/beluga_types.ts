/**
 * Beluga integration wire contracts — the patient-facing surface of ApexMD's
 * `/api/beluga/*` routes. See `Documents/beluga/beluga-api.md` for the full
 * reference; every shape here mirrors what those routes validate and return.
 *
 * The frontend never talks to Beluga directly — it calls OUR API, which builds
 * Beluga's identity block from the patient profile and relays. So an incomplete
 * profile fails at OUR layer (see `IntakeRequirements`) before Beluga is hit.
 */

/**
 * The ten visit statuses. Four are ours (create lifecycle), six are Beluga's.
 * Drive all UI from this field — never `resolvedStatus`.
 */
export type VisitStatus =
  // ours
  | "pending_response" // row written, create POST unanswered
  | "unknown" // create timed out; Beluga may or may not have it
  | "rejected" // Beluga refused the create
  | "awaiting_photos" // created at Beluga, no ID photo accepted yet
  // theirs
  | "pending"
  | "active"
  | "admin"
  | "holding"
  | "resolved"
  | "canceled";

/**
 * `resolvedStatus` holds two vocabularies depending on what wrote it last
 * (`/refresh` writes open|closed, the CONSULT_CONCLUDED webhook writes
 * prescribed|referred). Informational only — do not gate UI on it.
 */
export type ResolvedStatus = "open" | "closed" | "prescribed" | "referred";

// ---------------------------------------------------------------------------
// Intake readiness  (GET /api/beluga/intake-requirements)
// ---------------------------------------------------------------------------

export type IntakeGapReason = "missing" | "invalid";

export interface IntakeGap {
  /** Our profile column name (not Beluga's), e.g. "phoneNumber", "assignedSex". */
  field: string;
  reason: IntakeGapReason;
  /** Human hint present on `invalid`, e.g. "must be a 10-digit US mobile number". */
  detail?: string;
}

export interface IntakeRequirements {
  /** `true` ⇒ `gaps` is empty and a create can be attempted. */
  ready: boolean;
  gaps: IntakeGap[];
}

// ---------------------------------------------------------------------------
// Pharmacies  (GET /api/beluga/pharmacies)
// ---------------------------------------------------------------------------

/** At least one field is required; blank strings are dropped server-side. */
export interface PharmacySearchParams {
  name?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * Beluga returns these PascalCased, unlike every other response, and we pass
 * them through unchanged. Keep the casing — it is the wire contract.
 */
export interface Pharmacy {
  PharmacyId: number;
  StoreName: string;
  Address1: string;
  Address2: string | null;
  City: string;
  State: string;
  ZipCode: string;
  PrimaryPhone: string;
  PrimaryFax: string;
  PharmacySpecialties: string[];
  ServiceLevel: number;
  Latitude: number;
  Longitude: number;
}

// ---------------------------------------------------------------------------
// Create payloads
// ---------------------------------------------------------------------------

/**
 * Every field is a STRING (Beluga's contract), including the numeric-looking
 * ones. `name` is the pharmacy's "Favorite Name", not the medication column.
 */
export interface PatientPreference {
  name: string;
  medId: string;
  strength: string;
  quantity: string;
  refills: string;
  /** Optional on creates, REQUIRED on `/prescription`. */
  daysSupply?: string;
}

/** Question/answer pairs; keys match `^[QA]\d+$` (Q1/A1, Q2/A2, …). */
export type VisitQuestions = Record<string, string>;

/** POST /api/beluga/visits — main create path. Lands at `awaiting_photos`. */
export interface CreateVisitPayload {
  visitType: string;
  pharmacyId: string;
  patientPreference: PatientPreference[];
  questions?: VisitQuestions;
  /** Literal `true`; `false` is a 400, not a refusal. */
  consentsSigned: true;
}

/** POST /api/beluga/lab-authorizations — no meds/pharmacy. Lands at `active`. */
export interface LabAuthorizationPayload {
  testTypes: string[];
  questions?: VisitQuestions;
  consentsSigned: true;
}

export type SampleSource =
  | "URINE"
  | "BLOOD"
  | "SALIVA"
  | "VAGINAL"
  | "RECTAL"
  | "SEMEN";

export interface LabResult {
  /** MM/DD/YYYY. Beluga prefers "N/A" over an omitted field. */
  screeningDate: string;
  testName: string;
  testResult: string;
  testResultUnits: string;
  refRange: string;
  statusIndicator: string;
  reportDate: string;
  sampleSource: SampleSource;
}

/** POST /api/beluga/lab-visits — intake + results in one call. `awaiting_photos`. */
export interface LabVisitPayload {
  visitType: string;
  pharmacyId: string;
  testToTreat: boolean;
  results: LabResult[];
  /** Required when `testToTreat` is true; rejected by Beluga when false. */
  patientPreference?: PatientPreference[];
}

/** All three creates return only this. */
export interface CreateVisitResult {
  masterId: string;
}

// ---------------------------------------------------------------------------
// Visits  (GET /api/beluga/visits, GET /api/beluga/visits/:masterId)
// ---------------------------------------------------------------------------

export type BookingStatus = "scheduled" | "canceled" | "no_show";

export interface Visit {
  masterId: string;
  /** Null until the create is answered by Beluga. */
  visitId: string | null;
  userId: string;
  visitType: string;
  status: VisitStatus;
  resolvedStatus: ResolvedStatus | null;
  lastError: string | null;
  bookingStatus: BookingStatus | null;
  bookingScheduledAt: string | null;
  bookingDocName: string | null;
  bookingLocation: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Refresh  (POST /api/beluga/visits/:masterId/refresh)
// ---------------------------------------------------------------------------

export interface VisitRefreshFormObj {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  sex: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  pharmacyId: string;
  patientPreference: PatientPreference[];
  intakeResults: { question: string; answer: string }[];
}

/**
 * Note the nesting: `visitStatus`, `resolvedStatus` and `labResults` are
 * SIBLINGS of `data`, not inside it. `rxHistory`/`labResults` arrive only here,
 * never by webhook. `resolvedTimestamp` appears only when closed.
 */
export interface VisitRefresh {
  status: number;
  masterId: string;
  visitStatus: VisitStatus;
  updateTimestamp: string;
  resolvedStatus: ResolvedStatus | null;
  resolvedTimestamp?: string;
  labResults: unknown[];
  data: {
    formObj: VisitRefreshFormObj;
    visitType: string;
    rxHistory: unknown[];
  };
}

// ---------------------------------------------------------------------------
// Chat  (GET/POST /api/beluga/visits/:masterId/chat)
// ---------------------------------------------------------------------------

export type ChatDirection = "inbound" | "outbound";
/** Patient endpoint only ever returns `doctor`; `cs` is admin-only. */
export type ChatChannel = "doctor" | "cs";

export interface ChatMessage {
  id: string;
  masterId: string;
  direction: ChatDirection;
  channel: ChatChannel;
  content: string;
  isMedia: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Prescription  (POST /api/beluga/visits/:masterId/prescription)
// ---------------------------------------------------------------------------

/**
 * Ten possible statuses. Only `RX_ERROR` and `GENERIC` are faults — every other
 * value arrives as HTTP 200 / success and is a message the patient must read.
 * Branch on this field.
 */
export type PrescriptionStatus =
  | "SUCCESS"
  | "RX_ERROR"
  | "GENERIC"
  | "TOO_MANY_RETRIES"
  | "TOO_LONG_AGO"
  | "PHARMACY_MISMATCH"
  | "VISIT_WAS_REFERRED"
  | (string & {}); // tolerate unknown future statuses

/** `daysSupply` is REQUIRED here (unlike creates). */
export interface PrescriptionPayload {
  pharmacyId: string;
  patientPreference: Array<Required<Pick<PatientPreference,
    "name" | "medId" | "strength" | "quantity" | "refills" | "daysSupply">>>;
}

export interface PrescriptionResult {
  status: PrescriptionStatus;
  info: string;
  medsPrescribed: unknown[];
}

/** The two prescription statuses that mean an actual failure. */
export const PRESCRIPTION_FAULTS: PrescriptionStatus[] = ["RX_ERROR", "GENERIC"];

// ---------------------------------------------------------------------------
// Cancel  (POST /api/beluga/visits/:masterId/cancel)
// ---------------------------------------------------------------------------

export interface CancelResult {
  /** Beluga decides — a doctor may have resolved it first. */
  outcome: "canceled" | "resolved" | (string & {});
  alreadyProcessed: boolean;
}
