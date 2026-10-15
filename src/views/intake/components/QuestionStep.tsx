import { useState } from "react";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import IntakeContentBlocks from "./IntakeContentBlocks";
import { ThemedQuestion, useImagePlacement, usePlaceholder } from "@/components/theme/ThemeScope";
import { useBack, useSubmitAnswer } from "@/hooks/intake/useIntake";
import type {
  IntakeAnswer,
  IntakeField,
  QuestionStep,
} from "@/types/intake/intake_types";

/**
 * One screen of the form. `fields` is an array (the server groups consecutive
 * plain questions) — collect all, then POST one at a time. Unknown field types
 * hard-fail rather than silently skip. Document uploads render a picker but
 * cannot submit yet (server side isn't built) — we block rather than send an
 * empty `fileRefs`.
 *
 * Drawn with the theme's parts (`apx-question`, `apx-option`, `apx-input`…): the look comes from
 * the walk's theme, placeholder words too. A follow-up field is its own themed question (its own
 * key and type), as the theme rules expect.
 */

interface Local {
  sel: Record<string, string[]>;
  txt: Record<string, string>;
  follow: Record<string, Record<string, string>>;
}

function seed(step: QuestionStep): Local {
  const sel: Record<string, string[]> = {};
  const txt: Record<string, string> = {};
  const follow: Record<string, Record<string, string>> = {};
  for (const f of step.fields) {
    const a = step.answers?.[f.key] as
      | { selected?: string[]; value?: unknown; followups?: Record<string, unknown> }
      | string
      | number
      | undefined;
    if (f.type === "single_select" || f.type === "multi_select") {
      if (a && typeof a === "object" && Array.isArray(a.selected)) {
        sel[f.key] = a.selected;
        if (a.followups) {
          const fu: Record<string, string> = {};
          for (const [k, v] of Object.entries(a.followups)) fu[k] = String(v);
          follow[f.key] = fu;
        }
      } else sel[f.key] = [];
    } else {
      if (a && typeof a === "object" && "value" in a) txt[f.key] = String(a.value);
      else if (typeof a === "string" || typeof a === "number") txt[f.key] = String(a);
      else txt[f.key] = "";
    }
  }
  return { sel, txt, follow };
}

function validate(field: IntakeField, state: Local): string | null {
  const c = field.constraints ?? {};
  if (field.type === "single_select" || field.type === "multi_select") {
    const chosen = state.sel[field.key] ?? [];
    if (field.required && chosen.length === 0) return "Please choose an option.";
    if (c.minSelections && chosen.length < c.minSelections)
      return `Choose at least ${c.minSelections}.`;
    if (c.maxSelections && chosen.length > c.maxSelections)
      return `Choose at most ${c.maxSelections}.`;
    // required followups
    for (const opt of field.options ?? []) {
      if (opt.followup?.required && chosen.includes(opt.key)) {
        if (!(state.follow[field.key]?.[opt.followup.key] ?? "").trim())
          return `Please complete "${opt.followup.prompt}".`;
      }
    }
    return null;
  }
  const val = (state.txt[field.key] ?? "").trim();
  if (field.required && !val) return "This is required.";
  if (val && field.type !== "number" && c.pattern) {
    const isSentinel = (c.sentinelValues ?? []).includes(val);
    if (!isSentinel && !new RegExp(c.pattern).test(val))
      return c.patternMessage ?? "Please check the format.";
  }
  if (val && c.maxLength && val.length > c.maxLength)
    return `Keep it under ${c.maxLength} characters.`;
  if (field.type === "number" && val && Number.isNaN(Number(val)))
    return "Please enter a number.";
  return null;
}

function buildAnswer(field: IntakeField, state: Local): IntakeAnswer {
  if (field.type === "single_select" || field.type === "multi_select") {
    const followups = state.follow[field.key];
    const hasFollow = followups && Object.keys(followups).length > 0;
    return {
      kind: "select",
      selected: state.sel[field.key] ?? [],
      ...(hasFollow ? { followups } : {}),
    };
  }
  if (field.type === "number") {
    return { kind: "number", value: Number(state.txt[field.key] ?? 0) };
  }
  return { kind: "text", value: state.txt[field.key] ?? "" };
}

/**
 * One question: prompt, help text, the answer, its error, and the question's image where the theme
 * puts it (top / middle / bottom, or a column on the left / right that stacks on top on phones).
 */
function Question({
  field,
  error,
  children,
}: {
  field: IntakeField;
  error: string | null;
  children: React.ReactNode;
}) {
  const placement = useImagePlacement(field.key, field.type);
  const side = field.image && (placement === "left" || placement === "right") ? placement : undefined;
  const image = field.image && (
    <div className="apx-question-image-row">
      <img className="apx-question-image" src={field.image.url} alt={field.image.alt} loading="lazy" />
    </div>
  );

  return (
    <ThemedQuestion type={field.type} fieldKey={field.key} imageSide={side}>
      {/* First in the DOM for left/right too, so a phone that drops the columns shows it on top. */}
      {(side || placement === "top") && image}
      <div className="apx-question-body gap-1.5">
        <label className="apx-question-text">
          {field.prompt}
          {field.required && <span style={{ color: "var(--apx-color-error, #b23a3a)" }}> *</span>}
        </label>
        {field.helpText && <p className="apx-help-text">{field.helpText}</p>}
        {placement === "middle" && image}
        {children}
        {error && <p className="apx-error" role="alert">{error}</p>}
        {placement === "bottom" && image}
      </div>
    </ThemedQuestion>
  );
}

function FieldView({
  field,
  state,
  set,
}: {
  field: IntakeField;
  state: Local;
  set: (updater: (s: Local) => Local) => void;
}) {
  const isMulti = field.type === "multi_select";

  if (field.type === "single_select" || field.type === "multi_select") {
    const chosen = state.sel[field.key] ?? [];
    const toggle = (optKey: string, exclusive?: boolean) => {
      set((s) => {
        let next: string[];
        if (!isMulti) next = [optKey];
        else if (exclusive) next = chosen.includes(optKey) ? [] : [optKey];
        else {
          const exclusiveKeys = new Set(
            (field.options ?? []).filter((o) => o.exclusive).map((o) => o.key),
          );
          const base = chosen.filter((k) => !exclusiveKeys.has(k));
          next = base.includes(optKey)
            ? base.filter((k) => k !== optKey)
            : [...base, optKey];
        }
        return { ...s, sel: { ...s.sel, [field.key]: next } };
      });
    };
    return (
      <div className="apx-options">
        {(field.options ?? []).map((o) => {
          const on = chosen.includes(o.key);
          return (
            <div key={o.key}>
              <label className={`apx-option ${on ? "apx-option-selected" : ""}`}>
                <input
                  type={isMulti ? "checkbox" : "radio"}
                  name={field.key}
                  checked={on}
                  onChange={() => toggle(o.key, o.exclusive)}
                  className="mt-[3px] h-4 w-4 shrink-0 accent-[var(--apx-color-primary,#d30704)]"
                />
                <span className="apx-option-text">
                  <span className="apx-option-label">{o.label}</span>
                </span>
              </label>
              {on && o.followup && (
                <ThemedQuestion type={String(o.followup.type)} fieldKey={o.followup.key} className="mt-2 pl-1">
                  <label className="apx-help-text" htmlFor={`fu-${o.followup.key}`}>
                    {o.followup.prompt}
                    {o.followup.required && " *"}
                  </label>
                  <FollowupInput
                    id={`fu-${o.followup.key}`}
                    fieldKey={o.followup.key}
                    type={String(o.followup.type)}
                    value={state.follow[field.key]?.[o.followup.key] ?? ""}
                    onChange={(v) =>
                      set((s) => ({
                        ...s,
                        follow: {
                          ...s.follow,
                          [field.key]: {
                            ...(s.follow[field.key] ?? {}),
                            [o.followup!.key]: v,
                          },
                        },
                      }))
                    }
                  />
                </ThemedQuestion>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (field.type === "document_upload") {
    return (
      <div className="apx-upload">
        <div className="flex w-full flex-col items-center text-center">
          <Upload className="w-6 h-6 opacity-50" />
          <span className="mt-1.5">File upload isn't available yet.</span>
          <span className="text-[12px] opacity-70">
            This screen can't be submitted until uploads are enabled.
          </span>
        </div>
      </div>
    );
  }

  return (
    <TextInput
      fieldKey={field.key}
      type={field.type}
      value={state.txt[field.key] ?? ""}
      onChange={(v) => set((s) => ({ ...s, txt: { ...s.txt, [field.key]: v } }))}
    />
  );
}

/** A themed text/number input whose placeholder words come from the theme. */
function TextInput({
  id,
  fieldKey,
  type,
  value,
  onChange,
}: {
  id?: string;
  fieldKey: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const themed = usePlaceholder(fieldKey, type);
  // date_text keeps a format hint when the theme sets no placeholder.
  const placeholder = themed || (type === "date_text" ? "mm/dd/yyyy" : "");
  return (
    <input
      id={id}
      type={type === "number" ? "number" : "text"}
      className="apx-input"
      value={value}
      placeholder={placeholder || undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** A follow-up revealed by an option: free text or a number, styled under its own key. */
function FollowupInput(props: { id: string; fieldKey: string; type: string; value: string; onChange: (v: string) => void }) {
  return <TextInput {...props} />;
}

export default function QuestionStepView({
  step,
  token,
}: {
  step: QuestionStep;
  token: string;
}) {
  const submit = useSubmitAnswer(token);
  const back = useBack(token);
  const [state, setState] = useState<Local>(() => seed(step));
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Any unknown field type is a hard failure — never silently skipped.
  const known = new Set([
    "single_select",
    "multi_select",
    "free_text",
    "date_text",
    "number",
    "document_upload",
  ]);
  const unknown = step.fields.find((f) => !known.has(f.type));
  if (unknown) {
    throw new Error(`Unsupported intake field type: ${unknown.type}`);
  }

  const hasUpload = step.fields.some((f) => f.type === "document_upload");
  const fieldErrors = step.fields.map((f) => validate(f, state));
  const canSubmit = !hasUpload && fieldErrors.every((e) => e === null);

  const onContinue = async () => {
    setShowErrors(true);
    setError(null);
    if (!canSubmit) return;
    try {
      for (const f of step.fields) {
        await submit.mutateAsync({ key: f.key, answer: buildAnswer(f, state) });
      }
    } catch (err) {
      const data = (err as { response?: { data?: { message?: string } } })
        ?.response?.data;
      setError(data?.message ?? "Couldn't save your answer. Please try again.");
    }
  };

  const busy = submit.isPending || back.isPending;

  return (
    <>
      {step.progress && (
        <div className="apx-progress">
          <div
            className="apx-progress-bar"
            style={{ width: `${Math.min(100, step.progress.percent)}%` }}
          />
        </div>
      )}

      <IntakeContentBlocks content={step.content} />

      {step.fields.map((f, i) => (
        <Question key={f.key} field={f} error={showErrors ? fieldErrors[i] ?? null : null}>
          <FieldView field={f} state={state} set={setState} />
        </Question>
      ))}

      {error && <p className="apx-error" role="alert">{error}</p>}

      <div className="apx-actions">
        {step.canGoBack ? (
          <button
            onClick={() => back.mutate()}
            disabled={busy}
            className="apx-button-secondary"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={onContinue}
          disabled={busy || hasUpload}
          className="apx-button-primary flex-1 sm:flex-none sm:min-w-[160px]"
        >
          {submit.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Continue
        </button>
      </div>
    </>
  );
}
