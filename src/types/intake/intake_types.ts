import type { ResolvedTheme } from "@/types/intake/theme_types";
import type { DetailsPage, LayoutNode } from "@/shared/form-renderer";
/**
 * Patient intake runtime types — the server-driven "fold".
 *
 * We render whatever screen the server hands back; we never compute the next
 * question. Mirrors `Documents/Intake-Form/patient_form_api_guide.md`.
 */

export type IntakeFieldType =
  | "single_select"
  | "multi_select"
  | "free_text"
  | "date_text"
  | "number"
  | "document_upload";

export type ContentSeverity = "info" | "warning" | "crisis";

export interface IntakeContent {
  ref: string;
  severity: ContentSeverity;
  format: "markdown";
  body: string;
}

export type FactCollector = "dateOfBirth" | "zip" | "text" | "number" | "choice";

export interface FactPrompt {
  key: string;
  type: string;
  prompt: string;
  collect: FactCollector;
  /** "We'd have filled this in if we had it" — NOT actually optional. */
  optionalIfKnown?: boolean;
  helpText?: string;
  options?: { key: string; label: string }[];
}

export interface FieldFollowup {
  key: string;
  type: IntakeFieldType | string;
  prompt: string;
  required?: boolean;
}

export interface FieldOption {
  key: string;
  label: string;
  helpText?: string;
  /** "None of the above" — clears every other selection. */
  exclusive?: boolean;
  followup?: FieldFollowup;
}

export interface FieldConstraints {
  minSelections?: number;
  maxSelections?: number;
  pattern?: string;
  patternMessage?: string;
  sentinelValues?: string[];
  maxLength?: number;
  acceptedMimeTypes?: string[];
  maxFileBytes?: number;
  maxFiles?: number;
}

export interface IntakeField {
  key: string;
  type: IntakeFieldType;
  prompt: string;
  required?: boolean;
  helpText?: string;
  options?: FieldOption[];
  constraints?: FieldConstraints;
  /**
   * An image the admin attached to this question (top-level questions only). Where it sits and its
   * size come from the theme (`questionImage`), not from here. `alt` is required, put it on the img.
   */
  image?: { url: string; alt: string };
}

export interface IntakeProgress {
  answered: number;
  estimatedTotal: number;
  percent: number;
}

export interface FactsStep {
  kind: "facts";
  submissionId: string;
  formKey: string;
  formVersion: number;
  prompts: FactPrompt[];
  values: Record<string, unknown>;
}

export interface QuestionStep {
  kind: "question";
  submissionId: string;
  formKey: string;
  formVersion: number;
  fields: IntakeField[];
  answers: Record<string, unknown>;
  content: IntakeContent[];
  progress: IntakeProgress;
  canGoBack: boolean;
  /** This page's title, drawn above it (`.apx-step-title`); several pages may share one. */
  stepTitle?: string;
  /** The next titled page's title when it differs from this one: the "Next: <title>" label. */
  nextStepTitle?: string;
  /**
   * The last question screen: its button says the theme's "submit" words. Not sent by the backend
   * yet (asked for); until it is, every screen says "next".
   */
  isLast?: boolean;
}

export interface TerminatedStep {
  kind: "terminated";
  submissionId: string;
  outcome: string;
  reasonCode: string;
  content: IntakeContent[];
  canGoBack: boolean;
}

/** One plan on the payment screen: everything a patient needs to choose between them. */
export interface CheckoutOption {
  checkoutFormId: string;
  title: string;
  description?: string | null;
  /** Display only; Stripe charges the real amount. */
  cost: number | null;
  currency: string;
  /** Months the plan covers; null on a single purchase. */
  totalCycles: number | null;
  /** `upfront`: the cost is for the whole plan. `per_cycle`: charged every month. */
  billingMode: "upfront" | "per_cycle";
}

/** Every question answered, payment outstanding. A STEP, not the end. */
export interface CheckoutStep {
  kind: "checkout";
  submissionId: string;
  formKey: string;
  formVersion: number;
  content: IntakeContent[];
  /** The plans the form sells, in order. With more than one, the patient picks before paying. */
  options?: CheckoutOption[];
  /**
   * Stripe-hosted URL. Absent with several plans = the patient hasn't picked one yet; absent with
   * one plan = a session couldn't be created yet, and re-GET retries.
   */
  checkoutUrl?: string | null;
}

export interface CompletedStep {
  kind: "completed";
  submissionId: string;
  content: IntakeContent[];
  redirectUrl?: string | null;
}

export type IntakeStep =
  | FactsStep
  | QuestionStep
  | TerminatedStep
  | CheckoutStep
  | CompletedStep;

/** One answer, POSTed one at a time. */
export type IntakeAnswer =
  | { kind: "select"; selected: string[]; followups?: Record<string, unknown> }
  | { kind: "text"; value: string }
  | { kind: "number"; value: number }
  | { kind: "upload"; fileRefs: string[] };

export type IntakeErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "GONE";

// ── Public door (POST /api/intake/public/start) ──────────────────────────────

export interface PublicIdentity {
  firstName: string;
  lastName: string;
  /** YYYY-MM-DD. */
  dob: string;
  email: string;
  phone?: string;
}

export interface PublicStartPayload {
  /** The form's key (as the admin named it), not its id. */
  formKey: string;
  /** Whatever the shop calls the treatment being bought. */
  productId?: string;
  identity: PublicIdentity;
}

export interface PublicStartResult {
  token: string;
  expiresAt: string;
}

/**
 * `GET /api/patient/intakes/pending` — forms the patient has PAID for and not finished (a
 * refunded purchase drops out). Each call issues a fresh `token` and retires the previous one,
 * so it is never cached.
 */
export interface PendingIntake {
  submissionId: string;
  formKey: string;
  title: string;
  /** A fresh intake link token: open `/intake/<token>`. */
  token: string;
}

/**
 * `GET /api/patient/intakes` — every form of the patient's and where it stands. Read from our own
 * records (no call to the care platform). `submitted` ones are what the dashboard tracks.
 */
export interface PatientIntake {
  submissionId: string;
  formKey: string;
  title: string;
  status: "awaiting_answers" | "awaiting_payment" | "submitted" | "not_eligible";
  startedAt: string;
  submittedAt: string | null;
  /** When the answers reached the care team's record. Null until then. */
  sentToCareTeamAt: string | null;
}

/** `GET /api/intake/:token/manifest` — only the parts the runtime reads. */
/**
 * `GET /api/intake/public/:formKey` — what the details page of a public form needs before any
 * token exists: the title and the theme (partner from the request's `Origin`, plus the form's own).
 */
export interface PublicIntakeForm {
  formKey: string;
  title: string;
  theme: ResolvedTheme;
  /**
   * The published details pages, in order (Documents/hidden-details-pages-titles.md §2), or null
   * for one plain page of all five fields. Absent from older backends.
   */
  detailsPages?: DetailsPage[] | null;
  /**
   * The first details page's tree, kept by the backend for one release for older frontends.
   * Read only when `detailsPages` is absent; it will be removed.
   */
  layout?: LayoutNode | null;
}

export interface IntakeManifest {
  formKey: string;
  title: string;
  version: number;
  /** The merged look for this walk; absent from older backends. */
  theme?: ResolvedTheme;
}
