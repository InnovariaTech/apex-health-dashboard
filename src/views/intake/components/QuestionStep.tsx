import { useState } from "react";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import IntakeContentBlocks from "./IntakeContentBlocks";
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
 */

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#e11816]/25 focus:border-[#e11816]";

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
      <div className="space-y-2">
        {(field.options ?? []).map((o) => {
          const on = chosen.includes(o.key);
          return (
            <div key={o.key}>
              <label
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer ${
                  on ? "border-[#e11816] bg-red-50" : "border-slate-300"
                }`}
              >
                <input
                  type={isMulti ? "checkbox" : "radio"}
                  name={field.key}
                  checked={on}
                  onChange={() => toggle(o.key, o.exclusive)}
                  className="accent-[#e11816]"
                />
                <span className="text-[15px]">{o.label}</span>
              </label>
              {on && o.followup && (
                <input
                  className={`${INPUT} mt-2`}
                  placeholder={o.followup.prompt}
                  value={state.follow[field.key]?.[o.followup.key] ?? ""}
                  onChange={(e) =>
                    set((s) => ({
                      ...s,
                      follow: {
                        ...s.follow,
                        [field.key]: {
                          ...(s.follow[field.key] ?? {}),
                          [o.followup!.key]: e.target.value,
                        },
                      },
                    }))
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (field.type === "document_upload") {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
        <p className="text-sm text-slate-600 mt-2">
          File upload isn't available yet.
        </p>
        <p className="text-[12px] text-slate-400 mt-0.5">
          This screen can't be submitted until uploads are enabled.
        </p>
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        className={INPUT}
        value={state.txt[field.key] ?? ""}
        onChange={(e) =>
          set((s) => ({ ...s, txt: { ...s.txt, [field.key]: e.target.value } }))
        }
      />
    );
  }

  // free_text | date_text (both free text; date_text just has a pattern)
  return (
    <input
      className={INPUT}
      value={state.txt[field.key] ?? ""}
      placeholder={field.type === "date_text" ? "mm/dd/yyyy" : ""}
      onChange={(e) =>
        set((s) => ({ ...s, txt: { ...s.txt, [field.key]: e.target.value } }))
      }
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
    <div className="space-y-6">
      {step.progress && (
        <div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e11816] transition-all"
              style={{ width: `${Math.min(100, step.progress.percent)}%` }}
            />
          </div>
        </div>
      )}

      <IntakeContentBlocks content={step.content} />

      <div className="space-y-7">
        {step.fields.map((f, i) => (
          <div key={f.key} className="space-y-2">
            <label className="block text-[16px] font-medium text-slate-900">
              {f.prompt}
              {f.required && <span className="text-red-400"> *</span>}
            </label>
            {f.helpText && (
              <p className="text-[13px] text-slate-500 -mt-1">{f.helpText}</p>
            )}
            <FieldView field={f} state={state} set={setState} />
            {showErrors && fieldErrors[i] && (
              <p className="text-[13px] text-red-600">{fieldErrors[i]}</p>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        {step.canGoBack && (
          <button
            onClick={() => back.mutate()}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-3 text-[15px] text-slate-700 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        <button
          onClick={onContinue}
          disabled={busy || hasUpload}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#e11816] hover:bg-[#c3140f] text-white py-3 text-[15px] font-medium disabled:opacity-50"
        >
          {submit.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Continue
        </button>
      </div>
    </div>
  );
}
