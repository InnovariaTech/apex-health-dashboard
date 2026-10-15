import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BadgeCheck, ClipboardList, ExternalLink, FileText, Hourglass, X } from "lucide-react";
import { openIntakeForm, usePendingIntakes } from "@/hooks/intake/usePendingIntakes";
import { createPageUrl } from "@/utils";
import type { PendingIntake } from "@/types/intake/intake_types";

/**
 * Dashboard notice for forms the patient paid for and hasn't filled in: a prominent tile that stays
 * while any are outstanding, and a popup the first time the dashboard opens in a session ("Later"
 * hides the popup for this session; the tile stays). "View all" opens the Outstanding forms page.
 */

const POPUP_SEEN_KEY = "apex:pending-intakes-popup-seen";

function popupSeen(): boolean {
  try {
    return sessionStorage.getItem(POPUP_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markPopupSeen() {
  try {
    sessionStorage.setItem(POPUP_SEEN_KEY, "1");
  } catch {
    /* blocked storage: the popup may show again on reload */
  }
}

/** Red-gradient icon square — the visual anchor for each form. */
export function FormIcon({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "w-14 h-14 rounded-2xl" : "w-11 h-11 rounded-xl";
  const icon = size === "lg" ? "w-7 h-7" : "w-5 h-5";
  return (
    <div
      className={`${box} shrink-0 grid place-items-center text-white shadow-[0_6px_16px_-6px_rgba(211, 7, 4,0.55)]`}
      style={{ background: "linear-gradient(145deg, var(--apex-accent-bright), var(--apex-accent-dark))" }}
    >
      <ClipboardList className={icon} />
    </div>
  );
}

/** "Paid" and "Awaiting your answers" chips shown on every outstanding form. */
export function FormStatusChips() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
        style={{ background: "var(--opt-soft)", color: "var(--opt-d)" }}
      >
        <BadgeCheck className="w-3.5 h-3.5" /> Paid
      </span>
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
        style={{ background: "var(--bord-soft)", color: "var(--bord-d)" }}
      >
        <Hourglass className="w-3.5 h-3.5" /> Awaiting your answers
      </span>
    </div>
  );
}

function PopupRow({ intake, onOpen }: { intake: PendingIntake; onOpen: () => void }) {
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-[var(--line-2)] hover:shadow-[var(--shadow-card)]">
      <FormIcon />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15.5px] font-semibold text-foreground">{intake.title}</p>
        <div className="mt-1.5">
          <FormStatusChips />
        </div>
      </div>
      <button
        onClick={onOpen}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        style={{ background: "var(--apex-accent-bright)" }}
      >
        Fill out form <ExternalLink className="w-4 h-4" />
      </button>
    </li>
  );
}

export default function PendingIntakesAlert() {
  const navigate = useNavigate();
  const { data: intakes = [] } = usePendingIntakes();
  const [popupOpen, setPopupOpen] = useState(false);
  const count = intakes.length;

  useEffect(() => {
    if (count > 0 && !popupSeen()) setPopupOpen(true);
  }, [count]);

  if (count === 0) return null;

  const close = () => {
    markPopupSeen();
    setPopupOpen(false);
  };
  const viewAll = () => {
    close();
    navigate(createPageUrl("OutstandingForms"));
  };
  const needs = count === 1 ? "1 form needs" : `${count} forms need`;
  const itOrThey = count === 1 ? "it's" : "they're";

  return (
    <>
      {/* Dashboard tile */}
      <section
        className="apex-card relative mb-7 overflow-hidden"
        style={{ background: "linear-gradient(100deg, var(--apex-accent-soft) 0%, hsl(var(--card)) 58%)" }}
      >
        <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: "var(--apex-accent-bright)" }} />
        <div className="flex flex-col gap-5 p-5 pl-7 md:flex-row md:items-center md:p-6 md:pl-8">
          <FormIcon size="lg" />
          <div className="min-w-0 flex-1">
            <span className="apex-ai-tag">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--apex-accent-bright)] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--apex-accent-bright)]" />
              </span>
              Action required
            </span>
            <h2 className="apex-card-title-ink mt-2.5">
              Outstanding intake forms
              <span
                className="ml-2.5 inline-grid h-7 min-w-[28px] place-items-center rounded-full px-2 align-middle text-[13px] font-bold text-white"
                style={{ background: "var(--apex-accent-bright)" }}
              >
                {count}
              </span>
            </h2>
            <p className="mt-1.5 text-[14.5px] text-ink-2">
              {needs} your attention. Your care team can&apos;t start until {itOrThey} complete.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {intakes.slice(0, 3).map((i) => (
                <span
                  key={i.submissionId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[13px] font-medium text-foreground"
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--apex-accent-bright)]" />
                  {i.title}
                </span>
              ))}
              {count > 3 && <span className="px-1 py-1 text-[13px] text-ink-2">+{count - 3} more</span>}
            </div>
          </div>
          <button
            onClick={viewAll}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(211, 7, 4,0.6)] transition hover:brightness-110"
            style={{ background: "linear-gradient(145deg, var(--apex-accent-bright), var(--apex-accent-dark))" }}
          >
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* First-visit popup */}
      {popupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pending-intakes-title"
          onClick={close}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-7 pb-6 pt-7 md:px-9 md:pt-9"
              style={{ background: "linear-gradient(180deg, var(--apex-accent-soft) 0%, transparent 100%)" }}
            >
              <button
                onClick={close}
                className="absolute right-4 top-4 rounded-full p-1.5 text-ink-2 hover:bg-black/5"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-start gap-4">
                <FormIcon size="lg" />
                <div className="min-w-0">
                  <span className="apex-ai-tag">Action required</span>
                  <h2 id="pending-intakes-title" className="apex-page-title mt-2.5" style={{ fontSize: "clamp(28px, 3.4vw, 36px)" }}>
                    Outstanding <em>Intake Forms</em>
                  </h2>
                  <p className="apex-page-sub">
                    {needs} your attention as soon as possible. Your care team can&apos;t start until {itOrThey} complete.
                  </p>
                </div>
              </div>
            </div>

            <ul className="max-h-[45vh] space-y-3 overflow-y-auto px-7 md:px-9">
              {intakes.map((i) => (
                <PopupRow key={i.submissionId} intake={i} onOpen={() => openIntakeForm(i.token, i.submissionId)} />
              ))}
            </ul>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border px-7 py-5 sm:flex-row sm:justify-end md:px-9">
              <button
                onClick={close}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-black/5"
              >
                Remind me later
              </button>
              <button
                onClick={viewAll}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110"
                style={{ background: "var(--apex-accent-bright)" }}
              >
                View all forms <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
