// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Upload, Paperclip, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  type AllowedUploadMimeType,
} from "@/types/care-validate/document_types";
import { fileToBase64, isAllowedUploadMimeType } from "@/api/care-validate/files";
import {
  computeBmi,
  US_STATES,
  type AnswerValue,
  type BmiValue,
  type DateRangeValue,
  type FileAttachmentValue,
  type IntakeQuestion,
} from "@/views/patient/utils/intakeFormUtils";

interface IntakeQuestionProps {
  question: IntakeQuestion;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  error?: string;
}

const ACCEPT_LIST = ALLOWED_UPLOAD_MIME_TYPES.join(",");

const VISIT_TYPE_OPTIONS = [
  { value: "SYNC_VIDEO", label: "Video visit" },
  { value: "SYNC_PHONE", label: "Phone visit" },
  { value: "ASYNC_TEXT_EMAIL", label: "Async (text / email)" },
  { value: "ORDER_FORM", label: "Order form only" },
  { value: "NO_SHOW", label: "No-show" },
];

export default function IntakeQuestionInput({
  question,
  value,
  onChange,
  error,
}: IntakeQuestionProps) {
  return (
    <div className="space-y-2">
      {question.type !== "STATEMENT" && (
        <Label
          htmlFor={`q-${question.questionId}`}
          className="text-[13px] font-medium leading-snug"
        >
          {question.question}
          {question.required ? (
            <span className="text-primary ml-1">*</span>
          ) : null}
          {question.phi ? (
            <span className="apex-eyebrow ml-2 inline-flex items-center gap-1 align-middle">
              PHI
            </span>
          ) : null}
        </Label>
      )}
      <QuestionBody
        question={question}
        value={value}
        onChange={onChange}
      />
      {question.hint && question.type !== "STATEMENT" && (
        <p className="text-[11px] text-muted-foreground">{question.hint}</p>
      )}
      {error && (
        <p className="text-[11px]" style={{ color: "var(--att)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function QuestionBody({ question, value, onChange }: IntakeQuestionProps) {
  const id = `q-${question.questionId}`;

  switch (question.type) {
    case "STATEMENT":
      return (
        <div
          className="apex-card p-3.5 text-[13px] text-foreground leading-relaxed"
          style={{
            borderColor: "var(--apex-accent-soft)",
            background: "var(--apex-accent-soft)",
          }}
        >
          {question.question}
        </div>
      );

    case "TEXT":
      return (
        <Input
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? ""}
        />
      );

    case "BOOLEAN":
      return (
        <div className="flex gap-2">
          <BoolPill active={value === true} onClick={() => onChange(true)}>
            Yes
          </BoolPill>
          <BoolPill active={value === false} onClick={() => onChange(false)}>
            No
          </BoolPill>
        </div>
      );

    case "DATE":
      return (
        <Input
          id={id}
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono"
        />
      );

    case "DATERANGE":
      return <DateRangeInput value={value as DateRangeValue} onChange={onChange} />;

    case "SINGLESELECT":
      return (
        <Select
          value={typeof value === "string" ? value : undefined}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={question.placeholder ?? "Select…"} />
          </SelectTrigger>
          <SelectContent>
            {(question.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "MULTISELECT":
      return (
        <MultiSelect
          options={question.options ?? []}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
        />
      );

    case "FILE":
    case "WIDGET_USER_ID_DOCUMENT":
      return (
        <FileInput
          id={id}
          value={
            Array.isArray(value) ? (value as FileAttachmentValue[]) : []
          }
          onChange={onChange}
          multiple={question.type === "FILE"}
        />
      );

    case "WIDGET_BMI":
      return <BmiInput value={value as BmiValue} onChange={onChange} />;

    case "WIDGET_STATE_PICKER":
      return (
        <Select
          value={typeof value === "string" ? value : undefined}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select state…" />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map((s) => (
              <SelectItem key={s.code} value={s.code}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "WIDGET_VISIT_TYPE":
      return (
        <div className="flex flex-wrap gap-2">
          {VISIT_TYPE_OPTIONS.map((opt) => (
            <BoolPill
              key={opt.value}
              active={value === opt.value}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </BoolPill>
          ))}
        </div>
      );

    default:
      return (
        <Input
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? ""}
        />
      );
  }
}

// ─── Sub-inputs ─────────────────────────────────────────────────────────────

function BoolPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full border text-[13px] transition-colors ${
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-ink-2 border-border hover:border-[var(--line-2)]"
      }`}
    >
      {children}
    </button>
  );
}

function DateRangeInput({
  value,
  onChange,
}: {
  value: DateRangeValue | null | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  const startDate = value?.startDate ?? "";
  const endDate = value?.endDate ?? "";
  const indefinite = value?.endDate === null;

  const update = (patch: Partial<DateRangeValue>) => {
    onChange({
      startDate: patch.startDate ?? startDate,
      endDate:
        "endDate" in patch ? patch.endDate ?? null : indefinite ? null : endDate,
    });
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <span className="apex-eyebrow mb-1 block">Start</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => update({ startDate: e.target.value })}
            className="font-mono"
          />
        </div>
        <div>
          <span className="apex-eyebrow mb-1 block">End</span>
          <Input
            type="date"
            value={indefinite ? "" : endDate}
            disabled={indefinite}
            onChange={(e) => update({ endDate: e.target.value })}
            className="font-mono"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-[12px] text-ink-2">
        <input
          type="checkbox"
          checked={indefinite}
          onChange={(e) => update({ endDate: e.target.checked ? null : "" })}
          className="accent-[var(--apex-accent)]"
        />
        Ongoing / indefinite
      </label>
    </div>
  );
}

function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: AnswerValue) => void;
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3.5 py-1.5 rounded-full border text-[13px] transition-colors ${
              active
                ? "bg-foreground text-background border-foreground"
                : "bg-card text-ink-2 border-border hover:border-[var(--line-2)]"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function FileInput({
  id,
  value,
  onChange,
  multiple,
}: {
  id: string;
  value: FileAttachmentValue[];
  onChange: (v: AnswerValue) => void;
  multiple: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setWarning(null);
    try {
      const next: FileAttachmentValue[] = multiple ? [...value] : [];
      for (const file of Array.from(files)) {
        if (!isAllowedUploadMimeType(file.type)) {
          setWarning(`${file.name}: unsupported type (${file.type || "unknown"}).`);
          continue;
        }
        const data = await fileToBase64(file);
        next.push({
          name: file.name,
          data,
          contentType: file.type as AllowedUploadMimeType,
        });
      }
      onChange(next);
    } finally {
      setBusy(false);
    }
  };

  const remove = (idx: number) =>
    onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <label
        className={`block cursor-pointer ${busy ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          id={id}
          type="file"
          accept={ACCEPT_LIST}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="w-full border border-dashed border-border rounded-[12px] p-4 text-center bg-surface-2 hover:border-[var(--line-2)] transition-colors">
          <Upload className="w-5 h-5 text-ink-3 mx-auto mb-1.5" />
          <p className="text-[13px] font-medium text-foreground">
            {busy ? "Encoding…" : "Click to attach"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            PDF, DOC, CSV, TXT, JPEG, PNG, SVG, TIFF, WebP
          </p>
        </div>
      </label>

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((f, idx) => (
            <li
              key={`${f.name}-${idx}`}
              className="flex items-center gap-2 px-3 py-2 rounded-[10px] border border-border bg-card text-[12.5px]"
            >
              <Paperclip className="w-3.5 h-3.5 text-ink-3 flex-shrink-0" />
              <span className="truncate flex-1">{f.name}</span>
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label="Remove file"
                className="text-ink-3 hover:text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {warning && (
        <p className="text-[11px]" style={{ color: "var(--att)" }}>
          {warning}
        </p>
      )}
    </div>
  );
}

function BmiInput({
  value,
  onChange,
}: {
  value: BmiValue | null | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  const [height, setHeight] = useState<string>(value?.height ?? "");
  const [weight, setWeight] = useState<string>(
    value?.weight != null ? String(value.weight) : ""
  );

  useEffect(() => {
    const h = Number(height);
    const w = Number(weight);
    if (h > 0 && w > 0) {
      onChange({ height: String(h), weight: w, bmi: computeBmi(h, w) });
    } else if (height === "" && weight === "") {
      onChange(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, weight]);

  const bmi = computeBmi(Number(height) || 0, Number(weight) || 0);

  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <span className="apex-eyebrow mb-1 block">Height (in)</span>
        <Input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="font-mono"
          inputMode="numeric"
        />
      </div>
      <div>
        <span className="apex-eyebrow mb-1 block">Weight (lb)</span>
        <Input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="font-mono"
          inputMode="numeric"
        />
      </div>
      <div>
        <span className="apex-eyebrow mb-1 block">BMI</span>
        <div className="h-[34px] rounded-[8px] border border-border bg-secondary px-3 flex items-center font-mono text-[14px] text-foreground">
          {bmi > 0 ? bmi.toFixed(1) : "—"}
        </div>
      </div>
    </div>
  );
}
