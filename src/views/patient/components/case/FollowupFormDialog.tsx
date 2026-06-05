// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAddCaseForm } from "@/hooks/care-validate/useCases";
import {
  chunkQuestions,
  encodeAnswerFormTitleBased,
  validateAnswer,
  type AnswerValue,
  type IntakeQuestion,
} from "@/views/patient/utils/intakeFormUtils";
import {
  FOLLOWUP_TEMPLATES,
  instantiateTemplate,
  type FollowupTemplate,
} from "@/views/patient/utils/followupTemplates";
import type {
  AddCaseFormBody,
  AddCaseFormQuestion,
} from "@/types/care-validate/case_types";
import IntakeQuestionInput from "@/views/patient/components/treatments/IntakeQuestion";

const QUESTIONS_PER_STEP = 3;

interface FollowupFormDialogProps {
  caseId: string;
  caseTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FollowupFormDialog({
  caseId,
  caseTitle,
  open,
  onOpenChange,
}: FollowupFormDialogProps) {
  const addCaseForm = useAddCaseForm(caseId);

  /* ── Selected template + minted questions ─────────────────────────────── */
  const [template, setTemplate] = useState<FollowupTemplate | null>(null);
  const [questions, setQuestions] = useState<IntakeQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);

  const pages = useMemo(
    () => chunkQuestions(questions, QUESTIONS_PER_STEP),
    [questions]
  );

  // 0 = picker, 1..N = question pages, N+1 = review. Picker only counts before
  // a template is chosen.
  const totalSteps = template ? 1 + pages.length + 1 : 1;
  const isPickerStep = step === 0;
  const isReviewStep = template != null && step === totalSteps - 1;
  const currentQuestions: IntakeQuestion[] =
    template && !isPickerStep && !isReviewStep
      ? pages[step - 1] ?? []
      : [];

  /* ── Reset on close ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) {
      setTemplate(null);
      setQuestions([]);
      setAnswers({});
      setQuestionErrors({});
      setStep(0);
    }
  }, [open]);

  const pickTemplate = (t: FollowupTemplate) => {
    setTemplate(t);
    setQuestions(instantiateTemplate(t));
    setAnswers({});
    setQuestionErrors({});
    setStep(1);
  };

  /* ── Step nav ──────────────────────────────────────────────────────────── */
  const validateCurrentQuestions = (): boolean => {
    const errors: Record<string, string> = {};
    for (const q of currentQuestions) {
      const v = answers[q.questionId];
      const res = validateAnswer(q, v);
      if (!res.ok) errors[q.questionId] = res.error ?? "Invalid answer.";
    }
    setQuestionErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const allQuestionsValid = (): boolean => {
    const errors: Record<string, string> = {};
    for (const q of questions) {
      const v = answers[q.questionId];
      const res = validateAnswer(q, v);
      if (!res.ok) errors[q.questionId] = res.error ?? "Invalid answer.";
    }
    setQuestionErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstBadIdx = pages.findIndex((page) =>
        page.some((q) => errors[q.questionId])
      );
      if (firstBadIdx >= 0) setStep(firstBadIdx + 1);
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (!template) return;
    if (!isPickerStep && !isReviewStep) {
      if (!validateCurrentQuestions()) return;
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  /* ── Submit ────────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!template || !caseId) return;
    if (!allQuestionsValid()) return;

    const encoded: AddCaseFormQuestion[] = [];
    for (const q of questions) {
      const enc = encodeAnswerFormTitleBased(q, answers[q.questionId]);
      if (enc) encoded.push(enc);
    }
    if (encoded.length === 0) {
      toast({
        title: "Nothing to submit",
        description: "Answer at least one question before submitting.",
        variant: "destructive",
      });
      return;
    }

    const body: AddCaseFormBody = {
      formTitle: template.formTitle,
      ...(template.formDescription
        ? { formDescription: template.formDescription }
        : {}),
      questions: encoded,
    };

    try {
      await addCaseForm.mutateAsync(body);
      toast({
        title: "Follow-up submitted",
        description: caseTitle
          ? `Saved to "${caseTitle}".`
          : "Your care team will see it shortly.",
      });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Couldn't submit the form",
        description: extractMessage(err),
        variant: "destructive",
      });
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="apex-eyebrow mb-1.5">Submit a follow-up</div>
          <DialogTitle className="font-serif text-2xl font-medium tracking-[-0.02em]">
            {template ? template.title : "Choose a follow-up type"}
          </DialogTitle>
          {template?.description && (
            <p className="text-[13px] text-muted-foreground mt-1">
              {template.description}
            </p>
          )}
        </DialogHeader>

        {template && <Stepper current={step} total={totalSteps} />}

        <div className="mt-2 min-h-[260px]">
          {isPickerStep ? (
            <TemplatePicker onPick={pickTemplate} />
          ) : isReviewStep ? (
            <ReviewStep template={template} questions={questions} answers={answers} />
          ) : (
            <div className="space-y-5">
              {currentQuestions.map((q) => (
                <IntakeQuestionInput
                  key={q.questionId}
                  question={q}
                  value={answers[q.questionId]}
                  onChange={(v) =>
                    setAnswers((prev) => ({ ...prev, [q.questionId]: v }))
                  }
                  error={questionErrors[q.questionId]}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={step === 0 || addCaseForm.isPending}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>

          {isReviewStep ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={addCaseForm.isPending}
            >
              {addCaseForm.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Submit follow-up
                </>
              )}
            </Button>
          ) : isPickerStep ? (
            <span className="text-[11px] text-muted-foreground">
              Pick a template to begin.
            </span>
          ) : (
            <Button
              type="button"
              variant="dark"
              size="sm"
              onClick={goNext}
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Sub-views ─────────────────────────────────────────────────────────────── */

function Stepper({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center gap-2 mt-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="flex-1 h-1 rounded-full transition-colors"
          style={{
            background:
              i < current
                ? "var(--apex-accent)"
                : i === current
                  ? "var(--foreground)"
                  : "var(--secondary)",
          }}
        />
      ))}
    </div>
  );
}

function TemplatePicker({
  onPick,
}: {
  onPick: (template: FollowupTemplate) => void;
}) {
  return (
    <div className="grid gap-2.5">
      {FOLLOWUP_TEMPLATES.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            className="apex-card text-left px-[18px] py-4 flex items-center gap-3.5 transition-all duration-150 hover:-translate-y-px hover:border-[var(--line-2)] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <div
              className="w-10 h-10 rounded-[10px] grid place-items-center flex-shrink-0"
              style={{ backgroundColor: "var(--apex-accent-soft)" }}
            >
              <Icon className="w-5 h-5" style={{ color: "var(--apex-accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-medium text-foreground">{t.title}</p>
              <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-snug">
                {t.description}
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-ink-4" />
          </button>
        );
      })}
    </div>
  );
}

function ReviewStep({
  template,
  questions,
  answers,
}: {
  template: FollowupTemplate | null;
  questions: IntakeQuestion[];
  answers: Record<string, AnswerValue>;
}) {
  if (!template) return null;
  return (
    <div className="space-y-4">
      <section>
        <h3 className="apex-eyebrow mb-2">Form</h3>
        <div className="px-3 py-2 rounded-[10px] bg-secondary text-[13px]">
          <div className="font-medium text-foreground">{template.formTitle}</div>
          {template.formDescription && (
            <div className="text-muted-foreground mt-0.5">
              {template.formDescription}
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="apex-eyebrow mb-2">Answers</h3>
        <dl className="space-y-2 text-[13px]">
          {questions
            .filter((q) => q.type !== "STATEMENT")
            .map((q) => (
              <div
                key={q.questionId}
                className="flex flex-col gap-0.5 px-3 py-2 rounded-[10px] bg-secondary"
              >
                <span className="apex-eyebrow">{q.question}</span>
                <span className="text-foreground break-words">
                  {formatAnswerForReview(q, answers[q.questionId]) || (
                    <span className="text-ink-3">—</span>
                  )}
                </span>
              </div>
            ))}
        </dl>
      </section>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function formatAnswerForReview(q: IntakeQuestion, v: AnswerValue): string {
  if (v == null) return "";
  switch (q.type) {
    case "BOOLEAN":
      return v ? "Yes" : "No";
    case "DATERANGE": {
      const r = v as { startDate: string; endDate: string | null };
      const end = r.endDate ?? "indefinite";
      return `${r.startDate || "—"} → ${end}`;
    }
    case "MULTISELECT":
      return Array.isArray(v) ? (v as string[]).join(", ") : "";
    case "WIDGET_BMI": {
      const b = v as { height: string; weight: number; bmi: number };
      return `H ${b.height}in · W ${b.weight}lb · BMI ${b.bmi}`;
    }
    case "FILE":
    case "WIDGET_USER_ID_DOCUMENT":
      if (Array.isArray(v)) {
        return v.map((f) => (f as { name: string }).name).join(", ");
      }
      return "";
    default:
      return String(v);
  }
}

function extractMessage(err: unknown): string {
  if (!err || typeof err !== "object") return "Please try again.";
  const e = err as Record<string, unknown> & {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  return (
    e.response?.data?.message ??
    e.response?.data?.error ??
    e.message ??
    "Please try again."
  );
}
