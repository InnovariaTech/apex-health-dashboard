/**
 * Intake-form helpers — defensive parser, per-type answer encoder, and
 * per-type validator for the CareValidate dynamic-case intake flow.
 *
 * The bundle response from `GET /browse-treatments/bundles/:id?includeIntakeForm=true`
 * carries the form schema under `bundle.raw.intakeForm`, but the exact shape
 * varies (sometimes wrapped in `data`, sometimes nested under `form`). We
 * normalise everything to {@link IntakeFormSchema} and operate on that.
 *
 * Answers are emitted in **Form-ID-based** mode (each question has a UUID
 * we forward as `questionId`), per the CareValidate `/dynamic-case` doc.
 */

import type {
  AddCaseFormQuestion,
  CaseQuestionType,
  CreateCaseQuestionAnswer,
} from "@/types/care-validate/case_types";

// ─── Normalized schema types ───────────────────────────────────────────────

export interface IntakeQuestion {
  /** UUID — required for Form-ID-based submission. */
  questionId: string;
  /** Question prompt shown to the user. */
  question: string;
  type: CaseQuestionType;
  required: boolean;
  phi: boolean;
  hint?: string;
  placeholder?: string;
  /** Present for SINGLESELECT / MULTISELECT. */
  options?: string[];
}

export interface IntakeFormSchema {
  /** Form UUID — passed as `formId` in the case body when available. */
  id?: string;
  title?: string;
  description?: string;
  questions: IntakeQuestion[];
}

// ─── Defensive parser ──────────────────────────────────────────────────────

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function stringOr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function stringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

function pickQuestionsArray(form: Record<string, unknown>): unknown[] {
  if (Array.isArray(form.questions)) return form.questions;
  // Some CareValidate envs wrap questions inside `sections[].questions`.
  if (Array.isArray(form.sections)) {
    return form.sections.flatMap((s) => {
      const sec = asRecord(s);
      return Array.isArray(sec.questions) ? sec.questions : [];
    });
  }
  return [];
}

function mapQuestion(raw: unknown): IntakeQuestion | null {
  const row = asRecord(raw);
  // CareValidate sometimes nests the canonical question under `question`.
  const inner = asRecord(row.question);
  const idCandidate = row.id ?? row.questionId ?? inner.id;
  const promptCandidate =
    typeof row.question === "string"
      ? row.question
      : inner.text ?? row.text ?? row.label;

  const id = stringOr(idCandidate);
  const prompt = stringOr(promptCandidate);
  if (!id || !prompt) return null;

  const out: IntakeQuestion = {
    questionId: id,
    question: prompt,
    type: stringOr(row.type ?? inner.type, "TEXT") as CaseQuestionType,
    required: Boolean(row.required ?? inner.required ?? false),
    phi: Boolean(row.phi ?? row.isPHI ?? inner.isPHI ?? false),
  };

  const hint = stringOr(row.hint ?? inner.hint);
  if (hint) out.hint = hint;
  const placeholder = stringOr(row.placeholder ?? inner.placeholder);
  if (placeholder) out.placeholder = placeholder;

  const opts = stringArray(row.options ?? inner.options);
  if (opts.length) out.options = opts;

  return out;
}

/**
 * Pulls a normalized form schema out of the bundle payload. Returns `null`
 * if the bundle has no intake form or the shape can't be parsed.
 */
export function parseIntakeForm(raw: unknown): IntakeFormSchema | null {
  const root = asRecord(raw);
  // Accept either the bare form or a `{ data: form }` wrapper.
  const form = asRecord(root.intakeForm ?? root.form ?? root.data ?? root);

  const questions = pickQuestionsArray(form)
    .map(mapQuestion)
    .filter((q): q is IntakeQuestion => q !== null);

  if (questions.length === 0) return null;

  const schema: IntakeFormSchema = { questions };
  const id = stringOr(form.id);
  if (id) schema.id = id;
  const title = stringOr(form.title ?? form.name);
  if (title) schema.title = title;
  const description = stringOr(form.description);
  if (description) schema.description = description;

  return schema;
}

// ─── Per-type answer values (UI state) ─────────────────────────────────────

export interface FileAttachmentValue {
  name: string;
  /** Base64-encoded content (no `data:` URI prefix). */
  data: string;
  contentType?: string;
}

export interface DateRangeValue {
  startDate: string;
  /** `null` = indefinite. */
  endDate: string | null;
}

export interface BmiValue {
  /** Inches. */
  height: string;
  /** Pounds. */
  weight: number;
  bmi: number;
}

export type AnswerValue =
  | string
  | string[]
  | boolean
  | DateRangeValue
  | BmiValue
  | FileAttachmentValue[]
  | null
  | undefined;

// ─── Per-type validation ───────────────────────────────────────────────────

const VISIT_TYPES = new Set([
  "NO_SHOW",
  "ASYNC_TEXT_EMAIL",
  "SYNC_VIDEO",
  "SYNC_PHONE",
  "ORDER_FORM",
]);

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isBlank(value: AnswerValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object" && value !== null) {
    // DateRange / Bmi / FileAttachment[] — handled by type-specific branches.
    return false;
  }
  return false;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

/** Returns `{ ok: true }` if the answer satisfies the question's constraints. */
export function validateAnswer(
  question: IntakeQuestion,
  value: AnswerValue
): ValidationResult {
  if (question.type === "STATEMENT") return { ok: true };

  if (isBlank(value)) {
    return question.required
      ? { ok: false, error: "This field is required." }
      : { ok: true };
  }

  switch (question.type) {
    case "TEXT":
      return { ok: typeof value === "string" };

    case "BOOLEAN":
      if (typeof value === "boolean") return { ok: true };
      return { ok: false, error: "Pick yes or no." };

    case "DATE":
      if (typeof value === "string" && ISO_DATE_RE.test(value)) return { ok: true };
      return { ok: false, error: "Use a YYYY-MM-DD date." };

    case "DATERANGE": {
      const r = value as DateRangeValue;
      if (!ISO_DATE_RE.test(r?.startDate ?? "")) {
        return { ok: false, error: "Start date is required." };
      }
      if (r.endDate != null && r.endDate !== "" && !ISO_DATE_RE.test(r.endDate)) {
        return { ok: false, error: "Use a YYYY-MM-DD end date." };
      }
      if (r.endDate && r.endDate <= r.startDate) {
        return { ok: false, error: "End date must be after start." };
      }
      return { ok: true };
    }

    case "SINGLESELECT": {
      if (typeof value !== "string") return { ok: false };
      const options = question.options ?? [];
      if (!options.includes(value)) {
        return { ok: false, error: "Pick one of the options." };
      }
      return { ok: true };
    }

    case "MULTISELECT": {
      if (!Array.isArray(value)) return { ok: false };
      const options = new Set(question.options ?? []);
      const allInOptions = value.every(
        (v) => typeof v === "string" && options.has(v)
      );
      if (!allInOptions) {
        return { ok: false, error: "Some selections aren't valid options." };
      }
      return { ok: true };
    }

    case "FILE":
    case "WIDGET_USER_ID_DOCUMENT": {
      if (Array.isArray(value)) {
        const items = value as unknown[];
        const allValid = items.every((item) => {
          if (!item || typeof item !== "object") return false;
          const f = item as Record<string, unknown>;
          return typeof f.name === "string" && typeof f.data === "string";
        });
        if (allValid) return { ok: true };
      }
      return { ok: false, error: "Attach a file." };
    }

    case "WIDGET_BMI": {
      const bmi = value as BmiValue;
      const h = Number(bmi?.height);
      const w = Number(bmi?.weight);
      const b = Number(bmi?.bmi);
      if (h > 0 && w > 0 && b > 0) return { ok: true };
      return { ok: false, error: "Enter height and weight." };
    }

    case "WIDGET_STATE_PICKER": {
      if (typeof value === "string" && /^[A-Z]{2}$/.test(value)) return { ok: true };
      return { ok: false, error: "Pick a US state." };
    }

    case "WIDGET_VISIT_TYPE": {
      if (typeof value === "string" && VISIT_TYPES.has(value)) return { ok: true };
      return { ok: false, error: "Pick a visit type." };
    }

    default:
      // Unknown types — accept whatever string the user typed.
      return { ok: true };
  }
}

// ─── Per-type encoder → CareValidate Form-ID-based question payload ────────

/**
 * Encodes one user-supplied answer into the `{ questionId, answer }` shape
 * the CareValidate `/dynamic-case` endpoint expects in Form-ID-based mode.
 *
 * Returns `null` when:
 *  - The question is a STATEMENT (skipped from the payload entirely), or
 *  - The optional question has no answer (skipped).
 */
export function encodeAnswer(
  question: IntakeQuestion,
  value: AnswerValue
): CreateCaseQuestionAnswer | null {
  if (question.type === "STATEMENT") return null;
  if (isBlank(value) && !question.required) return null;

  const base = { questionId: question.questionId };

  switch (question.type) {
    case "TEXT":
    case "SINGLESELECT":
    case "WIDGET_VISIT_TYPE":
      return { ...base, answer: String(value ?? "") };

    case "BOOLEAN":
      return { ...base, answer: value ? "true" : "false" };

    case "DATE":
      return { ...base, answer: String(value ?? "") };

    case "DATERANGE":
      // Form-ID-based: send the structured `{ startDate, endDate }` object.
      return {
        ...base,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answer: value as any,
      };

    case "MULTISELECT":
      // Form-ID-based: array of strings (not a JSON-encoded string).
      return {
        ...base,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answer: value as any,
      };

    case "FILE":
    case "WIDGET_USER_ID_DOCUMENT":
      return {
        ...base,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answer: value as any,
      };

    case "WIDGET_BMI": {
      const v = value as BmiValue;
      return {
        ...base,
        // Form-ID-based: structured object with height as string, weight & bmi as numbers.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        answer: {
          height: String(v.height),
          weight: Number(v.weight),
          bmi: Number(v.bmi),
        } as any,
      };
    }

    case "WIDGET_STATE_PICKER":
      // Form-ID-based: 2-character US state code.
      return { ...base, answer: String(value ?? "").toUpperCase() };

    default:
      return { ...base, answer: String(value ?? "") };
  }
}

/**
 * Encodes one user-supplied answer for the **Form-Title-based** path
 * (`POST /my-requests/cases/:caseId/forms`, doc #7). Per the CareValidate
 * spec, this path expects primitive answers serialised as strings:
 *
 *  - BOOLEAN   → `"true"` / `"false"`
 *  - DATE      → `"YYYY-MM-DD"`
 *  - DATERANGE → human-readable string (`"Jan 1, 2024 - indefinite"`)
 *  - MULTISELECT → JSON-stringified array of strings
 *  - WIDGET_BMI  → JSON-stringified `{height, weight, bmi}` object
 *  - FILE / WIDGET_USER_ID_DOCUMENT → array of `{name, data, contentType}` (non-string)
 *  - STATEMENT   → omitted from the payload
 *
 * Returns `null` for STATEMENT or for blank-optional answers, mirroring
 * {@link encodeAnswer}.
 */
export function encodeAnswerFormTitleBased(
  question: IntakeQuestion,
  value: AnswerValue
): AddCaseFormQuestion | null {
  if (question.type === "STATEMENT") return null;
  if (isBlank(value) && !question.required) return null;

  const base: AddCaseFormQuestion = {
    questionId: question.questionId,
    question: question.question,
    type: question.type,
    required: question.required,
  };
  if (question.options?.length) base.options = question.options;
  if (question.phi) base.phi = true;
  if (question.hint) base.hint = question.hint;
  if (question.placeholder) base.placeholder = question.placeholder;

  switch (question.type) {
    case "TEXT":
    case "SINGLESELECT":
    case "DATE":
    case "WIDGET_VISIT_TYPE":
    case "WIDGET_STATE_PICKER":
      return { ...base, answer: String(value ?? "") };

    case "BOOLEAN":
      return { ...base, answer: value ? "true" : "false" };

    case "DATERANGE": {
      const r = value as DateRangeValue;
      const startDate = r?.startDate ?? "";
      const endLabel = r?.endDate ?? "indefinite";
      return { ...base, answer: `${startDate} - ${endLabel}` };
    }

    case "MULTISELECT":
      return { ...base, answer: JSON.stringify(Array.isArray(value) ? value : []) };

    case "WIDGET_BMI": {
      const v = value as BmiValue;
      return {
        ...base,
        answer: JSON.stringify({
          height: Number(v.height) || 0,
          weight: Number(v.weight) || 0,
          bmi: Number(v.bmi) || 0,
        }),
      };
    }

    case "FILE":
    case "WIDGET_USER_ID_DOCUMENT":
      // Non-string payload — answer stays an array of file objects.
      return { ...base, answer: value };

    default:
      return { ...base, answer: String(value ?? "") };
  }
}

// ─── Multi-step paging ─────────────────────────────────────────────────────

/**
 * Splits questions into pages of `size` *non-statement* items each. STATEMENT
 * questions are pinned to whichever page they precede so the page they
 * introduce starts with the matching context.
 */
export function chunkQuestions(
  questions: IntakeQuestion[],
  size = 3
): IntakeQuestion[][] {
  if (questions.length === 0) return [];
  const pages: IntakeQuestion[][] = [];
  let buf: IntakeQuestion[] = [];
  let count = 0;

  for (const q of questions) {
    buf.push(q);
    if (q.type !== "STATEMENT") count += 1;
    if (count >= size) {
      pages.push(buf);
      buf = [];
      count = 0;
    }
  }
  if (buf.length) pages.push(buf);
  return pages;
}

// ─── Helpers for the dialog's identity step ────────────────────────────────

export const US_STATES: Array<{ code: string; name: string }> = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

/**
 * Computes BMI from height in inches and weight in pounds.
 * Returns 0 on invalid inputs.
 */
export function computeBmi(heightInches: number, weightPounds: number): number {
  if (!heightInches || !weightPounds) return 0;
  const bmi = (weightPounds / (heightInches * heightInches)) * 703;
  return Math.round(bmi * 10) / 10;
}
