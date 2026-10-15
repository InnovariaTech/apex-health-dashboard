import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isBefore,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from "date-fns";
import { ArrowLeft, CalendarCheck, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Loader2, Video, X } from "lucide-react";
import { useBookVisit, useRescheduleVisit, useVisitDays, useVisitSlots, useVisitTypes } from "@/hooks/healthie/useCareVisits";
import type { PatientVisit, VisitSlot, VisitType } from "@/types/healthie/appointments_types";
import { parseHealthieTime, patientTimezone, zoneLabel } from "@/views/patient/utils/visitTime";
import { createPageUrl } from "@/utils";

/**
 * Book a visit with the care team: type → day → time → confirm. With `reschedule`, the type is the
 * visit's own and the last step moves it instead of booking a new one.
 *
 * Times are searched and shown in the browser's timezone; the chosen slot goes back to the API
 * exactly as Healthie returned it.
 */

type Step = "type" | "time" | "confirm" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Move this visit instead of booking a new one. */
  reschedule?: PatientVisit | null;
}

const errorText = (err: unknown, fallback: string) => {
  const e = err as { message?: string; status?: number } | null;
  if (e?.status === 409) return "A booking is already in progress. Give it a moment, then check your appointments.";
  return e?.message && e.message !== "Internal server error" ? e.message : fallback;
};

const fmtSlotTime = (slot: string) => {
  const d = parseHealthieTime(slot);
  return d ? format(d, "h:mm a") : slot;
};

export default function BookVisitDialog({ open, onClose, reschedule = null }: Props) {
  const timezone = useMemo(() => patientTimezone(), []);
  const fixedTypeKey = reschedule?.appointmentType?.id ?? null;
  const types = useVisitTypes(open);
  const book = useBookVisit();
  const move = useRescheduleVisit();

  const [step, setStep] = useState<Step>(fixedTypeKey ? "time" : "type");
  const [type, setType] = useState<VisitType | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<VisitSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatientVisit | null>(null);

  // Fresh state each time it opens.
  useEffect(() => {
    if (!open) return;
    setStep(fixedTypeKey ? "time" : "type");
    setType(null);
    setMonth(startOfMonth(new Date()));
    setDay(null);
    setSlot(null);
    setError(null);
    setResult(null);
    book.reset();
    move.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixedTypeKey]);

  // For a reschedule, fill in the type's details once the list arrives.
  useEffect(() => {
    if (fixedTypeKey && !type && types.data) {
      setType(types.data.find((t) => t.typeKey === fixedTypeKey) ?? null);
    }
  }, [fixedTypeKey, type, types.data]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const typeKey = fixedTypeKey ?? type?.typeKey ?? null;
  const monthKey = format(month, "yyyy-MM");
  const days = useVisitDays(step === "time" ? typeKey : null, monthKey, timezone);
  const slots = useVisitSlots(step === "time" ? typeKey : null, day, timezone);
  const openDays = useMemo(() => new Set(days.data ?? []), [days.data]);

  if (!open) return null;

  const busy = book.isPending || move.isPending;
  const thisMonth = startOfMonth(new Date());
  const grid = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const today = startOfToday();
  const lengthMin = type?.lengthMinutes ?? reschedule?.lengthMinutes ?? null;
  const visitName = type?.displayName ?? reschedule?.appointmentType?.name ?? "Video visit";
  const slotDate = slot ? parseHealthieTime(slot.slot) : null;

  const changeMonth = (delta: number) => {
    setMonth((m) => addMonths(m, delta));
    setDay(null);
    setSlot(null);
  };

  const submit = async () => {
    if (!slot || !typeKey || busy) return;
    setError(null);
    try {
      const visit = reschedule
        ? await move.mutateAsync({
            id: reschedule.id,
            input: { slot: slot.slot, providerId: slot.providerId, timezone },
          })
        : await book.mutateAsync({ typeKey, slot: slot.slot, providerId: slot.providerId, timezone });
      setResult(visit);
      setStep("done");
    } catch (err) {
      setError(errorText(err, reschedule ? "We couldn't move your visit. Please try again." : "We couldn't book that time. Please pick another."));
    }
  };

  const title = reschedule ? "Reschedule visit" : "Book a visit";

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-[rgba(20,20,20,.45)] p-4 backdrop-blur-[3px] md:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-visit-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-[640px] overflow-auto rounded-[14px] bg-card shadow-[0_24px_60px_rgba(0,0,0,.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-[22px] pt-5">
          <div className="min-w-0">
            <span className="apex-ai-tag">
              <CalendarDays className="w-3 h-3" /> {step === "done" ? "Confirmed" : title}
            </span>
            <h2 id="book-visit-title" className="apex-card-title mt-3">
              {step === "type" && "What kind of visit?"}
              {step === "time" && "Pick a day and time"}
              {step === "confirm" && (reschedule ? "Move your visit?" : "Confirm your visit")}
              {step === "done" && (reschedule ? "Your visit has moved" : "You're booked")}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-2 hover:bg-black/5" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-[22px] pt-4 pb-[22px]">
          {/* 1 · Visit type */}
          {step === "type" &&
            (types.isLoading ? (
              <div className="flex justify-center py-10 text-ink-2">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : types.isError ? (
              <p className="py-6 text-[13.5px] text-ink-2">{errorText(types.error, "Visit types couldn't be loaded. Please try again.")}</p>
            ) : (types.data ?? []).length === 0 ? (
              <p className="py-6 text-[13.5px] text-ink-2">There are no visits you can book online right now. Message your care team to arrange one.</p>
            ) : (
              <ul className="space-y-2.5">
                {(types.data ?? []).map((t) => (
                  <li key={t.typeKey}>
                    <button
                      onClick={() => {
                        setType(t);
                        setStep("time");
                      }}
                      className="flex w-full items-center gap-3.5 rounded-[12px] border border-border bg-card p-4 text-left transition hover:border-[var(--apex-accent-bright)] hover:shadow-[var(--shadow-card-hover)]"
                    >
                      <span
                        className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[9px]"
                        style={{ background: "var(--apex-accent-soft)", color: "var(--apex-accent-bright)" }}
                      >
                        <Video className="w-[18px] h-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-bold text-foreground">{t.displayName}</span>
                        <span className="mt-0.5 flex items-center gap-3 text-[12.5px] text-ink-2">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {t.lengthMinutes} min
                          </span>
                          <span>{t.contactType.replace(/^Healthie /, "")}</span>
                        </span>
                      </span>
                      <ChevronRight className="w-5 h-5 text-[var(--mute)]" />
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {/* 2 · Day and time */}
          {step === "time" && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-2">
                <b className="text-[13.5px] text-foreground">{visitName}</b>
                {lengthMin && <span>· {lengthMin} min</span>}
                <span>· times in {zoneLabel() || timezone}</span>
              </div>

              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_200px]">
                {/* Month calendar */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      onClick={() => changeMonth(-1)}
                      disabled={!isBefore(thisMonth, month)}
                      className="grid h-8 w-8 place-items-center rounded-[8px] border border-border text-ink-2 hover:border-[var(--mute)] disabled:opacity-40"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <b className="text-[14px] text-foreground">{format(month, "MMMM yyyy")}</b>
                    <button
                      onClick={() => changeMonth(1)}
                      className="grid h-8 w-8 place-items-center rounded-[8px] border border-border text-ink-2 hover:border-[var(--mute)]"
                      aria-label="Next month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--mute)]">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <span key={d} className="py-1">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="relative grid grid-cols-7 gap-1">
                    {grid.map((d) => {
                      const key = format(d, "yyyy-MM-dd");
                      const inMonth = isSameMonth(d, month);
                      const isOpen = inMonth && openDays.has(key) && !isBefore(d, today);
                      const selected = day === key;
                      return (
                        <button
                          key={key}
                          disabled={!isOpen}
                          onClick={() => {
                            setDay(key);
                            setSlot(null);
                          }}
                          className={`h-10 rounded-[10px] text-[13.5px] transition ${
                            !inMonth ? "invisible" : ""
                          } ${
                            selected
                              ? "font-bold text-white"
                              : isOpen
                                ? "font-semibold text-foreground hover:bg-[var(--apex-accent-soft)]"
                                : "text-[var(--ink-4)]"
                          }`}
                          style={
                            selected
                              ? { background: "var(--apex-accent-bright)" }
                              : isOpen
                                ? { background: "var(--surface-2)" }
                                : undefined
                          }
                        >
                          {format(d, "d")}
                        </button>
                      );
                    })}
                    {days.isFetching && (
                      <div className="absolute inset-0 grid place-items-center bg-card/60">
                        <Loader2 className="w-5 h-5 animate-spin text-ink-2" />
                      </div>
                    )}
                  </div>
                  {!days.isFetching && days.isError && (
                    <p className="mt-3 text-[12.5px] text-red-600">{errorText(days.error, "Open days couldn't be loaded.")}</p>
                  )}
                  {!days.isFetching && !days.isError && openDays.size === 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-2">
                      No open times in {format(month, "MMMM")}.
                      <button onClick={() => changeMonth(1)} className="font-semibold text-[var(--apex-accent-bright)]">
                        Try {format(addMonths(month, 1), "MMMM")} →
                      </button>
                    </div>
                  )}
                </div>

                {/* Times for the chosen day */}
                <div>
                  <p className="apex-eyebrow mb-2">{day ? format(parseISO(day), "EEE, MMM d") : "Times"}</p>
                  {!day ? (
                    <p className="text-[12.5px] text-ink-2">Choose a highlighted day to see open times.</p>
                  ) : slots.isLoading ? (
                    <div className="flex justify-center py-6 text-ink-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : slots.isError ? (
                    <p className="text-[12.5px] text-red-600">{errorText(slots.error, "Times couldn't be loaded.")}</p>
                  ) : (slots.data ?? []).length === 0 ? (
                    <p className="text-[12.5px] text-ink-2">That day just filled up. Please pick another.</p>
                  ) : (
                    <div className="grid max-h-[300px] grid-cols-2 gap-2 overflow-y-auto pr-1 md:grid-cols-1">
                      {(slots.data ?? []).map((s) => {
                        const active = slot?.slot === s.slot && slot?.providerId === s.providerId;
                        return (
                          <button
                            key={`${s.slot}-${s.providerId}`}
                            onClick={() => setSlot(s)}
                            className={`h-10 rounded-[10px] border text-[13.5px] font-semibold transition ${
                              active ? "text-white" : "border-border bg-card text-foreground hover:border-[var(--apex-accent-bright)]"
                            }`}
                            style={active ? { background: "var(--apex-accent-bright)", borderColor: "var(--apex-accent-bright)" } : undefined}
                          >
                            {fmtSlotTime(s.slot)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-border pt-4">
                {!fixedTypeKey && (
                  <button
                    onClick={() => {
                      setStep("type");
                      setDay(null);
                      setSlot(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-foreground"
                  >
                    <ArrowLeft className="w-4 h-4" /> Visit type
                  </button>
                )}
                <button
                  onClick={() => setStep("confirm")}
                  disabled={!slot}
                  className="ml-auto inline-flex items-center gap-2 rounded-[10px] px-[15px] py-[9px] text-[13px] font-semibold text-white hover:brightness-[1.08] disabled:opacity-50"
                  style={{ background: "var(--apex-accent-bright)" }}
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* 3 · Confirm */}
          {step === "confirm" && slot && (
            <>
              <div className="rounded-[12px] border border-border bg-[var(--surface-2)]/40 p-4">
                <p className="text-[15px] font-bold text-foreground">{visitName}</p>
                <ul className="mt-2.5 space-y-1.5 text-[13.5px] text-ink-2">
                  <li className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {slotDate ? format(slotDate, "EEEE, MMMM d, yyyy") : slot.slot}
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {fmtSlotTime(slot.slot)} {zoneLabel(slotDate ?? undefined)}
                    {lengthMin ? ` · ${lengthMin} min` : ""}
                  </li>
                  <li className="flex items-center gap-2">
                    <Video className="w-4 h-4" /> Video visit. The link appears in Appointments closer to the time.
                  </li>
                </ul>
                {reschedule && (
                  <p className="mt-3 border-t border-border pt-3 text-[12.5px] text-ink-2">
                    Moving from{" "}
                    <b className="text-foreground">
                      {(() => {
                        const d = parseHealthieTime(reschedule.start);
                        return d ? format(d, "EEE, MMM d · h:mm a") : reschedule.start;
                      })()}
                    </b>
                  </p>
                )}
              </div>
              {error && (
                <p className="mt-3 text-[13px] text-red-600">
                  {error}
                  {/profile/i.test(error) && (
                    <>
                      {" "}
                      <Link to={createPageUrl("Profile")} onClick={onClose} className="font-semibold underline">
                        Go to Profile
                      </Link>
                    </>
                  )}
                </p>
              )}
              <div className="mt-6 flex items-center gap-2 border-t border-border pt-4">
                <button
                  onClick={() => {
                    setStep("time");
                    setError(null);
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-2 hover:text-foreground disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Change time
                </button>
                <button
                  onClick={() => void submit()}
                  disabled={busy}
                  className="ml-auto inline-flex items-center gap-2 rounded-[10px] px-[15px] py-[9px] text-[13px] font-semibold text-white hover:brightness-[1.08] disabled:opacity-60"
                  style={{ background: "var(--apex-accent-bright)" }}
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {busy ? (reschedule ? "Moving…" : "Booking…") : reschedule ? "Move visit" : "Book visit"}
                </button>
              </div>
            </>
          )}

          {/* 4 · Done */}
          {step === "done" && (
            <>
              <div className="flex items-start gap-3.5 rounded-[12px] p-4" style={{ background: "var(--opt-soft)" }}>
                <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full text-white" style={{ background: "var(--opt)" }}>
                  <CalendarCheck className="w-[18px] h-[18px]" />
                </span>
                <div className="text-[13.5px]">
                  <p className="font-bold text-foreground">{visitName}</p>
                  <p className="mt-0.5 text-ink-2">
                    {(() => {
                      const d = parseHealthieTime(result?.start ?? slot?.slot);
                      return d ? `${format(d, "EEEE, MMMM d · h:mm a")} ${zoneLabel(d)}` : "";
                    })()}
                  </p>
                  <p className="mt-1.5 text-ink-2">
                    {result?.videoUrl
                      ? "Your video link is ready in Appointments."
                      : "Your video link will appear in Appointments closer to the visit."}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
                <button
                  onClick={onClose}
                  className="rounded-[10px] border border-border px-[15px] py-[9px] text-[13px] font-semibold text-foreground hover:border-[var(--mute)]"
                >
                  Close
                </button>
                <Link
                  to={createPageUrl("Appointments")}
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-[10px] px-[15px] py-[9px] text-[13px] font-semibold text-white hover:brightness-[1.08]"
                  style={{ background: "var(--apex-accent-bright)" }}
                >
                  View appointments <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
