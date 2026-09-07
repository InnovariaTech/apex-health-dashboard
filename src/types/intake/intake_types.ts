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
}

export interface TerminatedStep {
  kind: "terminated";
  submissionId: string;
  outcome: string;
  reasonCode: string;
  content: IntakeContent[];
  canGoBack: boolean;
}

export interface CompletedStep {
  kind: "completed";
  submissionId: string;
  content: IntakeContent[];
  redirectUrl?: string | null;
}

export type IntakeStep = FactsStep | QuestionStep | TerminatedStep | CompletedStep;

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
