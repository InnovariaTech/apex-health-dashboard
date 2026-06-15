// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Monitor,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useTrainerizeLocations } from "@/hooks/trainerize/useLocations";
import {
  useAppointmentTypes,
  useSelfBookAppointment,
  useTimeslots,
} from "@/hooks/trainerize/useAppointments";
import {
  formatLocationAddress,
  type Location,
} from "@/types/trainerize/locations_types";
import {
  readAppointmentTypeId,
  toAppointmentRangeDateTime,
  type AppointmentType,
  type DailyTimeslot,
} from "@/types/trainerize/appointments_types";

/**
 * Self-book stepper — follows
 * `docs/trainerize/appointments/availableslot-self-book-apis.md` end-to-end.
 *
 *   1. Pick location  (auto-skip when there's exactly one active)
 *   2. Pick appointment type
 *   3. Pick slot from a week-grid (only `availabilityStatus === "available"`)
 *   4. Confirm → POST /me/appointments/self-book → toast → close
 *
 * Datetime format on the wire: `YYYY-MM-DD HH:MM:SS` (space, seconds).
 * The slot string returned by `/timeslots` is echoed verbatim back to
 * `/self-book` as `appointmentTime` — no parsing/reformatting in between.
 */

const SLOT_WINDOW_DAYS = 14;

interface SelfBookDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = "location" | "type" | "slots";

export default function SelfBookDialog({ open, onClose }: SelfBookDialogProps) {
  const [step, setStep] = useState<Step>("location");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [weekStartISO, setWeekStartISO] = useState<string>(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [pendingSlot, setPendingSlot] = useState<string | null>(null);

  const locationsQuery = useTrainerizeLocations();
  const typesQuery = useAppointmentTypes();
  const selfBook = useSelfBookAppointment();

  // Auto-select the only active location, skipping straight to type pick.
  useEffect(() => {
    if (!open) return;
    const locs = locationsQuery.data ?? [];
    if (selectedLocation || locs.length !== 1) return;
    setSelectedLocation(locs[0]);
    setStep("type");
  }, [open, locationsQuery.data, selectedLocation]);

  // Reset when the dialog closes so the next open starts clean.
  useEffect(() => {
    if (open) return;
    setStep("location");
    setSelectedLocation(null);
    setSelectedType(null);
    setPendingSlot(null);
    setWeekStartISO(format(new Date(), "yyyy-MM-dd"));
  }, [open]);

  const { startTime, endTime } = useMemo(() => {
    const start = parseISO(weekStartISO);
    return {
      // Doc says both bounds are midnight; window is half-open
      // [start 00:00, end 00:00) covering SLOT_WINDOW_DAYS calendar days.
      // We previously sent `23:59:59` for end which Trainerize would
      // sometimes reject as empty — see `availableslot-self-book-apis.md`.
      startTime: toAppointmentRangeDateTime(start),
      endTime: toAppointmentRangeDateTime(addDays(start, SLOT_WINDOW_DAYS)),
    };
  }, [weekStartISO]);

  const timeslotsQuery = useTimeslots({
    locationId: selectedLocation?.id,
    // Trainerize types may carry the id under `id`, `appointmentTypeId`, or
    // `appointmentTypeID` — `readAppointmentTypeId` covers all three.
    appointmentTypeId: readAppointmentTypeId(selectedType),
    startTime,
    endTime,
  });

  const handleSelectLocation = (loc: Location) => {
    setSelectedLocation(loc);
    setStep("type");
  };

  const handleSelectType = (t: AppointmentType) => {
    setSelectedType(t);
    setStep("slots");
  };

  const handleConfirm = async () => {
    if (!selectedLocation || !selectedType || !pendingSlot) return;
    const typeId = readAppointmentTypeId(selectedType);
    if (typeof typeId !== "number") {
      toast({
        variant: "destructive",
        title: "Couldn't book",
        description: "Missing appointment type id from the upstream response.",
      });
      return;
    }
    try {
      const result = await selfBook.mutateAsync({
        locationId: selectedLocation.id,
        appointmentTypeId: typeId,
        appointmentTime: pendingSlot,
      });
      // Trainerize envelopes can carry a non-zero `code` on app-level failure
      // — the _envelope detector throws on `data: null` errors, but `code !== 0`
      // with a populated `data` would slip through. Re-check defensively.
      if (
        typeof result?.code === "number" &&
        result.code !== 0 &&
        result.message
      ) {
        throw new Error(result.message);
      }
      toast({
        title: "Appointment booked",
        description: `${selectedType.name ?? "Session"} at ${formatSlotDisplay(pendingSlot)}.`,
      });
      onClose();
    } catch (err) {
      const message =
        (err as { message?: string } | undefined)?.message ??
        "Booking failed — the slot may have just been taken.";
      toast({
        variant: "destructive",
        title: "Couldn't book",
        description: message,
      });
      // Refresh slots so the user sees the new availability.
      void timeslotsQuery.refetch();
      setPendingSlot(null);
    }
  };

  const locations = locationsQuery.data ?? [];
  const types = typesQuery.data?.appointmentTypes ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            Book an appointment
          </DialogTitle>
          {/* <StepperBreadcrumb
            step={step}
            selectedLocation={selectedLocation}
            selectedType={selectedType}
            onStepClick={(s) => {
              // Allow stepping back to a previous stage only.
              if (s === "location") {
                setSelectedLocation(null);
                setSelectedType(null);
                setPendingSlot(null);
                setStep("location");
              } else if (s === "type" && selectedLocation) {
                setSelectedType(null);
                setPendingSlot(null);
                setStep("type");
              }
            }}
          /> */}
        </DialogHeader>

        {step === "location" && (
          <LocationStep
            locations={locations}
            isLoading={locationsQuery.isLoading}
            isError={locationsQuery.isError}
            error={locationsQuery.error}
            onSelect={handleSelectLocation}
          />
        )}

        {step === "type" && (
          <TypeStep
            types={types}
            isLoading={typesQuery.isLoading}
            isError={typesQuery.isError}
            error={typesQuery.error}
            onSelect={handleSelectType}
          />
        )}

        {step === "slots" && (
          <SlotsStep
            weekStartISO={weekStartISO}
            onShiftWeek={(delta) => {
              const next = format(
                addDays(parseISO(weekStartISO), delta),
                "yyyy-MM-dd",
              );
              setWeekStartISO(next);
              // Belt-and-suspenders: the new `weekStartISO` flows into the
              // useTimeslots query key and should auto-refetch, but in case
              // the key normalizer treats the keys as equal we explicitly
              // poke the query so the user always sees a network call when
              // they shift the window.
              void timeslotsQuery.refetch();
            }}
            timeslotsQuery={timeslotsQuery}
            pendingSlot={pendingSlot}
            onPickSlot={setPendingSlot}
          />
        )}

        <DialogFooter className="gap-2 pt-2 flex-wrap">
          <Button variant="outline" onClick={onClose} disabled={selfBook.isPending}>
            Cancel
          </Button>
          {step === "slots" && (
            <Button
              onClick={() => void handleConfirm()}
              disabled={!pendingSlot || selfBook.isPending}
              className="gap-2"
            >
              {selfBook.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {pendingSlot
                ? `Confirm ${formatSlotDisplay(pendingSlot)}`
                : "Pick a slot"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stepper breadcrumb ────────────────────────────────────────────────────

function StepperBreadcrumb({
  step,
  selectedLocation,
  selectedType,
  onStepClick,
}: {
  step: Step;
  selectedLocation: Location | null;
  selectedType: AppointmentType | null;
  onStepClick: (s: Step) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
      <Crumb
        active={step === "location"}
        done={!!selectedLocation}
        onClick={() => onStepClick("location")}
        label="1. Location"
        value={selectedLocation?.name}
      />
      <ChevronRight className="w-3 h-3" />
      <Crumb
        active={step === "type"}
        done={!!selectedType}
        onClick={() => selectedLocation && onStepClick("type")}
        label="2. Type"
        value={selectedType?.name}
        disabled={!selectedLocation}
      />
      <ChevronRight className="w-3 h-3" />
      <Crumb
        active={step === "slots"}
        done={false}
        onClick={() => {}}
        label="3. Slot"
        disabled={!selectedType}
      />
    </div>
  );
}

function Crumb({
  active,
  done,
  onClick,
  label,
  value,
  disabled,
}: {
  active: boolean;
  done: boolean;
  onClick: () => void;
  label: string;
  value?: string;
  disabled?: boolean;
}) {
  const tone = active
    ? "text-foreground font-semibold"
    : done
      ? "text-primary"
      : "text-muted-foreground";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${tone} ${disabled ? "cursor-not-allowed" : "hover:underline"}`}
    >
      <span>{label}</span>
      {value ? <span className="ml-1 font-mono text-foreground/80">· {value}</span> : null}
    </button>
  );
}

// ─── Step 1: Location ──────────────────────────────────────────────────────

function LocationStep({
  locations,
  isLoading,
  isError,
  error,
  onSelect,
}: {
  locations: Location[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onSelect: (loc: Location) => void;
}) {
  if (isLoading) {
    return <LoadingBlock />;
  }
  if (isError) {
    return (
      <ErrorBlock
        message={
          (error as { message?: string } | undefined)?.message ??
          "Couldn't load studio locations."
        }
      />
    );
  }
  if (locations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center space-y-2">
          <MapPin className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="font-semibold">No studio location configured</p>
          <p className="text-sm text-muted-foreground">
            Contact support to enable appointment booking.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Pick a studio location.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {locations.map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => onSelect(loc)}
            className="text-left border-2 border-border rounded-md p-4 hover:border-primary hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-semibold">{loc.name ?? `Location #${loc.id}`}</p>
              <Badge
                variant="outline"
                className="text-[10px] uppercase tracking-wider"
              >
                {loc.type === "online" ? (
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {loc.type ?? "Studio"}
                  </span>
                )}
              </Badge>
            </div>
            {loc.type !== "online" && formatLocationAddress(loc) && (
              <p className="text-xs text-muted-foreground">
                {formatLocationAddress(loc)}
              </p>
            )}
            {loc.phoneNumber && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {loc.phoneNumber}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Appointment type ──────────────────────────────────────────────

function TypeStep({
  types,
  isLoading,
  isError,
  error,
  onSelect,
}: {
  types: AppointmentType[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onSelect: (t: AppointmentType) => void;
}) {
  if (isLoading) return <LoadingBlock />;
  if (isError) {
    return (
      <ErrorBlock
        message={
          (error as { message?: string } | undefined)?.message ??
          "Couldn't load appointment types."
        }
      />
    );
  }
  // Per the doc: prefer `actionInfo.isActive !== false`, only show bookable
  // types. Treat undefined as bookable (best-effort — most types ship
  // without an explicit flag).
  const bookable = types.filter(
    (t) =>
      (t as any).actionInfo?.isActive !== false &&
      t.isBookable !== false,
  );
  if (bookable.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center space-y-2">
          <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/40" />
          <p className="font-semibold">No bookable appointment types</p>
          <p className="text-sm text-muted-foreground">
            Your trainer hasn't published any bookable session types yet.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Pick what kind of session you want to book.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bookable.map((t) => {
          const actionInfo = (t as any).actionInfo as
            | { isVideoCall?: boolean }
            | undefined;
          const typeId = readAppointmentTypeId(t);
          return (
            <button
              key={typeId ?? t.name ?? Math.random()}
              type="button"
              onClick={() => onSelect(t)}
              className="text-left border-2 border-border rounded-md p-4 hover:border-primary hover:bg-muted/40 transition-colors"
            >
              <p className="font-semibold mb-1">
                {t.name ?? `Type #${typeId ?? "?"}`}
              </p>
              {t.description && (
                <p className="text-xs text-muted-foreground mb-2">
                  {t.description}
                </p>
              )}
              <div className="flex gap-2 flex-wrap text-[11px]">
                {typeof t.duration === "number" && (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" /> {t.duration} min
                  </Badge>
                )}
                {actionInfo?.isVideoCall && (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <Video className="w-3 h-3" /> Video
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Slot grid ─────────────────────────────────────────────────────

function SlotsStep({
  weekStartISO,
  onShiftWeek,
  timeslotsQuery,
  pendingSlot,
  onPickSlot,
}: {
  weekStartISO: string;
  onShiftWeek: (delta: number) => void;
  timeslotsQuery: ReturnType<typeof useTimeslots>;
  pendingSlot: string | null;
  onPickSlot: (slot: string) => void;
}) {
  const dailyTimeslots = timeslotsQuery.data ?? {};
  // Sort days chronologically — Trainerize uses midnight datetime strings
  // (`"2026-06-08 00:00:00"`) as the map key, so date parse works directly.
  const days = useMemo(
    () =>
      Object.entries(dailyTimeslots).sort(
        (a, b) => Date.parse(a[0]) - Date.parse(b[0]),
      ),
    [dailyTimeslots],
  );
  const totalAvailable = days.reduce(
    (sum, [, day]) => sum + (day.availableCount ?? 0),
    0,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onShiftWeek(-SLOT_WINDOW_DAYS)}
            disabled={timeslotsQuery.isLoading}
            className="gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Earlier
          </Button>
          <span className="text-xs text-muted-foreground font-mono">
            {weekStartISO} → {format(addDays(parseISO(weekStartISO), SLOT_WINDOW_DAYS), "yyyy-MM-dd")}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onShiftWeek(SLOT_WINDOW_DAYS)}
            disabled={timeslotsQuery.isLoading}
            className="gap-1"
          >
            Later <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <Badge variant="outline" className="text-[10px]">
          {totalAvailable} available
        </Badge>
      </div>

      {timeslotsQuery.isLoading ? (
        <LoadingBlock />
      ) : timeslotsQuery.isError ? (
        <ErrorBlock
          message={
            (timeslotsQuery.error as { message?: string } | undefined)?.message ??
            "Couldn't load timeslots."
          }
        />
      ) : days.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No slots in this range. Try a later week or another type.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {days.map(([dayKey, day]) => (
            <DayRow
              key={dayKey}
              dayKey={dayKey}
              day={day}
              pendingSlot={pendingSlot}
              onPick={onPickSlot}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DayRow({
  dayKey,
  day,
  pendingSlot,
  onPick,
}: {
  dayKey: string;
  day: DailyTimeslot;
  pendingSlot: string | null;
  onPick: (slot: string) => void;
}) {
  const slots = Array.isArray(day.timeslots) ? day.timeslots : [];
  const label = safeFormat(dayKey, "EEE, MMM d");
  return (
    <Card className="border border-border">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{label}</p>
          <span className="text-[11px] text-muted-foreground font-mono">
            {day.availableCount ?? 0} available
          </span>
        </div>
        {slots.length === 0 ? (
          <p className="text-xs text-muted-foreground">No slots offered.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {slots.map((s) => {
              const time = safeFormat(s.timeslot, "h:mm a");
              const available = s.availabilityStatus === "available";
              const selected = pendingSlot === s.timeslot;
              return (
                <button
                  key={s.timeslot}
                  type="button"
                  onClick={() => available && onPick(s.timeslot)}
                  disabled={!available}
                  title={available ? "Click to select" : s.availabilityStatus}
                  className={
                    selected
                      ? "px-3 py-1.5 rounded-sm border-2 border-primary bg-primary text-primary-foreground text-xs font-semibold"
                      : available
                        ? "px-3 py-1.5 rounded-sm border border-border hover:border-primary text-xs"
                        : "px-3 py-1.5 rounded-sm border border-border/40 text-muted-foreground/60 text-xs cursor-not-allowed line-through"
                  }
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Shared blocks ─────────────────────────────────────────────────────────

function LoadingBlock() {
  return (
    <Card>
      <CardContent className="py-10 flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-2 text-destructive">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span className="text-sm">{message}</span>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function safeFormat(value: string | undefined | null, pattern: string): string {
  if (!value) return "";
  // Trainerize slot strings are `YYYY-MM-DD HH:MM:SS` — date-fns can parse
  // them via the `T` swap. Keep verbose to also accept ISO-with-`T`.
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  try {
    return format(parseISO(normalized), pattern);
  } catch {
    return value;
  }
}

function formatSlotDisplay(slot: string): string {
  return safeFormat(slot, "EEE, MMM d, h:mm a") || slot;
}
