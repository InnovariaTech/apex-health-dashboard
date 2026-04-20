import type { CaseDetailsItem } from "@/types/care-validate/case_types";

export type DynamicCaseFieldType =
  | "TEXT"
  | "DROPDOWN"
  | "SINGLESELECT"
  | "MULTISELECT"
  | "UNKNOWN";

export interface DynamicCaseField {
  responseId: string;
  index: number;
  type: DynamicCaseFieldType;
  label: string;
  options: string[];
  required: boolean;
  isPHI: boolean;
  value: unknown;
}

export interface DynamicCaseForm {
  id: string;
  name: string;
  description: string;
  fields: DynamicCaseField[];
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toPlainText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toStringOptions(rawOptions: unknown): string[] {
  if (!Array.isArray(rawOptions)) return [];

  return rawOptions
    .map((option) => {
      if (typeof option === "string") return option.trim();
      const row = toRecord(option);
      return String(row.label ?? row.value ?? row.text ?? "").trim();
    })
    .filter((option) => option.length > 0);
}

function parseMultiSelectValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => toPlainText(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => toPlainText(item)).filter(Boolean);
        }
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  }

  return [];
}

function resolveEffectiveType(baseType: string, options: string[]): DynamicCaseFieldType {
  const normalized = baseType.toUpperCase();
  if (normalized === "TEXT" && options.length > 0) return "DROPDOWN";
  if (normalized === "TEXT") return "TEXT";
  if (normalized === "SINGLESELECT") return "SINGLESELECT";
  if (normalized === "MULTISELECT") return "MULTISELECT";
  return "UNKNOWN";
}

function formatQuestionLabel(question: Record<string, unknown>, fallbackIndex: number): string {
  const text = toPlainText(question.text);
  if (text) return text;

  const id = String(question.id ?? "").trim();
  if (id) return `Question ${id}`;

  return `Question ${fallbackIndex + 1}`;
}

function normalizeResponseField(
  response: Record<string, unknown>,
  fallbackIndex: number
): DynamicCaseField {
  const question = toRecord(response.question);
  const responseId = String(response.id ?? `response-${fallbackIndex}`);
  const questionIndex =
    typeof question.index === "number" && Number.isFinite(question.index)
      ? question.index
      : fallbackIndex;
  const options = toStringOptions(question.options);
  const rawType = String(question.type ?? "TEXT");
  const type = resolveEffectiveType(rawType, options);
  const rawValue = response.response ?? response.text ?? response.value ?? "";
  const normalizedValue =
    type === "MULTISELECT" ? parseMultiSelectValue(rawValue) : rawValue;

  return {
    responseId,
    index: questionIndex,
    type,
    label: formatQuestionLabel(question, fallbackIndex),
    options,
    required: Boolean(question.required),
    isPHI: Boolean(question.isPHI),
    value: normalizedValue,
  };
}

function pickLatestActiveResponses(
  responses: Record<string, unknown>[]
): Record<string, unknown>[] {
  const latestByIndex = new Map<number, Record<string, unknown>>();

  responses.forEach((response, position) => {
    if (Boolean(response.isArchived)) return;

    const question = toRecord(response.question);
    const idx =
      typeof question.index === "number" && Number.isFinite(question.index)
        ? question.index
        : position;
    const createdAt = String(response.createdAt ?? "");
    const existing = latestByIndex.get(idx);

    if (!existing) {
      latestByIndex.set(idx, response);
      return;
    }

    const existingCreatedAt = String(existing.createdAt ?? "");
    if (!existingCreatedAt || createdAt > existingCreatedAt) {
      latestByIndex.set(idx, response);
    }
  });

  return Array.from(latestByIndex.values());
}

function getRawCaseFormResponses(caseDetails: CaseDetailsItem): Record<string, unknown>[] {
  const raw = caseDetails.raw ?? {};
  const source =
    (Array.isArray(raw.responses) && raw.responses) ||
    (Array.isArray(raw.formResponses) && raw.formResponses) ||
    (Array.isArray(raw.intakeResponses) && raw.intakeResponses) ||
    [];

  return source.map((item) => toRecord(item));
}

export function normalizeCaseForms(caseDetails: CaseDetailsItem): DynamicCaseForm[] {
  return getRawCaseFormResponses(caseDetails).map((formResponse, formIndex) => {
    const form = toRecord(formResponse.form);
    const rawResponseList =
      (Array.isArray(formResponse.responses) && formResponse.responses) ||
      (Array.isArray(formResponse.questionResponses) && formResponse.questionResponses) ||
      [];
    const normalizedResponses = rawResponseList.map((item) => toRecord(item));
    const latestActive = pickLatestActiveResponses(normalizedResponses);
    const fields = latestActive
      .map((response, idx) => normalizeResponseField(response, idx))
      .sort((a, b) => a.index - b.index);

    return {
      id: String(formResponse.id ?? form.id ?? `form-${formIndex}`),
      name: toPlainText(form.name) || `Form ${formIndex + 1}`,
      description: toPlainText(form.description),
      fields,
    };
  });
}

export function fieldValueToLines(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.map((item) => toPlainText(item)).filter(Boolean);
  }

  const text = toPlainText(value);
  return text ? [text] : [];
}

