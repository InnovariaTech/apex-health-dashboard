import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  ChoiceList,
  ContentBlocks,
  FormQuestion,
  TextAnswer,
  ThemedQuestion,
  UploadNotice,
} from "@/shared/form-renderer";
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
 * One question's answer, drawn with the shared form parts (the builder preview uses the same):
 * choices with their follow-ups, a typed answer, or the upload notice.
 */
function FieldView({
  field,
  state,
  set,
}: {
  field: IntakeField;
  state: Local;
  set: (updater: (s: Local) => Local) => void;
}) {
  if (field.type === "single_select" || field.type === "multi_select") {
    const options = field.options ?? [];
    return (
      <ChoiceList
        name={field.key}
        options={options}
        selected={state.sel[field.key] ?? []}
        multi={field.type === "multi_select"}
        onChange={(next) => set((s) => ({ ...s, sel: { ...s.sel, [field.key]: next } }))}
        renderBelow={(o) => {
          const fu = options.find((x) => x.key === o.key)?.followup;
          if (!fu) return null;
          return (
            <ThemedQuestion type={String(fu.type)} fieldKey={fu.key} className="mt-2 pl-1">
              <label className="apx-help-text" htmlFor={`fu-${fu.key}`}>
                {fu.prompt}
                {fu.required && " *"}
              </label>
              <TextAnswer
                id={`fu-${fu.key}`}
                fieldKey={fu.key}
                type={String(fu.type)}
                value={state.follow[field.key]?.[fu.key] ?? ""}
                onChange={(v) =>
                  set((s) => ({
                    ...s,
                    follow: { ...s.follow, [field.key]: { ...(s.follow[field.key] ?? {}), [fu.key]: v } },
                  }))
                }
              />
            </ThemedQuestion>
          );
        }}
      />
    );
  }

  if (field.type === "document_upload") return <UploadNotice />;

  return (
    <TextAnswer
      fieldKey={field.key}
      type={field.type}
      value={state.txt[field.key] ?? ""}
      onChange={(v) => set((s) => ({ ...s, txt: { ...s.txt, [field.key]: v } }))}
      maxLength={field.constraints?.maxLength}
    />
  );
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

      <ContentBlocks content={step.content} />

      {step.fields.map((f, i) => (
        <FormQuestion
          key={f.key}
          fieldKey={f.key}
          type={f.type}
          prompt={f.prompt}
          required={f.required}
          helpText={f.helpText}
          image={f.image}
          error={showErrors ? fieldErrors[i] ?? null : null}
        >
          <FieldView field={f} state={state} set={setState} />
        </FormQuestion>
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
