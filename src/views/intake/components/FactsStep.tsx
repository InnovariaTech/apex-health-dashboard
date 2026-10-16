import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSubmitFacts } from "@/hooks/intake/useIntake";
import { ChoiceList, ThemedQuestion, usePlaceholder } from "@/shared/form-renderer";
import type { FactPrompt, FactsStep } from "@/types/intake/intake_types";

/**
 * The prelude: demographics we don't already hold. Every listed prompt is
 * REQUIRED (optionalIfKnown just means "we'd have filled it if we had it").
 * A facts step coming back after submit = "these didn't take".
 *
 * Each prompt is a themed question whose type follows how it's collected (`rendering-the-theme.md`
 * §1): choice → single_select, number → number, dateOfBirth → date_text, others → free_text.
 */

const QUESTION_TYPE: Record<string, string> = {
  choice: "single_select",
  number: "number",
  dateOfBirth: "date_text",
};
const typeFor = (p: FactPrompt) => QUESTION_TYPE[p.collect] ?? "free_text";

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
  const themed = usePlaceholder(prompt.key, typeFor(prompt));
  switch (prompt.collect) {
    case "dateOfBirth":
      return (
        <input
          type="date"
          className="apx-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "choice":
      return (
        <ChoiceList
          name={prompt.key}
          options={prompt.options ?? []}
          selected={value ? [value] : []}
          multi={false}
          onChange={(next) => onChange(next[0] ?? "")}
        />
      );
    case "number":
      return (
        <input
          type="number"
          className="apx-input"
          value={value}
          placeholder={themed || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "zip":
      return (
        <input
          inputMode="numeric"
          className="apx-input"
          value={value}
          placeholder={themed || "ZIP code"}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <input
          className="apx-input"
          value={value}
          placeholder={themed || undefined}
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
    <>
      <div>
        <h2 className="apx-question-text" style={{ fontSize: "1.15em" }}>
          A few details to get started
        </h2>
        <p className="apx-help-text">We use these to confirm you're eligible.</p>
      </div>

      {step.prompts.map((p) => (
        <ThemedQuestion key={p.key} type={typeFor(p)} fieldKey={p.key} className="gap-1.5">
          <label className="apx-question-text">{p.prompt}</label>
          {p.helpText && <p className="apx-help-text">{p.helpText}</p>}
          <PromptField
            prompt={p}
            value={values[p.key] ?? ""}
            onChange={(v) => setValues((s) => ({ ...s, [p.key]: v }))}
          />
        </ThemedQuestion>
      ))}

      {error && <p className="apx-error" role="alert">{error}</p>}

      {/* Width on a wrapper: the theme owns the button's own width. */}
      <div className="flex">
        <button
          onClick={onSubmit}
          disabled={!allAnswered || submit.isPending}
          className="apx-button-primary flex-1"
        >
          {submit.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Continue
        </button>
      </div>
    </>
  );
}
