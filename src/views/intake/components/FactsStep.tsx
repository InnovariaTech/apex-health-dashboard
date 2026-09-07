import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSubmitFacts } from "@/hooks/intake/useIntake";
import type { FactPrompt, FactsStep } from "@/types/intake/intake_types";

/**
 * The prelude: demographics we don't already hold. Every listed prompt is
 * REQUIRED (optionalIfKnown just means "we'd have filled it if we had it").
 * A facts step coming back after submit = "these didn't take".
 */

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#e11816]/25 focus:border-[#e11816]";

function collectError(err: unknown): string {
  const data = (err as { response?: { data?: { message?: string } } })?.response
    ?.data;
  return data?.message ?? "Something went wrong. Please try again.";
}

function PromptField({
  prompt,
  value,
  onChange,
}: {
  prompt: FactPrompt;
  value: string;
  onChange: (v: string) => void;
}) {
  switch (prompt.collect) {
    case "dateOfBirth":
      return (
        <input
          type="date"
          className={INPUT}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "choice":
      return (
        <div className="space-y-2">
          {(prompt.options ?? []).map((o) => (
            <label
              key={o.key}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer ${
                value === o.key
                  ? "border-[#e11816] bg-red-50"
                  : "border-slate-300"
              }`}
            >
              <input
                type="radio"
                name={prompt.key}
                checked={value === o.key}
                onChange={() => onChange(o.key)}
                className="accent-[#e11816]"
              />
              <span className="text-[15px]">{o.label}</span>
            </label>
          ))}
        </div>
      );
    case "number":
      return (
        <input
          type="number"
          className={INPUT}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "zip":
      return (
        <input
          inputMode="numeric"
          className={INPUT}
          value={value}
          placeholder="ZIP code"
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <input
          className={INPUT}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export default function FactsStepView({
  step,
  token,
}: {
  step: FactsStep;
  token: string;
}) {
  const submit = useSubmitFacts(token);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const p of step.prompts) {
      const v = step.values?.[p.key];
      if (v != null) seed[p.key] = String(v);
    }
    return seed;
  });
  const [error, setError] = useState<string | null>(null);

  const allAnswered = step.prompts.every((p) => (values[p.key] ?? "").trim());

  const onSubmit = async () => {
    setError(null);
    const payload: Record<string, unknown> = {};
    for (const p of step.prompts) payload[p.key] = values[p.key];
    try {
      await submit.mutateAsync(payload);
    } catch (err) {
      setError(collectError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          A few details to get started
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          We use these to confirm you're eligible.
        </p>
      </div>

      <div className="space-y-5">
        {step.prompts.map((p) => (
          <div key={p.key} className="space-y-1.5">
            <label className="block text-[15px] font-medium text-slate-800">
              {p.prompt}
            </label>
            {p.helpText && (
              <p className="text-[13px] text-slate-500">{p.helpText}</p>
            )}
            <PromptField
              prompt={p}
              value={values[p.key] ?? ""}
              onChange={(v) => setValues((s) => ({ ...s, [p.key]: v }))}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={onSubmit}
        disabled={!allAnswered || submit.isPending}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#e11816] hover:bg-[#c3140f] text-white py-3 text-[15px] font-medium disabled:opacity-50"
      >
        {submit.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Continue
      </button>
    </div>
  );
}
