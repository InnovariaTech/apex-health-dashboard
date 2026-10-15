import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, CalendarPlus, CalendarX, Clock, Loader2, RefreshCw, Video } from "lucide-react";
import { useCancelVisit, useVisits } from "@/hooks/healthie/useCareVisits";
import BookVisitDialog from "@/views/patient/components/appointments/BookVisitDialog";
import type { PatientVisit, VisitFilter } from "@/types/healthie/appointments_types";
import { parseHealthieTime, zoneLabel } from "@/views/patient/utils/visitTime";

/**
 * Appointments with the Apex MD care team, booked in our Healthie account. (Gym portals keep the
 * Trainerize appointments page; see `AppointmentsPage`.)
 *
 * The list doesn't carry the visit type's name or the clinician, so a visit without them is
 * labelled by how it happens ("Video visit").
 */

type Tab = Extract<VisitFilter, "upcoming" | "past">;

interface StatusStyle {
  label: string;
  bg: string;
  fg: string;
}

const BOOKED: StatusStyle = { label: "Booked", bg: "var(--opt-soft)", fg: "var(--opt-d)" };
const CANCELLED: StatusStyle = { label: "Cancelled", bg: "var(--surface-2)", fg: "var(--ink-2)" };
const STATUS: Record<string, StatusStyle> = {
  occurred: { label: "Completed", bg: "var(--opt-soft)", fg: "var(--opt-d)" },
  "no-show": { label: "Missed", bg: "var(--att-soft)", fg: "var(--att)" },
  "re-scheduled": { label: "Rescheduled", bg: "var(--bord-soft)", fg: "var(--bord)" },
};

function statusOf(v: PatientVisit): StatusStyle {
  const key = (v.status ?? "").trim().toLowerCase();
  if (!key) return BOOKED;
  if (key.includes("cancel")) return CANCELLED;
  return STATUS[key] ?? { label: v.status ?? "", bg: "var(--surface-2)", fg: "var(--ink-2)" };
}

const visitTitle = (v: PatientVisit) =>
  v.appointmentType?.name || (v.contactType ? v.contactType.replace(/^Healthie /, "").replace(/ Call$/, " visit") : "Video visit");

function VisitRow({ v, onReschedule }: { v: PatientVisit; onReschedule: (v: PatientVisit) => void }) {
  const cancel = useCancelVisit();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = parseHealthieTime(v.start);
  const status = statusOf(v);
  const cancelled = status === CANCELLED;

  const doCancel = async () => {
    setError(null);
    try {
      await cancel.mutateAsync(v.id);
      setConfirming(false);
    } catch (err) {
      setError((err as { message?: string })?.message || "We couldn't cancel this visit. Please try again.");
    }
  };

  return (
    <li className="apex-card p-[18px] md:px-[22px]">
      <div className="flex flex-wrap items-center gap-4 md:flex-nowrap">
        {/* Date block */}
        <div
          className={`grid h-[58px] w-[58px] shrink-0 place-items-center rounded-[12px] text-center ${cancelled ? "opacity-60" : ""}`}
          style={{ background: cancelled ? "var(--surface-2)" : "var(--apex-accent-soft)" }}
        >
          <div>
            <span
              className="block font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: cancelled ? "var(--ink-2)" : "var(--apex-accent-bright)" }}
            >
              {start ? format(start, "MMM") : "—"}
            </span>
            <span className="block text-[22px] font-extrabold leading-none tracking-[-0.03em] text-foreground">
              {start ? format(start, "d") : ""}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-[16px] font-bold leading-tight text-foreground ${cancelled ? "line-through decoration-[var(--mute)]" : ""}`}>
              {visitTitle(v)}
            </h3>
            <span
              className="inline-flex items-center gap-[5px] rounded-full px-2 py-1 font-mono text-[11px] font-semibold leading-[1.2]"
              style={{ background: status.bg, color: status.fg }}
            >
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: status.fg }} />
              {status.label}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {start ? format(start, "EEEE, MMMM d") : v.start}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {start ? `${format(start, "h:mm a")} ${zoneLabel(start)}` : ""}
              {v.lengthMinutes ? ` · ${v.lengthMinutes} min` : ""}
            </span>
            {v.provider?.name && <span>with {v.provider.name}</span>}
          </div>
        </div>

        {v.isEditable && !confirming && (
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            {v.videoUrl ? (
              <a
                href={v.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[10px] px-[15px] py-[9px] text-[13px] font-semibold text-white hover:brightness-[1.08]"
                style={{ background: "var(--apex-accent-bright)" }}
              >
                <Video className="w-4 h-4" /> Join
              </a>
            ) : (
              <span className="text-[12px] text-[var(--mute)] md:mr-2">Link appears closer to the visit</span>
            )}
            <button
              onClick={() => onReschedule(v)}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-border bg-card px-[13px] py-[8px] text-[13px] font-semibold text-foreground hover:border-[var(--mute)]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reschedule
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 rounded-[10px] px-[11px] py-[8px] text-[13px] font-semibold text-ink-2 hover:text-[var(--att)]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {confirming && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[10px] p-3.5" style={{ background: "var(--att-soft)" }}>
          <CalendarX className="w-4 h-4 shrink-0" style={{ color: "var(--att)" }} />
          <p className="min-w-0 flex-1 text-[13px] text-foreground">Cancel this visit? The time goes back to your care team.</p>
          <button
            onClick={() => setConfirming(false)}
            disabled={cancel.isPending}
            className="rounded-[10px] border border-border bg-card px-[13px] py-[7px] text-[12.5px] font-semibold text-foreground disabled:opacity-50"
          >
            Keep it
          </button>
          <button
            onClick={() => void doCancel()}
            disabled={cancel.isPending}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-[13px] py-[7px] text-[12.5px] font-semibold text-white disabled:opacity-60"
            style={{ background: "var(--att)" }}
          >
            {cancel.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Cancel visit
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-[12.5px] text-red-600">{error}</p>}
    </li>
  );
}

export default function CareAppointments() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [bookOpen, setBookOpen] = useState(false);
  const [moving, setMoving] = useState<PatientVisit | null>(null);
  const visits = useVisits(tab);
  const list = visits.data ?? [];
  const sorted = [...list].sort((a, b) => {
    const da = parseHealthieTime(a.start)?.getTime() ?? 0;
    const db = parseHealthieTime(b.start)?.getTime() ?? 0;
    return tab === "upcoming" ? da - db : db - da;
  });

  return (
    <div className="p-4 md:p-9 max-w-[1240px] bg-background text-foreground">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <span className="apex-ai-tag">
            <CalendarDays className="w-3 h-3" /> Care team visits
          </span>
          <h1 className="apex-page-title mt-3">
            My <em>Appointments</em>
          </h1>
          <p className="apex-page-sub">Video visits with your Apex MD care team. Book, join, reschedule or cancel here.</p>
        </div>
        <button
          onClick={() => setBookOpen(true)}
          className="inline-flex items-center gap-2 rounded-[10px] px-[15px] py-[9px] text-[13px] font-semibold text-white hover:brightness-[1.08]"
          style={{ background: "var(--apex-accent-bright)" }}
        >
          <CalendarPlus className="w-4 h-4" /> Book a visit
        </button>
      </div>

      <div className="mb-4 inline-flex gap-1 rounded-[13px] bg-[var(--surface-2)] p-1">
        {(
          [
            ["upcoming", "Upcoming"],
            ["past", "Past"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-[10px] px-3.5 py-[7px] text-[13px] transition ${
              tab === key ? "bg-card font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,.08)]" : "font-medium text-ink-2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visits.isLoading ? (
        <div className="flex justify-center py-20 text-ink-2">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : visits.isError ? (
        <div className="apex-card flex flex-wrap items-center gap-3 p-6 text-[13.5px] text-ink-2">
          {(visits.error as { message?: string })?.message || "Your appointments couldn't be loaded."}
          <button onClick={() => void visits.refetch()} className="font-semibold text-[var(--apex-accent-bright)]">
            Try again
          </button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="apex-card px-5 py-12 text-center">
          <div
            className="mx-auto mb-3.5 grid h-11 w-11 place-items-center rounded-full"
            style={{ background: "var(--apex-accent-soft)", color: "var(--apex-accent-bright)" }}
          >
            <CalendarDays className="w-5 h-5" />
          </div>
          <h4 className="text-foreground">{tab === "upcoming" ? "No upcoming visits" : "No past visits yet"}</h4>
          <p className="mx-auto mt-1 mb-4 max-w-[340px] text-[13px] text-ink-2">
            {tab === "upcoming"
              ? "Book a video visit with your care team. It only takes a minute."
              : "Visits you've had with your care team will show here."}
          </p>
          {tab === "upcoming" && (
            <button
              onClick={() => setBookOpen(true)}
              className="inline-flex items-center gap-2 rounded-[10px] px-[15px] py-[9px] text-[13px] font-semibold text-white hover:brightness-[1.08]"
              style={{ background: "var(--apex-accent-bright)" }}
            >
              <CalendarPlus className="w-4 h-4" /> Book a visit
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {sorted.map((v) => (
            <VisitRow key={v.id} v={v} onReschedule={setMoving} />
          ))}
        </ul>
      )}

      <BookVisitDialog open={bookOpen} onClose={() => setBookOpen(false)} />
      <BookVisitDialog open={Boolean(moving)} reschedule={moving} onClose={() => setMoving(null)} />
    </div>
  );
}
