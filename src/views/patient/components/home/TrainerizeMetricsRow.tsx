// @ts-nocheck
import { useMemo } from "react";
import { addDays, format, parseISO, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Loader2,
  Minus,
  Scale,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTrainerizeCalendar } from "@/hooks/trainerize/useCalendar";
import { useTrainerizeLink } from "@/hooks/trainerize/useLinkage";
import HeatmapRow from "@/views/patient/components/workouts/HeatmapRow";
import { createPageUrl } from "@/utils";

/**
 * Row of three Trainerize-backed dashboard metrics:
 *   1. Today's workout (calendar today)
 *   2. Body stats (calendar last 14 days, latest tracked entry + trend)
 *   3. Next appointment (calendar today → +30, next scheduled appointmentV2)
 *
 * Wraps everything in a single `useTrainerizeLink` gate — if the user
 * isn't linked, the entire row hides instead of leaving an empty band
 * across the dashboard. Each card reads its own calendar slice; React
 * Query dedupes by key so today's slice is shared with the Habits card.
 */
export default function TrainerizeMetricsRow() {
  const linkQuery = useTrainerizeLink();

  // Hide outright when not linked. Loading shows a placeholder grid so
  // the layout doesn't pop into existence after a fetch.
  if (!linkQuery.isLoading && !linkQuery.data) return null;

  return (
    <div className="flex flex-col">
      <WorkoutHeatmapCard />
      <BodyStatsCard />
      <NextAppointmentCard />
    </div>
  );
}

// ─── 14-day workout heatmap ───────────────────────────────────────────────

const WORKOUT_TYPES = new Set([
  "workout",
  "workoutRegular",
  "workoutCircuit",
  "workoutInterval",
]);

/**
 * Dashboard card that reuses the Workouts → STATS tab heatmap. Same
 * 14-day window, same per-day count of tracked workouts. Today is the
 * rightmost cell.
 *
 * Computes the day buckets directly from the calendar slice (calendar
 * entries already carry a `status` field, e.g. `"tracked"` /
 * `"scheduled"`), so we don't need the daily-workouts/query roundtrip
 * the Workouts page uses for richer detail.
 */
function WorkoutHeatmapCard() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const start = format(subDays(new Date(), 13), "yyyy-MM-dd");
  const calendarQuery = useTrainerizeCalendar(start, today);

  const days = useMemo(() => {
    const entries = calendarQuery.data ?? [];
    const out: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const count = entries.filter(
        (e) =>
          e.date === d &&
          typeof e.type === "string" &&
          WORKOUT_TYPES.has(e.type as string) &&
          typeof e.status === "string" &&
          e.status.toLowerCase() === "tracked",
      ).length;
      out.push({ date: d, count });
    }
    return out;
  }, [calendarQuery.data]);

  const totalTracked = days.reduce((s, d) => s + d.count, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Dumbbell className="w-4 h-4 text-primary" />
          14-day activity
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Workouts tracked per day. Today is on the right.
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        {calendarQuery.isLoading ? (
          <CardLoader />
        ) : totalTracked === 0 ? (
          <EmptyState
            icon={<Dumbbell className="w-7 h-7 text-muted-foreground/40" />}
            text="No workouts tracked in the last 14 days."
          />
        ) : (
          <div className="space-y-3">
            <p className="text-2xl font-bold text-foreground leading-none">
              {totalTracked}{" "}
              <span className="text-sm font-medium text-muted-foreground">
                {totalTracked === 1 ? "workout" : "workouts"}
              </span>
            </p>
            <HeatmapRow days={days} compact />
          </div>
        )}

        <div className="mt-auto pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(createPageUrl("Workouts"))}
            className="w-full gap-1.5"
          >
            Open workouts <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Body stats ───────────────────────────────────────────────────────────

interface BodyStatPoint {
  date: string;
  weight: number;
  fat?: number;
}

function BodyStatsCard() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const start = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const calendarQuery = useTrainerizeCalendar(start, today);

  const tracked = useMemo<BodyStatPoint[]>(() => {
    const entries = calendarQuery.data ?? [];
    const out: BodyStatPoint[] = [];
    for (const e of entries) {
      if (e.type !== "bodyStat") continue;
      if (typeof e.status !== "string" || e.status.toLowerCase() !== "tracked")
        continue;
      const detail = (e.detail ?? {}) as Record<string, unknown>;
      const weight =
        typeof detail.weight === "number" && detail.weight > 0
          ? detail.weight
          : null;
      if (weight === null) continue;
      out.push({
        date: e.date,
        weight,
        ...(typeof detail.fat === "number" && detail.fat > 0
          ? { fat: detail.fat }
          : {}),
      });
    }
    return out.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [calendarQuery.data]);

  const latest = tracked[0];
  const previous = tracked[1];
  const delta =
    latest && previous ? +(latest.weight - previous.weight).toFixed(1) : null;
  const DeltaIcon =
    delta === null ? Minus : delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const deltaClass =
    delta === null || delta === 0
      ? "text-muted-foreground"
      : delta > 0
        ? "text-amber-600"
        : "text-emerald-600";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="w-4 h-4 text-primary" />
          Body stats
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        {calendarQuery.isLoading ? (
          <CardLoader />
        ) : latest ? (
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground leading-none">
              {latest.weight} lbs
            </p>
            <p className="text-xs text-muted-foreground">
              {typeof latest.fat === "number" ? `${latest.fat}% BF · ` : ""}
              tracked {safeFormat(latest.date, "MMM d")}
            </p>
            {delta !== null && delta !== 0 && (
              <div
                className={`flex items-center gap-1 text-xs font-semibold ${deltaClass}`}
              >
                <DeltaIcon className="w-3 h-3" />
                {Math.abs(delta)} lbs vs prior log
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<Scale className="w-7 h-7 text-muted-foreground/40" />}
            text="No body stats tracked recently."
          />
        )}

        <div className="mt-auto pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(createPageUrl("Progress"))}
            className="w-full gap-1.5"
          >
            View progress <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Next appointment ─────────────────────────────────────────────────────

function NextAppointmentCard() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const end = format(addDays(new Date(), 30), "yyyy-MM-dd");
  const calendarQuery = useTrainerizeCalendar(today, end);

  const nextAppt = useMemo(() => {
    const entries = calendarQuery.data ?? [];
    const nowMs = Date.now();
    const upcoming = entries
      .filter((e) => e.type === "appointmentV2")
      .map((e) => {
        const detail = (e.detail ?? {}) as Record<string, unknown>;
        const startDate =
          typeof detail.startDate === "string" ? detail.startDate : null;
        const trainerName =
          typeof detail.trainerName === "string" ? detail.trainerName : null;
        return {
          title: typeof e.title === "string" ? e.title : "Appointment",
          startDate,
          trainerName,
        };
      })
      .filter((a) => a.startDate)
      .filter((a) => Date.parse(a.startDate as string) >= nowMs)
      .sort(
        (a, b) =>
          Date.parse(a.startDate as string) -
          Date.parse(b.startDate as string),
      );
    return upcoming[0] ?? null;
  }, [calendarQuery.data]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="w-4 h-4 text-primary" />
          Next appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        {calendarQuery.isLoading ? (
          <CardLoader />
        ) : nextAppt ? (
          <div className="space-y-1">
            <p
              className="font-semibold text-foreground leading-tight line-clamp-2"
              title={nextAppt.title}
            >
              {nextAppt.title}
            </p>
            <p className="text-sm text-foreground/80">
              {safeFormat(
                nextAppt.startDate as string,
                "EEE, MMM d · h:mm a",
              )}
            </p>
            {nextAppt.trainerName && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                {nextAppt.trainerName}
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarDays className="w-7 h-7 text-muted-foreground/40" />}
            text="No upcoming appointments."
          />
        )}

        <div className="mt-auto pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(createPageUrl("Appointments"))}
            className="w-full gap-1.5"
          >
            Open appointments <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────

function CardLoader() {
  return (
    <div className="py-6 flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function EmptyState({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4 text-center">
      {icon}
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function safeFormat(value: string, pattern: string): string {
  try {
    return format(parseISO(value), pattern);
  } catch {
    return value;
  }
}
