import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ExternalLink, Loader2, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { openIntakeForm, useMyIntakes, usePendingIntakes } from "@/hooks/intake/usePendingIntakes";
import { format } from "date-fns";
import { FormIcon, FormStatusChips } from "@/views/patient/components/intake/PendingIntakesAlert";
import { createPageUrl } from "@/utils";

/**
 * Every form the patient paid for and hasn't filled in. "Fill out form" opens it in a new tab;
 * when it's finished there, it drops off this list on its own.
 */
export default function OutstandingForms() {
  const navigate = useNavigate();
  const { data: intakes = [], isLoading, isError, refetch, isFetching } = usePendingIntakes();
  const { data: mine = [] } = useMyIntakes();
  const submitted = mine.filter((i) => i.status === "submitted");

  return (
    <div className="p-4 md:p-9 max-w-[1240px] bg-background text-foreground">
      <button
        onClick={() => navigate(createPageUrl("Dashboard"))}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </button>

      {/* Page head — same editorial style as "Health Dashboard" */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <span className="apex-ai-tag mb-3">Action required</span>
          <h1 className="apex-page-title mt-3">
            Outstanding <em>Intake Forms</em>
          </h1>
          <p className="apex-page-sub">
            These need your attention as soon as possible. Each opens in a new tab, and your answers save as you go.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-[14px] border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-card)] hover:bg-black/[0.03] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center text-ink-2">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : isError ? (
        <div className="apex-card p-8 text-sm text-ink-2">We couldn&apos;t load your forms. Please press Refresh.</div>
      ) : intakes.length === 0 ? (
        <div className="apex-card p-12 text-center">
          <div
            className="mx-auto grid h-16 w-16 place-items-center rounded-2xl"
            style={{ background: "var(--opt-soft)", color: "var(--opt)" }}
          >
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="mt-4 text-xl font-semibold text-foreground">You&apos;re all caught up</p>
          <p className="mt-1 text-sm text-ink-2">There are no forms waiting for you.</p>
        </div>
      ) : (
        <>
          <p className="apex-eyebrow mb-3">
            {intakes.length} form{intakes.length === 1 ? "" : "s"} to complete
          </p>
          <ul className="grid gap-4 md:grid-cols-2">
            {intakes.map((intake) => (
              <li key={intake.submissionId} className="apex-card group relative flex flex-col overflow-hidden p-6">
                <span className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--apex-accent-bright)" }} />
                <div className="flex items-start gap-4">
                  <FormIcon size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-semibold leading-snug text-foreground">{intake.title}</p>
                    <div className="mt-2">
                      <FormStatusChips />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-[13px] text-ink-2">
                  <div className="flex items-center gap-2 rounded-xl bg-black/[0.03] px-3 py-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" /> Private and secure
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-black/[0.03] px-3 py-2">
                    <Lock className="w-4 h-4 shrink-0" /> Answers save as you go
                  </div>
                </div>

                <button
                  onClick={() => openIntakeForm(intake.token, intake.submissionId)}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(211, 7, 4,0.6)] transition hover:brightness-110"
                  style={{ background: "linear-gradient(145deg, var(--apex-accent-bright), var(--apex-accent-dark))" }}
                >
                  Fill out form <ExternalLink className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {submitted.length > 0 && (
        <section className="mt-10">
          <p className="apex-eyebrow mb-3">Submitted</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {submitted.map((i) => (
              <li key={i.submissionId} className="apex-card flex items-center gap-4 p-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: "var(--opt-soft)", color: "var(--opt-d)" }}>
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">{i.title}</p>
                  <p className="text-[13px] text-ink-2">
                    Submitted {i.submittedAt ? format(new Date(i.submittedAt), "MMM d, yyyy") : ""} · your care team is reviewing it
                  </p>
                </div>
                <span className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: "var(--bord-soft)", color: "var(--bord-d)" }}>
                  Under review
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
