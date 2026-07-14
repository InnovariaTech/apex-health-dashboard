// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import {
  Dumbbell,
  Play,
  CheckCircle,
  Calendar,
  TrendingUp,
  Clock,
  Flame,
  Library,
  BarChart2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import TrainerizeGate from "@/components/trainerize/TrainerizeGate";
import { useTrainerizeCalendar } from "@/hooks/trainerize/useCalendar";
import {
  useTrainingPlans,
  useTrainerizePrograms,
  useWorkoutDefs,
} from "@/hooks/trainerize/usePlans";
import {
  useDailyWorkouts,
  useScheduleWorkout,
  useUpsertDailyWorkouts,
} from "@/hooks/trainerize/useDailyWorkouts";
import {
  useTrainerizeUnits,
  useTrainerizeSettings,
} from "@/hooks/trainerize/useLinkage";
import type { CalendarEntry } from "@/types/trainerize/calendar_types";
import type {
  DailyWorkout,
  DailyWorkoutExercise,
  ExerciseSetStat,
} from "@/types/trainerize/workout_types";
import {
  formatExerciseTarget,
  getExerciseThumbnail,
  getExerciseVideoSource,
  getWorkoutDefThumbnail,
  type ExerciseVideoSource,
  type WorkoutDef,
  type WorkoutDefExercise,
} from "@/types/trainerize/plan_types";
import HeatmapRow from "@/views/patient/components/workouts/HeatmapRow";

/**
 * Trainerize-backed workouts page.
 *
 * Tab data sources:
 *   TODAY    → calendar[today].dailyWorkoutIds → POST /me/daily-workouts/query
 *   PROGRAM  → GET /me/training-plans + GET /me/programs
 *   EXERCISES → GET /me/workout-defs?planId  (offset pagination)
 *   HISTORY  → calendar(last 30d) → POST /me/daily-workouts/query
 *   STATS    → aggregations over the history slice
 *
 * Start workout → opens an in-line logger that POSTs /me/daily-workouts with
 * status: "tracked" and per-set stats. The dialog deliberately replaces the
 * old `ActiveWorkout` component (which expected the legacy mock shape).
 */

const TODAY_RANGE_DAYS = 30;
const PAGE_SIZE = 10;

function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

const WORKOUT_ENTRY_TYPES = new Set([
  "workout",
  "workoutRegular",
  "workoutCircuit",
  "workoutInterval",
]);

/**
 * Pull daily-workout IDs out of a flat calendar entry list.
 *
 * The doc claims workout entries use `type === "workout"` but the live
 * `/me/calendar` actually returns `workoutRegular` (and `workoutCircuit`
 * / `workoutInterval` for those styles). We match the real prefix-based
 * naming and also keep the doc's "workout" string so an upstream rename
 * back to the documented value doesn't silently break the page.
 *
 * ID fallback covers all the field-name variations we've seen across the
 * habit + workout surfaces (`id` | `itemID` | `itemId`).
 */
function extractWorkoutIds(entries: CalendarEntry[] | undefined): number[] {
  if (!entries) return [];
  const set = new Set<number>();
  for (const entry of entries) {
    if (typeof entry.type === "string" && WORKOUT_ENTRY_TYPES.has(entry.type)) {
      const id =
        typeof entry.id === "number"
          ? entry.id
          : typeof entry.itemID === "number"
            ? entry.itemID
            : typeof (entry as { itemId?: unknown }).itemId === "number"
              ? ((entry as { itemId?: number }).itemId as number)
              : null;
      if (id !== null) set.add(id);
      continue;
    }
    if (Array.isArray(entry.dailyWorkoutIds)) {
      for (const x of entry.dailyWorkoutIds) {
        if (typeof x === "number") set.add(x);
      }
    }
  }
  return Array.from(set);
}

function entriesByDate(entries: CalendarEntry[] | undefined): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();
  if (!entries) return map;
  for (const e of entries) {
    if (!e.date) continue;
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  return map;
}

export default function Workouts() {
  return (
    <TrainerizeGate>
      <WorkoutsInner />
    </TrainerizeGate>
  );
}

function WorkoutsInner() {
  const settingsQuery = useTrainerizeSettings();
  const { isReady, unitWeight, unitDistance } = useTrainerizeUnits();
  const schedule = useScheduleWorkout();

  // ── Calendar windows ─────────────────────────────────────────────────────
  const today = todayISO();
  const historyStart = format(subDays(new Date(), TODAY_RANGE_DAYS), "yyyy-MM-dd");
  const calendarQuery = useTrainerizeCalendar(historyStart, today);

  // ── Today's workout IDs (calendar entry for today.) ───────────────────────
  const todaysEntries = useMemo(
    () => (calendarQuery.data ?? []).filter((e) => e.date === today),
    [calendarQuery.data, today],
  );
  const todayIds = useMemo(
    () => extractWorkoutIds(todaysEntries),
    [todaysEntries],
  );
  const todayWorkoutsQuery = useDailyWorkouts(todayIds);
  const todayWorkouts: DailyWorkout[] = todayWorkoutsQuery.data ?? [];
  // Today's summary counts — drives the banner above the workout cards.
  const todayCompleted = todayWorkouts.filter(
    (w) => w.status === "tracked" || w.status === "completed",
  );
  const todayPending = todayWorkouts.filter(
    (w) => !(w.status === "tracked" || w.status === "completed"),
  );
  const todayLoggedMinutes = todayCompleted.reduce(
    (sum, w) => sum + Math.round((w.workoutDuration ?? 0) / 60),
    0,
  );

  // ── Lookup: workout-def `id` → today's daily workout ─────────────────────
  // Per `docs/trainerize/client-workouts-flow.md` Screen 3, the EXERCISES
  // tab can resolve a clickable session via `dailyWorkout.workoutID` matching
  // the workout-def `id`. Scoped to today only (decision: today-only range).
  const todayWorkoutByDefId = useMemo(() => {
    const map = new Map<number, DailyWorkout>();
    for (const dw of todayWorkoutsQuery.data ?? []) {
      const defId = (dw as any).workoutID ?? (dw as any).workoutId;
      if (typeof defId === "number") map.set(defId, dw);
    }
    return map;
  }, [todayWorkoutsQuery.data]);

  // ── History (last 30 days) ───────────────────────────────────────────────
  const historyIds = useMemo(
    () => extractWorkoutIds(calendarQuery.data),
    [calendarQuery.data],
  );
  const historyQuery = useDailyWorkouts(historyIds);
  const historyByDate = useMemo(() => {
    const map = new Map<string, DailyWorkout[]>();
    for (const w of historyQuery.data ?? []) {
      if (!w.date) continue;
      const list = map.get(w.date) ?? [];
      list.push(w);
      map.set(w.date, list);
    }
    return map;
  }, [historyQuery.data]);
  const historySorted = useMemo(
    () =>
      Array.from(historyByDate.entries()).sort(
        (a, b) => parseISO(b[0]).getTime() - parseISO(a[0]).getTime(),
      ),
    [historyByDate],
  );

  // ── Plans / programs / workout defs ──────────────────────────────────────
  const plansQuery = useTrainingPlans();
  const programsQuery = useTrainerizePrograms();
  const plans = plansQuery.data ?? [];
  const programs = programsQuery.data ?? [];

  // Only surface plans whose date range contains today. Plans with no
  // startDate are treated as "ongoing" and kept (the upstream sometimes omits
  // dates for templated plans); plans with a startDate in the future or an
  // endDate already past are filtered out.
  const todayStartMs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  const currentPlans = useMemo(
    () =>
      plans.filter((p) => {
        if (typeof p.startDate === "string" && p.startDate) {
          const startMs = parseISO(p.startDate).getTime();
          if (!Number.isNaN(startMs) && startMs > todayStartMs) return false;
        }
        if (typeof p.endDate === "string" && p.endDate) {
          const endMs = parseISO(p.endDate).getTime();
          if (!Number.isNaN(endMs) && endMs < todayStartMs) return false;
        }
        return true;
      }),
    [plans, todayStartMs],
  );

  const [activePlanId, setActivePlanId] = useState<number | undefined>();
  const effectivePlanId = activePlanId ?? currentPlans[0]?.id;
  const [defsStart, setDefsStart] = useState(0);
  const [defsSearch, setDefsSearch] = useState("");
  const defsQuery = useWorkoutDefs(effectivePlanId, {
    searchTerm: defsSearch || undefined,
    start: defsStart,
    count: PAGE_SIZE,
  });
  const defs = defsQuery.data ?? [];

  // ── Stats roll-up ────────────────────────────────────────────────────────
  const completed = useMemo(
    () =>
      // Doc canonical "done" status is "tracked"; accept the older "completed"
      // value too for backward compatibility with any pre-fix records.
      (historyQuery.data ?? []).filter(
        (w) => w.status === "tracked" || w.status === "completed",
      ),
    [historyQuery.data],
  );
  const thisWeekCutoff = subDays(new Date(), 7).getTime();
  const thisWeek = completed.filter(
    (w) => w.date && parseISO(w.date).getTime() >= thisWeekCutoff,
  );
  const totalMinutes = completed.reduce(
    (sum, w) => sum + Math.round((w.workoutDuration ?? 0) / 60),
    0,
  );

  /**
   * 14-day completion heatmap — count tracked workouts per day. Today is the
   * rightmost cell; 13 days ago is the leftmost. Pure derivation over the
   * already-loaded history slice — no extra fetch.
   */
  const heatmapDays = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const count = (historyQuery.data ?? []).filter(
        (w) =>
          w.date === d && (w.status === "tracked" || w.status === "completed"),
      ).length;
      data.push({ date: d, count });
    }
    return data;
  }, [historyQuery.data]);

  /**
   * Top tracked workouts in the loaded 30-day window. Grouped by `name`
   * (workoutID isn't always present on the daily-workouts payload), so
   * "AFPC - FOUNDATIONAL STRENGTH (DAY 1)" rolls up into one row.
   */
  const mostDoneLast30Days = useMemo(() => {
    const counts = new Map<
      string,
      { name: string; count: number; workoutID?: number }
    >();
    for (const w of historyQuery.data ?? []) {
      if (w.status !== "tracked" && w.status !== "completed") continue;
      const key = w.name;
      const entry =
        counts.get(key) ??
        {
          name: w.name,
          count: 0,
          workoutID: (w as { workoutID?: number }).workoutID,
        };
      entry.count += 1;
      counts.set(key, entry);
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [historyQuery.data]);

  /**
   * Cardio summary over the 30-day calendar window. Cardio entries live on
   * the calendar directly (no daily-workouts/query needed) — `detail.time`
   * is in seconds matching the workoutDuration convention.
   */
  const cardioSummary = useMemo(() => {
    const cardio = (calendarQuery.data ?? []).filter(
      (e) => e.type === "cardio",
    );
    const tracked = cardio.filter((e) => e.status === "tracked");
    const totalSeconds = tracked.reduce((sum, e) => {
      const t = (e.detail as { time?: number } | null | undefined)?.time;
      return sum + (typeof t === "number" ? t : 0);
    }, 0);
    return {
      total: cardio.length,
      tracked: tracked.length,
      minutes: Math.round(totalSeconds / 60),
    };
  }, [calendarQuery.data]);

  // ── Start workout dialog ─────────────────────────────────────────────────
  const [logger, setLogger] = useState<DailyWorkout | null>(null);
  const [pendingDefId, setPendingDefId] = useState<number | null>(null);
  const [videoModal, setVideoModal] = useState<WorkoutDefExercise | null>(null);
  /**
   * Selected workout for the drill-down detail view. When set, the Exercises
   * section replaces its grid/search/pagination with the detail layout for
   * this workout. `null` shows the grid as before. Store the whole def (not
   * just the id) so the detail view keeps rendering even if pagination /
   * search moves the def out of the current `defs` page.
   */
  const [selectedDef, setSelectedDef] = useState<WorkoutDef | null>(null);

  /**
   * Workout-def thumbnail lookup keyed by `workoutID` (the def's id). Drives
   * the hero image on the TODAY cards and the "most done this month" list.
   * Falls back to whatever def we know about — the current `defs` page plus
   * the drilled-down `selectedDef`.
   */
  const workoutDefThumbMap = useMemo(() => {
    const map = new Map<number, string>();
    const allDefs: WorkoutDef[] = [];
    for (const d of defs) allDefs.push(d as WorkoutDef);
    if (selectedDef && !defs.find((d) => d.id === selectedDef.id)) {
      allDefs.push(selectedDef);
    }
    for (const def of allDefs) {
      if (typeof def.id !== "number" || map.has(def.id)) continue;
      const t = getWorkoutDefThumbnail(def);
      if (t) map.set(def.id, t);
    }
    return map;
  }, [defs, selectedDef]);

  /**
   * Fallback thumbnail lookup keyed by exercise definition id (`def.id`).
   * Built from every workout-def loaded so far (current page + the drilled-
   * down workout). The daily-workouts/query response may carry `media` on
   * each exercise itself, but when it doesn't this map lets the logger
   * still show thumbnails by matching the def id we already know about.
   *
   * Declared AFTER `selectedDef` because it reads it — keep the memo below
   * the state declaration or React's TDZ throws on first render.
   */
  const exerciseThumbnailMap = useMemo(() => {
    const map = new Map<number, string>();
    const seen = new Set<number>();
    const allDefs: WorkoutDef[] = [];
    for (const d of defs) allDefs.push(d as WorkoutDef);
    if (selectedDef && !defs.find((d) => d.id === selectedDef.id)) {
      allDefs.push(selectedDef);
    }
    for (const def of allDefs) {
      for (const ex of def.exercises ?? []) {
        if (typeof ex.id !== "number" || seen.has(ex.id)) continue;
        seen.add(ex.id);
        const t = getExerciseThumbnail(ex as WorkoutDefExercise);
        if (t) map.set(ex.id, t);
      }
    }
    return map;
  }, [defs, selectedDef]);

  /**
   * Flow 2 step "Create today's instance" → opens the logger.
   *
   * Duplicate guard: if the def is already on today's calendar (we resolve
   * via the existing `workoutID → DailyWorkout` map), reuse that session
   * instead of double-scheduling.
   */
  const handleAddToToday = async (def: { id: number; name: string }) => {
    const existing = todayWorkoutByDefId.get(def.id);
    if (existing) {
      setLogger(existing);
      return;
    }
    setPendingDefId(def.id);
    try {
      const dw = await schedule.mutateAsync({
        workoutID: def.id,
        name: def.name,
        date: today,
        ...(unitWeight ? { unitWeight } : {}),
        ...(unitDistance ? { unitDistance } : {}),
      });
      toast({ title: "Added to today", description: def.name });
      setLogger(dw);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't add to today",
        description:
          (err as { message?: string } | undefined)?.message ??
          "Please try again.",
      });
    } finally {
      setPendingDefId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      <div className="mb-8 pb-6 border-b-2 border-border">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          WORKOUTS
        </h1>
        <p className="text-muted-foreground font-semibold">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
        {settingsQuery.isError && (
          <p className="text-xs text-destructive mt-2">
            Settings failed to load — units may be off.
          </p>
        )}
      </div>

      <Tabs defaultValue="program" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-3 bg-muted p-1">
          <TabsTrigger value="program" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Dumbbell className="w-4 h-4 mr-2" />PROGRAM
          </TabsTrigger>
          <TabsTrigger value="today" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Calendar className="w-4 h-4 mr-2" />TODAY
          </TabsTrigger>
          {/* HISTORY tab hidden by request — see TabsContent below for the same.
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <TrendingUp className="w-4 h-4 mr-2" />HISTORY
          </TabsTrigger>
          */}
          <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <BarChart2 className="w-4 h-4 mr-2" />STATS
          </TabsTrigger>
        </TabsList>

        {/* ── TODAY ─────────────────────────────────────────────────────── */}
        <TabsContent value="today" className="space-y-6">
          {!isReady || calendarQuery.isLoading || todayWorkoutsQuery.isLoading ? (
            <LoadingCard />
          ) : todayWorkouts.length === 0 ? (
            <EmptyCard
              title="Rest Day"
              body="No workout scheduled for today. Focus on recovery!"
            />
          ) : (
            <>
              <Card className="border-2 border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {format(new Date(), "EEEE, MMMM d")}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-0.5">
                        {todayWorkouts.length} workout
                        {todayWorkouts.length === 1 ? "" : "s"} today
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="border-primary text-primary text-xs"
                      >
                        {todayCompleted.length} completed
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-muted-foreground text-xs"
                      >
                        {todayPending.length} pending
                      </Badge>
                      {todayLoggedMinutes > 0 && (
                        <Badge
                          variant="outline"
                          className="text-foreground text-xs"
                        >
                          {todayLoggedMinutes} min logged
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayWorkouts.map((w) => (
                  <TodayWorkoutCard
                    key={w.id}
                    workout={w}
                    thumbnail={
                      typeof (w as { workoutID?: number }).workoutID === "number"
                        ? workoutDefThumbMap.get(
                            (w as { workoutID?: number }).workoutID as number,
                          ) ?? null
                        : null
                    }
                    onOpen={() => setLogger(w)}
                  />
                ))}
              </div>
            </>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile icon={Flame} label="This Week" value={thisWeek.length} suffix="workouts" usePrimary />
            <StatTile icon={Clock} label="Total Time" value={totalMinutes} suffix="minutes" />
            <StatTile
              icon={CheckCircle}
              label="Completion"
              value={
                historyIds.length
                  ? `${Math.round((completed.length / historyIds.length) * 100)}%`
                  : "0%"
              }
              suffix="of scheduled"
              usePrimary
            />
            <StatTile icon={TrendingUp} label="Streak" value={computeStreak(completed)} suffix="days" />
          </div>
        </TabsContent>

        {/* ── PROGRAM ───────────────────────────────────────────────────── */}
        <TabsContent value="program" className="space-y-4">
          {plansQuery.isLoading ? (
            <LoadingCard />
          ) : plans.length === 0 ? (
            <EmptyCard
              title="No Program Assigned"
              body="Contact your trainer to get a personalized workout program."
            />
          ) : currentPlans.length === 0 ? (
            <EmptyCard
              title="No active program"
              body="Your training plans are upcoming or already completed — none are running today."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPlans.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => setActivePlanId(p.id)}
                  className={`border-2 cursor-pointer transition-colors ${
                    p.id === effectivePlanId ? "border-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  <CardContent className="p-5">
                    <p className="font-bold text-lg mb-1">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Plan ID {p.id}
                    </p>
                    {p.startDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Starts {p.startDate}
                      </p>
                    )}
                    {p.durationType && p.durationType !== "notSpecified" && (
                      <p className="text-xs text-muted-foreground">
                        Duration: {p.duration ?? "—"} {String(p.durationType)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {programs.length > 0 && (
            <div className="pt-4">
              <p className="apex-eyebrow text-xs mb-2 text-muted-foreground font-bold uppercase tracking-wider">
                Enrolled programs
              </p>
              <div className="flex flex-wrap gap-2">
                {programs.map((pr) => (
                  <Badge key={pr.id} variant="outline" className="text-xs">
                    {pr.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ── Exercises (workout-defs of active plan) ─────────────── */}
          <div className="pt-6 border-t-2 border-border mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Library className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Exercises</h2>
            </div>

            {!effectivePlanId ? (
              <EmptyCard
                title="No plan selected"
                body="Select a plan above to see its workouts."
              />
            ) : selectedDef ? (
              <WorkoutDefDetailView
                def={selectedDef}
                scheduled={todayWorkoutByDefId.get(selectedDef.id)}
                isAdding={
                  pendingDefId === selectedDef.id && schedule.isPending
                }
                onBack={() => setSelectedDef(null)}
                onAddToToday={() =>
                  void handleAddToToday({
                    id: selectedDef.id,
                    name: selectedDef.name,
                  })
                }
                onStartSession={(dw) => setLogger(dw)}
                onPlayVideo={(exercise) => setVideoModal(exercise)}
              />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Search workouts…"
                    value={defsSearch}
                    onChange={(e) => {
                      setDefsSearch(e.target.value);
                      setDefsStart(0);
                    }}
                    className="max-w-sm"
                  />
                  <span className="text-xs text-muted-foreground">
                    Plan {effectivePlanId}
                  </span>
                </div>

                {defsQuery.isLoading ? (
                  <LoadingCard />
                ) : defs.length === 0 ? (
                  <EmptyCard title="No workouts" body="No workouts found for this plan." />
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {defs.map((d) => {
                    const scheduled = todayWorkoutByDefId.get(d.id);
                    const status = scheduled?.status;
                    const heroThumb = getWorkoutDefThumbnail(d as WorkoutDef);
                    const exerciseCount = d.exercises?.length ?? 0;
                    return (
                      <Card
                        key={d.id}
                        className="border-2 border-border hover:border-primary/60 cursor-pointer transition-colors overflow-hidden"
                        onClick={() => setSelectedDef(d as WorkoutDef)}
                      >
                        {heroThumb && (
                          <div className="w-full aspect-[16/9] bg-muted border-b border-border overflow-hidden">
                            <img
                              src={heroThumb}
                              alt={d.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold">{d.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {exerciseCount} exercises
                                {typeof d.duration === "number" && d.duration > 0
                                  ? ` • Est. ${Math.round(d.duration / 60)} min`
                                  : ""}
                              </p>
                            </div>
                            {scheduled && (
                              <Badge
                                variant="outline"
                                className={
                                  status === "tracked"
                                    ? "border-primary text-primary"
                                    : status === "checkedIn"
                                      ? "border-amber-500 text-amber-600"
                                      : "border-primary text-primary"
                                }
                              >
                                {status === "tracked"
                                  ? "Tracked today"
                                  : status === "checkedIn"
                                    ? "Checked in"
                                    : "Today"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-2">
                            Tap to view exercises.
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDefsStart(Math.max(0, defsStart - PAGE_SIZE))}
                    disabled={defsStart === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDefsStart(defsStart + PAGE_SIZE)}
                    disabled={defs.length < PAGE_SIZE}
                    className="gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ── HISTORY (hidden by request) ───────────────────────────────────
        <TabsContent value="history" className="space-y-4">
          {calendarQuery.isLoading || historyQuery.isLoading ? (
            <LoadingCard />
          ) : historySorted.length === 0 ? (
            <EmptyCard
              title="No history yet"
              body={`No workouts logged in the last ${TODAY_RANGE_DAYS} days.`}
            />
          ) : (
            historySorted.map(([date, workouts]) => (
              <Card key={date} className="border-2 border-border">
                <CardContent className="p-4">
                  <p className="font-bold mb-2">
                    {format(parseISO(date), "EEEE, MMM d")}
                  </p>
                  <div className="space-y-2">
                    {workouts.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setLogger(w)}
                        className="w-full text-left flex items-center justify-between p-2 border border-border rounded-sm hover:border-primary/60 hover:bg-muted/40 transition-colors"
                        title="Click to view or edit this session"
                      >
                        <div>
                          <p className="font-semibold">{w.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {w.exercises?.length ?? 0} exercises • {w.type}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            w.status === "tracked" || w.status === "completed"
                              ? "border-primary text-primary"
                              : w.status === "checkedIn"
                                ? "border-amber-500 text-amber-600"
                                : "text-muted-foreground"
                          }
                        >
                          {w.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        */}

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile
              icon={Flame}
              label="This Week"
              value={thisWeek.length}
              suffix="workouts"
              usePrimary
            />
            <StatTile
              icon={Clock}
              label="Time (30d)"
              value={totalMinutes}
              suffix="minutes"
            />
            <StatTile
              icon={CheckCircle}
              label="Completion (30d)"
              value={
                historyIds.length
                  ? `${Math.round((completed.length / historyIds.length) * 100)}%`
                  : "0%"
              }
              suffix="of scheduled"
              usePrimary
            />
            <StatTile
              icon={TrendingUp}
              label="Streak"
              value={computeStreak(completed)}
              suffix="days"
            />
          </div>

          <Card className="border-2 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">14-day activity</CardTitle>
              <p className="text-xs text-muted-foreground">
                Workouts tracked per day. Today is on the right.
              </p>
            </CardHeader>
            <CardContent>
              <HeatmapRow days={heatmapDays} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary" />
                  Most done (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mostDoneLast30Days.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tracked workouts yet in the last 30 days.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {mostDoneLast30Days.map((item) => {
                      const thumb =
                        typeof item.workoutID === "number"
                          ? workoutDefThumbMap.get(item.workoutID) ?? null
                          : null;
                      return (
                        <li
                          key={item.name}
                          className="flex items-center gap-3"
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={item.name}
                              loading="lazy"
                              className="w-10 h-10 rounded-sm object-cover border border-border flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-sm bg-muted border border-border flex-shrink-0 flex items-center justify-center">
                              <Dumbbell className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {item.name}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs border-primary text-primary"
                          >
                            {item.count}×
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Cardio (30d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cardioSummary.total === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No cardio sessions logged in the last 30 days.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {cardioSummary.tracked}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        completed
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {cardioSummary.total - cardioSummary.tracked}
                      </p>
                      <p className="text-xs text-muted-foreground">pending</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {cardioSummary.minutes}
                      </p>
                      <p className="text-xs text-muted-foreground">minutes</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
            <StatTile
              icon={Dumbbell}
              label="Plans"
              value={plans.length}
              suffix="assigned"
            />
            <StatTile
              icon={Library}
              label="Programs"
              value={programs.length}
              suffix="enrolled"
            />
          </div>
        </TabsContent>
      </Tabs>

      {logger && (
        <WorkoutLoggerDialog
          workout={logger}
          thumbnailLookup={exerciseThumbnailMap}
          onClose={() => setLogger(null)}
        />
      )}

      {videoModal && (
        <ExerciseDetailDialog
          exercise={videoModal}
          onClose={() => setVideoModal(null)}
        />
      )}
    </div>
  );
}

// ─── Workout logger dialog ─────────────────────────────────────────────────

interface WorkoutLoggerDialogProps {
  workout: DailyWorkout;
  /**
   * Optional `def.id → thumbnail URL` lookup. Used as a fallback when the
   * daily workout's exercises don't carry their own `media` block — we still
   * know the exercise definition id, so we can show the image from the
   * workout-defs cache.
   */
  thumbnailLookup?: Map<number, string>;
  onClose: () => void;
}

function WorkoutLoggerDialog({
  workout,
  thumbnailLookup,
  onClose,
}: WorkoutLoggerDialogProps) {
  const { unitWeight, unitDistance } = useTrainerizeUnits();
  const upsert = useUpsertDailyWorkouts();

  // Snapshot the status at open so "first completion" is stable even after
  // we save once and the local workout object isn't refreshed yet.
  const originalStatus: string = workout.status ?? "scheduled";
  const isFirstCompletion = originalStatus !== "tracked";

  const [exercises, setExercises] = useState<DailyWorkoutExercise[]>(() =>
    (workout.exercises ?? []).map((ex) => ({
      ...ex,
      stats:
        ex.stats && ex.stats.length > 0
          ? ex.stats
          : Array.from({ length: ex.sets ?? 1 }).map<ExerciseSetStat>((_, i) => ({
              setID: i + 1,
            })),
    })),
  );

  // Comments / RPE are only sent on first completion per the doc.
  const [comment, setComment] = useState("");
  const [rpe, setRpe] = useState<number>(0);

  const updateStat = (
    exIdx: number,
    setIdx: number,
    field: keyof ExerciseSetStat,
    value: number,
  ) => {
    setExercises((prev) => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const stats = [...(ex.stats ?? [])];
      stats[setIdx] = { ...stats[setIdx], [field]: value };
      ex.stats = stats;
      next[exIdx] = ex;
      return next;
    });
  };

  /**
   * Save payload matches `docs/trainerize/client-workouts-flow.md` Screen 4:
   *   - top-level `type` defaults to "workoutRegular", `style` to "normal"
   *   - per-exercise spread preserves recordType / supersetType / type
   *   - status progression: scheduled → checkedIn (optional) → tracked
   *   - `comments` only on first completion (status !== "tracked" at open)
   */
  const handleSave = async (
    nextStatus: "scheduled" | "checkedIn" | "tracked",
  ) => {
    try {
      const dailyWorkout: any = {
        ...workout,
        type: workout.type ?? "workoutRegular",
        style: workout.style ?? "normal",
        status: nextStatus,
        // Spread each exercise so recordType / supersetType / def / type / etc.
        // flow through from the query response untouched; only override stats.
        exercises: exercises.map((ex) => ({ ...ex, stats: ex.stats })),
      };

      // Attach comments + RPE only on the first transition into "tracked".
      if (
        nextStatus === "tracked" &&
        isFirstCompletion &&
        (comment.trim() || rpe > 0)
      ) {
        dailyWorkout.comments = {
          ...(comment.trim() ? { comment: comment.trim() } : {}),
          ...(rpe > 0 ? { rpe } : {}),
        };
      }

      await upsert.mutateAsync({
        unitWeight,
        unitDistance,
        dailyWorkouts: [dailyWorkout],
      });

      toast({
        title:
          nextStatus === "tracked"
            ? "Workout tracked"
            : nextStatus === "checkedIn"
              ? "Checked in"
              : "Progress saved",
        description: workout.name,
      });
      onClose();
    } catch (err) {
      const message =
        (err as { message?: string } | undefined)?.message ?? "Save failed";
      toast({
        variant: "destructive",
        title: "Could not save workout",
        description: message,
      });
    }
  };

  const statusBadgeColor =
    originalStatus === "tracked"
      ? "border-primary text-primary"
      : originalStatus === "checkedIn"
        ? "border-amber-500 text-amber-600"
        : "text-muted-foreground";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-baseline justify-between gap-3">
            <DialogTitle className="text-2xl font-bold">
              {workout.name}
            </DialogTitle>
            <Badge variant="outline" className={statusBadgeColor}>
              {originalStatus}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Log your sets, then mark completed. Weights in {unitWeight}.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {exercises.map((ex, exIdx) => {
            // Prefer media on the daily exercise itself; fall back to the
            // workout-defs lookup keyed by `def.id`. The fallback covers
            // the common case where `daily-workouts/query` doesn't echo
            // media but we already loaded it via `workout-defs`.
            const directThumb = getExerciseThumbnail(ex as WorkoutDefExercise);
            const lookupThumb =
              typeof ex.def?.id === "number"
                ? (thumbnailLookup?.get(ex.def.id) ?? null)
                : null;
            const thumb = directThumb ?? lookupThumb;
            const name =
              ex.def?.name ?? ex.name ?? `Exercise ${exIdx + 1}`;
            return (
            <Card key={ex.dailyExerciseID || exIdx} className="border-2 border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={name}
                      loading="lazy"
                      className="w-14 h-14 rounded-sm object-cover border border-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-sm bg-muted border border-border flex-shrink-0 flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-2 flex-1 min-w-0">
                    <p className="font-bold truncate">{name}</p>
                    {ex.targetDetail && (
                      <span className="text-xs text-muted-foreground font-mono flex-shrink-0">
                        Target {ex.targetDetail}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {(ex.stats ?? []).map((s, setIdx) => {
                    const fields = statFieldsForExercise(ex);
                    return (
                      <div
                        key={s.setID || setIdx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="w-12 font-mono text-xs text-muted-foreground">
                          SET {setIdx + 1}
                        </span>
                        {fields.map((field) => (
                          <Input
                            key={field}
                            type="number"
                            placeholder={statFieldPlaceholder(
                              field,
                              unitWeight,
                              unitDistance,
                            )}
                            value={(s[field] as number | undefined) ?? ""}
                            onChange={(e) =>
                              updateStat(
                                exIdx,
                                setIdx,
                                field,
                                Number(e.target.value) || 0,
                              )
                            }
                            className={`h-9 ${statFieldWidth(field)}`}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Comments + RPE — only on first completion per the doc. */}
        {isFirstCompletion && (
          <div className="border-2 border-border rounded-md p-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Session notes (optional, first completion only)
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How did it feel? Any tweaks for next time?"
              rows={2}
              className="w-full text-sm border border-border rounded-md p-2 bg-background resize-none"
            />
            <div className="flex items-center gap-3 text-sm">
              <span className="text-xs text-muted-foreground w-24">
                RPE {rpe || "—"}
              </span>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-[11px] text-muted-foreground">0–10</span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2 flex-wrap">
          {/* Save progress — POSTs with status unchanged. User stores partial
              reps/weights without finishing the workout. */}
          <Button
            variant="outline"
            onClick={() => void handleSave(originalStatus as any)}
            disabled={upsert.isPending}
            title="Save your stats without finishing the workout"
          >
            Save progress
          </Button>
          {/* Mark tracked — POSTs with status "tracked", completing the
              session and triggering PR / milestone detection upstream. */}
          <Button
            onClick={() => void handleSave("tracked")}
            disabled={upsert.isPending}
            className="gap-2"
          >
            {upsert.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {originalStatus === "tracked" ? "Save changes" : "Mark completed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// `HeatmapRow` lives in its own file so the Dashboard can reuse it without
// pulling in this whole page. Re-exported under the same name for the
// existing `<HeatmapRow days={...} />` call site.
// (See `src/views/patient/components/workouts/HeatmapRow.tsx`.)

/**
 * TODAY tab card — one per scheduled / completed workout instance for today.
 * Hero thumb pulled from the workout-defs cache by workoutID; status badge
 * + per-state CTA label so the card is self-explanatory.
 */
function TodayWorkoutCard({
  workout,
  thumbnail,
  onOpen,
}: {
  workout: DailyWorkout;
  thumbnail: string | null;
  onOpen: () => void;
}) {
  const status = workout.status;
  const isTracked = status === "tracked" || status === "completed";
  const isCheckedIn = status === "checkedIn";
  const cta = isTracked
    ? "VIEW / EDIT"
    : isCheckedIn
      ? "RESUME"
      : "START WORKOUT";
  const badgeLabel = isTracked
    ? "Completed"
    : isCheckedIn
      ? "In progress"
      : "Scheduled";
  const badgeClass = isTracked
    ? "border-primary text-primary"
    : isCheckedIn
      ? "border-amber-500 text-amber-600"
      : "text-muted-foreground";
  return (
    <Card className="border-2 border-border overflow-hidden flex flex-col">
      {thumbnail && (
        <div className="w-full aspect-[16/9] bg-muted border-b border-border overflow-hidden">
          <img
            src={thumbnail}
            alt={workout.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold leading-tight">{workout.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {workout.exercises?.length ?? 0} exercises
              {workout.workoutDuration
                ? ` • ${Math.round(workout.workoutDuration / 60)} min`
                : ""}
              {typeof (workout.comments as { rpe?: number } | undefined)?.rpe ===
              "number"
                ? ` • RPE ${(workout.comments as { rpe?: number }).rpe}`
                : ""}
            </p>
          </div>
          <Badge variant="outline" className={badgeClass}>
            {badgeLabel}
          </Badge>
        </div>
        <Button
          onClick={onOpen}
          className={`w-full font-bold gap-2 mt-auto ${
            isTracked
              ? "bg-muted hover:bg-muted/80 text-foreground"
              : "bg-primary hover:bg-primary/80 text-primary-foreground"
          }`}
        >
          <Play className="w-4 h-4" />
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}

type StatField = "reps" | "weight" | "distance" | "time" | "calories";

/**
 * Which stat fields belong on a set row for a given recordType. Driven by
 * the doc's recordType → fields table (`daily-workouts-flows.md:351`).
 * Defaults to reps+weight when the recordType is missing/unknown so we
 * never strip inputs for an exercise the doc didn't enumerate.
 */
function statFieldsForRecordType(
  recordType: string | undefined,
): StatField[] {
  switch (recordType) {
    case "strength":
      return ["reps", "weight"];
    case "endurance":
      return ["reps"];
    case "cardio":
      return ["distance", "time", "calories"];
    case "timedFasterBetter":
    case "timedLongerBetter":
      return ["time"];
    default:
      return ["reps", "weight"];
  }
}

/**
 * Per-exercise field list — applies the recordType default and then strips
 * `weight` when the exercise name says "body weight" / "bodyweight" (the
 * trainerize library marks some of these as `recordType: "strength"` even
 * though no external load is involved).
 */
function statFieldsForExercise(ex: {
  recordType?: string;
  name?: string;
  def?: { name?: string };
}): StatField[] {
  let fields = statFieldsForRecordType(ex.recordType);
  const name = (ex.def?.name ?? ex.name ?? "").toLowerCase();
  const isBodyweight =
    name.includes("body weight") || name.includes("bodyweight");
  if (isBodyweight) {
    fields = fields.filter((f) => f !== "weight");
  }
  return fields;
}

function statFieldPlaceholder(
  field: StatField,
  unitWeight: string,
  unitDistance: string,
): string {
  switch (field) {
    case "reps":
      return "Reps";
    case "weight":
      return `Weight (${unitWeight})`;
    case "distance":
      return `Distance (${unitDistance})`;
    case "time":
      return "Time (s)";
    case "calories":
      return "Calories";
  }
}

function statFieldWidth(field: StatField): string {
  switch (field) {
    case "reps":
    case "time":
    case "calories":
      return "w-24";
    case "weight":
    case "distance":
      return "w-32";
  }
}

/**
 * Drill-down detail view for a single workout def. Replaces the workout grid
 * inside the Exercises section when the user picks a card. Shows the workout
 * hero + meta, the appropriate action (Start session if already scheduled,
 * otherwise Add to today), and the full exercise list with per-row "Watch
 * demo" hand-offs to the modal.
 */
function WorkoutDefDetailView({
  def,
  scheduled,
  isAdding,
  onBack,
  onAddToToday,
  onStartSession,
  onPlayVideo,
}: {
  def: WorkoutDef;
  scheduled: DailyWorkout | undefined;
  isAdding: boolean;
  onBack: () => void;
  onAddToToday: () => void;
  onStartSession: (dailyWorkout: DailyWorkout) => void;
  onPlayVideo: (exercise: WorkoutDefExercise) => void;
}) {
  const heroThumb = getWorkoutDefThumbnail(def);
  const exerciseCount = def.exercises?.length ?? 0;
  const status = scheduled?.status;

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to workouts
      </Button>

      <Card className="border-2 border-border overflow-hidden">
        {heroThumb && (
          <div className="w-full aspect-[16/9] bg-muted border-b border-border overflow-hidden">
            <img
              src={heroThumb}
              alt={def.name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground leading-tight">
                {def.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {exerciseCount} exercises
                {typeof def.duration === "number" && def.duration > 0
                  ? ` • Est. ${Math.round(def.duration / 60)} min`
                  : ""}
              </p>
            </div>
            {scheduled && (
              <Badge
                variant="outline"
                className={
                  status === "tracked"
                    ? "border-primary text-primary"
                    : status === "checkedIn"
                      ? "border-amber-500 text-amber-600"
                      : "border-primary text-primary"
                }
              >
                {status === "tracked"
                  ? "Tracked today"
                  : status === "checkedIn"
                    ? "Checked in"
                    : "Today"}
              </Badge>
            )}
          </div>

          {scheduled ? (
            <Button
              className="w-full gap-2 bg-primary hover:bg-primary/80 text-primary-foreground font-bold"
              onClick={() => onStartSession(scheduled)}
            >
              <Play className="w-4 h-4" />
              {status === "tracked"
                ? "View / edit session"
                : status === "checkedIn"
                  ? "Resume session"
                  : "Start session"}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onAddToToday}
              disabled={isAdding}
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
              {isAdding ? "Adding…" : "Add to today"}
            </Button>
          )}
        </CardContent>
      </Card>

      {exerciseCount > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Exercises
          </p>
          <div className="space-y-2 border-2 border-border rounded-md p-3 bg-card">
            {(def.exercises ?? []).map((ex, exIdx) => (
              <WorkoutDefExerciseRow
                key={`${ex.id ?? exIdx}-${exIdx}`}
                exercise={ex as WorkoutDefExercise}
                onPlayVideo={onPlayVideo}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyCard
          title="No exercises"
          body="This workout doesn't have any exercises yet."
        />
      )}
    </div>
  );
}

/**
 * Row inside the workout def detail view — surfaces what the workout-defs
 * response actually carries: per-exercise thumbnail, sets × target, superset
 * grouping (matching IDs share a group), and a "Watch demo" button that
 * opens the playback modal inline (vimeo MP4 or awss3 HLS via hls.js).
 */
function WorkoutDefExerciseRow({
  exercise,
  onPlayVideo,
}: {
  exercise: WorkoutDefExercise;
  onPlayVideo: (exercise: WorkoutDefExercise) => void;
}) {
  const thumb = getExerciseThumbnail(exercise);
  const source = getExerciseVideoSource(exercise);
  const target = formatExerciseTarget(exercise);
  const sets = exercise.sets ?? 0;
  const supersetID =
    typeof exercise.superSetID === "number" ? exercise.superSetID : null;
  const title = exercise.name ?? exercise.def?.name ?? "Exercise";
  return (
    <div className="flex items-start gap-3 text-sm">
      {thumb ? (
        <img
          src={thumb}
          alt={title}
          loading="lazy"
          className="w-14 h-14 rounded-sm object-cover border border-border flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-sm bg-muted border border-border flex-shrink-0 flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-foreground truncate">{title}</p>
          {supersetID !== null && (
            <Badge
              variant="outline"
              className="text-[10px] py-0 h-4 border-primary/40 text-primary"
              title={
                exercise.supersetType
                  ? `${exercise.supersetType} #${supersetID}`
                  : `Superset #${supersetID}`
              }
            >
              SS {supersetID}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {sets > 0 ? `${sets} × ${target}` : target}
          {exercise.recordType ? ` • ${exercise.recordType}` : ""}
          {typeof exercise.restTime === "number" && exercise.restTime > 0
            ? ` • Rest ${exercise.restTime}s`
            : ""}
        </p>
        {source && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayVideo(exercise);
            }}
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
          >
            <Video className="w-3 h-3" /> Watch demo
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Exercise detail modal — mirrors the Trainerize mobile exercise screen:
 *   - hero block at top, thumbnail by default, "FULL VIDEO" pill in the
 *     top-right that swaps the hero into the actual player on tap
 *   - title + (optional) description
 *   - "Personal Best To Beat" card (no PR API yet → empty state)
 *   - stats section (no per-exercise stats from the workout-defs response →
 *     empty state with the same copy as the mobile app)
 *
 * Player paths inside `ExerciseVideoPlayer`:
 *   - vimeo → iframe embed (signed progressive URLs won't play in `<video>`)
 *   - hls   → native `<video>` on Safari, lazy-loaded hls.js elsewhere
 *   - mp4   → native `<video src>`
 */
function ExerciseDetailDialog({
  exercise,
  onClose,
}: {
  exercise: WorkoutDefExercise;
  onClose: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const thumb = getExerciseThumbnail(exercise);
  const source = getExerciseVideoSource(exercise);
  const title = exercise.name ?? exercise.def?.name ?? "Exercise";
  const description = exercise.def?.description;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Hero */}
        <div className="relative bg-black aspect-video w-full">
          {isPlaying && source ? (
            <ExerciseVideoPlayer source={source} title={title} />
          ) : (
            <>
              {thumb ? (
                <img
                  src={thumb}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Dumbbell className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              {source && (
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  className="absolute top-3 right-3 bg-black/85 hover:bg-black text-white text-[11px] font-bold tracking-wide rounded-full pl-1.5 pr-3 py-1 flex items-center gap-1.5 shadow-md"
                >
                  <span className="bg-white text-black rounded-full w-5 h-5 flex items-center justify-center">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </span>
                  FULL VIDEO
                </button>
              )}
            </>
          )}
        </div>

        {/* Detail body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h2 className="text-xl font-bold text-foreground leading-tight">
              {title}
            </h2>
            {typeof description === "string" && description.trim() !== "" && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          <div className="bg-muted/60 rounded-md px-4 py-3">
            <p className="text-xs text-muted-foreground">Personal Best To Beat</p>
            <p className="font-bold text-foreground mt-0.5">No record set yet.</p>
          </div>

          <div>
            <p className="font-bold text-foreground">No stats to show yet.</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Start tracking your workouts so we can start recording your
              personal bests, and so you can try to beat them to improve.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Player surface for the detail modal hero. Picks the right code path
 * based on `source.kind` and falls back to an open-in-new-tab link if
 * playback fails (CORS, expired URL, unsupported codec, etc.).
 *
 * `muted` + `playsInline` keep autoplay alive — most browsers block
 * sound-on autoplay; users can unmute via the standard controls.
 */
function ExerciseVideoPlayer({
  source,
  title,
}: {
  source: ExerciseVideoSource;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (source.kind === "vimeo") return;
    const video = videoRef.current;
    if (!video) return;

    setLoadError(null);

    if (source.kind === "mp4") {
      video.src = source.url;
      const onErr = () =>
        setLoadError("Couldn't load the video — the source may have expired.");
      video.addEventListener("error", onErr);
      return () => video.removeEventListener("error", onErr);
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source.url;
      const onErr = () =>
        setLoadError(
          "Couldn't load the video stream. The source may be blocked by CORS.",
        );
      video.addEventListener("error", onErr);
      return () => video.removeEventListener("error", onErr);
    }

    let hlsInstance: { destroy: () => void } | null = null;
    let cancelled = false;
    import("hls.js")
      .then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setLoadError("Your browser can't play this video format.");
          return;
        }
        const hls = new Hls({ enableWorker: true });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setLoadError(
              `Couldn't fetch the video stream (${data.details}). The source likely doesn't allow cross-origin playback.`,
            );
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            setLoadError(
              `Video decoder error (${data.details}). Try refreshing the page.`,
            );
          } else {
            setLoadError(
              `Video playback failed (${data.type}: ${data.details}).`,
            );
          }
        });
        hls.loadSource(source.url);
        hls.attachMedia(video);
        hlsInstance = hls;
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load the video player.");
      });

    return () => {
      cancelled = true;
      if (hlsInstance) hlsInstance.destroy();
    };
  }, [source]);

  const directUrl =
    source.kind === "vimeo"
      ? `https://player.vimeo.com/video/${source.vimeoId}`
      : source.url;

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-sm text-muted-foreground p-6 text-center gap-3">
        <p>{loadError}</p>
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-xs"
        >
          Open the video in a new tab →
        </a>
      </div>
    );
  }

  if (source.kind === "vimeo") {
    const params = new URLSearchParams({
      autoplay: "1",
      muted: "1",
      loop: "1",
      title: "0",
      byline: "0",
      portrait: "0",
    });
    return (
      <iframe
        title={title}
        src={`https://player.vimeo.com/video/${source.vimeoId}?${params.toString()}`}
        className="w-full h-full"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        frameBorder={0}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      muted
      playsInline
      loop
      className="w-full h-full"
    />
  );
}

function ExerciseRow({
  index,
  exercise,
}: {
  index: number;
  exercise: DailyWorkoutExercise;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-card border-2 border-border rounded-sm hover:border-primary transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
          <span className="text-primary-foreground font-bold">{index + 1}</span>
        </div>
        <div>
          <h4 className="font-bold text-foreground">
            {exercise.def?.name ?? `Exercise ${index + 1}`}
          </h4>
          <p className="text-sm text-muted-foreground font-semibold">
            {exercise.sets ?? "?"} sets
            {exercise.targetDetail ? ` × ${exercise.targetDetail}` : ""}
            {exercise.restTime ? ` • Rest ${exercise.restTime}s` : ""}
          </p>
        </div>
      </div>
      <CheckCircle className="w-6 h-6 text-muted-foreground/40" />
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  suffix,
  usePrimary = false,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  suffix: string;
  usePrimary?: boolean;
}) {
  return (
    <Card className="border-2 border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`w-5 h-5 ${usePrimary ? "text-primary" : "text-foreground"}`} />
          <p className="text-xs text-muted-foreground font-bold uppercase">{label}</p>
        </div>
        <p className={`text-2xl font-bold ${usePrimary ? "text-primary" : "text-foreground"}`}>{value}</p>
        <p className="text-xs text-muted-foreground font-semibold">{suffix}</p>
      </CardContent>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card className="border-2 border-border">
      <CardContent className="py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </CardContent>
    </Card>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-2 border-border">
      <CardContent className="py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-sm flex items-center justify-center mx-auto mb-4">
          <Dumbbell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

/** Consecutive-days streak ending at today across tracked workouts. */
function computeStreak(workouts: DailyWorkout[]): number {
  const set = new Set(
    workouts
      .filter(
        (w) => (w.status === "tracked" || w.status === "completed") && w.date,
      )
      .map((w) => w.date as string),
  );
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (set.has(d)) streak += 1;
    else if (i === 0) continue; // allow today rest if you haven't done it yet
    else break;
  }
  return streak;
}

// ─── Unused but referenced imports kept for the AlertCircle slot below ─────
void AlertCircle;
