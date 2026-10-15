import { format } from "date-fns";
import { ArrowRight, Check, ClipboardCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useMyIntakes } from "@/hooks/intake/usePendingIntakes";
import type { PatientIntake } from "@/types/intake/intake_types";

/**
 * "Your care requests": forms the patient has submitted, and where each is, as a short tracker —
 * Purchased → Form submitted → Care team review → Your plan. Shown until there is something better
 * to say (a reply, a visit, a plan), which later steps will add.
 */

type StepState = "done" | "current" | "upcoming";

function stepsFor(intake: PatientIntake): { label: string; state: StepState; hint?: string | undefined }[] {
  const submitted = intake.submittedAt ? format(new Date(intake.submittedAt), "MMM d") : undefined;
  const received = Boolean(intake.sentToCareTeamAt);
  return [
    { label: "Purchased", state: "done" },
    { label: "Form submitted", state: "done", hint: submitted },
    { label: "Care team review", state: "current", hint: received ? "In progress" : "Sending…" },
    { label: "Your plan", state: "upcoming" },
  ];
}

export function Tracker({ intake }: { intake: PatientIntake }) {
  const steps = stepsFor(intake);
  return (
    <ol className="mt-5 grid grid-cols-4 gap-2">
      {steps.map((step, i) => {
        const done = step.state === "done";
        const current = step.state === "current";
        return (
          <li key={step.label} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span
                className="absolute right-1/2 top-[15px] h-[3px] w-full -translate-y-1/2"
                style={{ background: done || current ? "var(--opt)" : "var(--line-2)" }}
              />
            )}
            <span
              className={`relative z-10 grid h-[30px] w-[30px] place-items-center rounded-full border-2 text-[12px] font-bold ${
                current ? "ring-4 ring-[var(--bord-soft)]" : ""
              }`}
              style={
                done
                  ? { background: "var(--opt)", borderColor: "var(--opt)", color: "#fff" }
                  : current
                    ? { background: "hsl(var(--card))", borderColor: "var(--bord)", color: "var(--bord-d)" }
                    : { background: "hsl(var(--card))", borderColor: "var(--line-2)", color: "var(--ink-3)" }
              }
            >
              {done ? <Check className="w-4 h-4" /> : current ? <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--bord)]" /> : i + 1}
            </span>
            <span className={`mt-2 text-[12.5px] leading-tight ${current ? "font-semibold text-foreground" : "text-ink-2"}`}>
              {step.label}
            </span>
            {step.hint && <span className="text-[11.5px] text-ink-2">{step.hint}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export default function SubmittedIntakesCard() {
  const { data: intakes = [] } = useMyIntakes();
  const submitted = intakes.filter((i) => i.status === "submitted").slice(0, 3);
  if (submitted.length === 0) return null;

  return (
    <section className="apex-card mb-7 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-xl"
            style={{ background: "var(--opt-soft)", color: "var(--opt-d)" }}
          >
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <p className="apex-eyebrow">In progress</p>
            <h2 className="apex-card-title-ink" style={{ fontSize: 21 }}>
              Your care requests
            </h2>
          </div>
        </div>
        <Link
          to={createPageUrl("MyTreatments")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--apex-accent-bright)] hover:underline"
        >
          View in My Treatments <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <ul className="mt-5 space-y-4">
        {submitted.map((intake) => (
          <li key={intake.submissionId} className="rounded-2xl border border-border p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <ClipboardCheck className="w-5 h-5 shrink-0 text-[var(--opt)]" />
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold text-foreground">{intake.title}</p>
                  <p className="text-[13px] text-ink-2">
                    Your care team is reviewing your answers. We&apos;ll let you know here as soon as there&apos;s an update.
                  </p>
                </div>
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
                style={{ background: "var(--bord-soft)", color: "var(--bord-d)" }}
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--bord)]" /> Under review
              </span>
            </div>
            <Tracker intake={intake} />
          </li>
        ))}
      </ul>
    </section>
  );
}
