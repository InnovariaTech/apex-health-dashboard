import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, CalendarPlus, Check, ExternalLink, FileText, Loader2 } from "lucide-react";
import { openIntakeForm, useMyIntakes, usePendingIntakes } from "@/hooks/intake/usePendingIntakes";
import { StatusBadge } from "@/views/patient/components/treatments/CaseBits";
import CaseConversation from "@/views/patient/components/treatments/CaseConversation";
import CaseDocumentsCard from "@/views/patient/components/treatments/CaseDocumentsCard";
import BookVisitDialog from "@/views/patient/components/appointments/BookVisitDialog";
import { buildCases, fmtCaseDate } from "@/views/patient/utils/treatmentCases";
import { createPageUrl } from "@/utils";

/**
 * One treatment, in the "My cases" detail design: header, step tracker, the care-team
 * conversation, and a sidebar of forms to complete, documents and details. Only what the APIs
 * support today — no care-team list or attachments yet. "Book a visit" books with the care team.
 */
export default function TreatmentDetails() {
  const { id = "" } = useParams();
  const [bookOpen, setBookOpen] = useState(false);
  const pending = usePendingIntakes();
  const mine = useMyIntakes();
  const cases = useMemo(() => buildCases(pending.data ?? [], mine.data ?? []), [pending.data, mine.data]);
  const c = cases.find((x) => x.id === id);
  const outstanding = cases.filter((x) => x.status === "action_needed");
  const back = createPageUrl("MyTreatments");

  if (mine.isLoading && pending.isLoading) {
    return (
      <div className="py-24 flex justify-center text-ink-2">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!c) {
    return (
      <div className="p-4 md:p-9 max-w-[1240px]">
        <Link to={back} className="inline-flex items-center gap-1.5 font-mono text-[12px] text-ink-2 hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> All treatments
        </Link>
        <div className="apex-card mt-4 p-10 text-center">
          <p className="font-semibold text-foreground">Treatment not found</p>
          <p className="mt-1 text-sm text-ink-2">We couldn&apos;t find this treatment. It may have been closed.</p>
        </div>
      </div>
    );
  }

  const words = c.title.split(" ");
  const accent = words.length > 1 ? words.pop() : "";

  return (
    <div className="p-4 md:p-9 max-w-[1240px] bg-background text-foreground">
      <Link to={back} className="inline-flex items-center gap-1.5 font-mono text-[12px] text-ink-2 hover:text-foreground">
        <ArrowLeft className="w-3.5 h-3.5" /> All treatments
      </Link>

      {/* Header */}
      <div className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <span className="apex-ai-tag">
            <Briefcase className="w-3 h-3" /> {c.ref}
          </span>
          <h1 className="apex-page-title mt-3" style={{ fontSize: "clamp(30px, 3.6vw, 40px)" }}>
            {words.join(" ")} {accent && <em>{accent}</em>}
          </h1>
          <p className="apex-page-sub">
            Opened {fmtCaseDate(c.openedAt)} · last update {fmtCaseDate(c.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={c.status} />
          <button
            onClick={() => setBookOpen(true)}
            className="inline-flex items-center gap-2 rounded-[10px] px-[15px] py-[9px] text-[13px] font-semibold text-white hover:brightness-[1.08]"
            style={{ background: "var(--apex-accent-bright)" }}
          >
            <CalendarPlus className="w-4 h-4" /> Book a visit
          </button>
        </div>
      </div>
      <BookVisitDialog open={bookOpen} onClose={() => setBookOpen(false)} />

      {/* Step tracker */}
      <div className="apex-card grid grid-cols-2 overflow-hidden md:grid-cols-4">
        {c.steps.map((s, i) => {
          const state = i < c.step ? "done" : i === c.step ? "now" : "next";
          return (
            <div
              key={s}
              className="flex items-center gap-3 border-b border-border px-5 py-4 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <span
                className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full border font-mono text-[11px]"
                style={
                  state === "done"
                    ? { background: "var(--opt)", borderColor: "var(--opt)", color: "#fff" }
                    : state === "now"
                      ? { borderWidth: 2, borderColor: "var(--apex-accent-bright)", color: "var(--apex-accent-bright)", fontWeight: 700 }
                      : { borderColor: "var(--line-2)", color: "var(--ink-3)" }
                }
              >
                {state === "done" ? <Check className="w-3.5 h-3.5" /> : `0${i + 1}`}
              </span>
              <div>
                <b className="block text-[13.5px] leading-tight text-foreground">{s}</b>
                <small
                  className="text-[11.5px]"
                  style={state === "now" ? { color: "var(--apex-accent-bright)", fontWeight: 600 } : { color: "var(--ink-3)" }}
                >
                  {state === "done" ? "Done" : state === "now" ? "In progress" : "Up next"}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversation + sidebar */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <CaseConversation />

        <div className="space-y-4">
          <div className="apex-card p-[22px]">
            <div className="mb-2 flex items-center">
              <span className="apex-eyebrow">Forms to complete</span>
              {outstanding.length > 0 && (
                <span
                  className="ml-auto rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
                  style={{ background: "var(--bord-soft)", color: "var(--bord-d)" }}
                >
                  {outstanding.length} open
                </span>
              )}
            </div>
            {outstanding.length === 0 ? (
              <p className="py-1.5 text-[13px] text-ink-2">Nothing to fill out right now.</p>
            ) : (
              <ul className="divide-y divide-border">
                {outstanding.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg"
                      style={{ background: "var(--bord-soft)", color: "var(--bord-d)" }}
                    >
                      <FileText className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{f.title}</span>
                    <button
                      onClick={() => openIntakeForm(f.token!, f.id)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-semibold text-white hover:brightness-110"
                      style={{ background: "var(--apex-accent-bright)" }}
                    >
                      Start <ExternalLink className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <CaseDocumentsCard />

          <div className="apex-card p-[22px]">
            <span className="apex-eyebrow">Details</span>
            <ul className="mt-2 divide-y divide-border text-[13px]">
              {[
                ["Reference", c.ref],
                ["Opened", fmtCaseDate(c.openedAt)],
                ["Form submitted", fmtCaseDate(c.submittedAt)],
                ["Sent to care team", fmtCaseDate(c.sentToCareTeamAt)],
                ["Last update", fmtCaseDate(c.updatedAt)],
              ].map(([k, v]) => (
                <li key={k} className="flex justify-between gap-3 py-2.5">
                  <span className="text-ink-2">{k}</span>
                  <span className={k === "Reference" ? "font-mono text-foreground" : "text-foreground"}>{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
