// @ts-nocheck
import { useMemo, useState } from "react";
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

function extractIds(entries: CalendarEntry[] | undefined, key: "dailyWorkoutIds"): number[] {
  if (!entries) return [];
  const set = new Set<number>();
  for (const entry of entries) {
    const ids = entry[key];
    if (Array.isArray(ids)) {
      for (const id of ids) {
        if (typeof id === "number") set.add(id);
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
  const { isReady } = useTrainerizeUnits();

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
    () => extractIds(todaysEntries, "dailyWorkoutIds"),
    [todaysEntries],
  );
  const todayWorkoutsQuery = useDailyWorkouts(todayIds);
  const todayWorkout = todayWorkoutsQuery.data?.[0];

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
    () => extractIds(calendarQuery.data, "dailyWorkoutIds"),
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
  const [activePlanId, setActivePlanId] = useState<number | undefined>();
  const effectivePlanId = activePlanId ?? plans[0]?.id;
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

  // ── Start workout dialog ─────────────────────────────────────────────────
  const [logger, setLogger] = useState<DailyWorkout | null>(null);

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

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-5 bg-muted p-1">
          <TabsTrigger value="today" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Calendar className="w-4 h-4 mr-2" />TODAY
          </TabsTrigger>
          <TabsTrigger value="program" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Dumbbell className="w-4 h-4 mr-2" />PROGRAM
          </TabsTrigger>
          <TabsTrigger value="exercises" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <Library className="w-4 h-4 mr-2" />EXERCISES
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <TrendingUp className="w-4 h-4 mr-2" />HISTORY
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
            <BarChart2 className="w-4 h-4 mr-2" />STATS
          </TabsTrigger>
        </TabsList>

        {/* ── TODAY ─────────────────────────────────────────────────────── */}
        <TabsContent value="today" className="space-y-6">
          {!isReady || calendarQuery.isLoading || todayWorkoutsQuery.isLoading ? (
            <LoadingCard />
          ) : todayWorkout ? (
            <Card className="border-2 border-border shadow-lg bg-card">
              <CardHeader className="border-b-2 border-border bg-muted">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground mb-2">
                      {todayWorkout.name}
                    </CardTitle>
                    <p className="text-muted-foreground font-semibold">
                      {todayWorkout.exercises?.length ?? 0} exercises
                      {todayWorkout.workoutDuration
                        ? ` • Est. ${Math.round(todayWorkout.workoutDuration / 60)} min`
                        : ""}
                    </p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground border-none font-bold">
                    {format(new Date(), "EEEE")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {todayWorkout.exercises?.map((ex, idx) => (
                    <ExerciseRow key={ex.dailyExerciseID || idx} index={idx} exercise={ex} />
                  ))}
                </div>
                <Button
                  onClick={() => setLogger(todayWorkout)}
                  className="w-full mt-6 bg-primary hover:bg-primary/80 text-primary-foreground font-bold py-6 text-lg"
                >
                  <Play className="w-6 h-6 mr-2" />
                  {todayWorkout.status === "tracked"
                    ? "VIEW / EDIT"
                    : todayWorkout.status === "checkedIn"
                      ? "RESUME"
                      : "START WORKOUT"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmptyCard title="Rest Day" body="No workout scheduled for today. Focus on recovery!" />
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((p) => (
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
        </TabsContent>

        {/* ── EXERCISES (workout-defs of active plan) ───────────────────── */}
        <TabsContent value="exercises" className="space-y-4">
          {!effectivePlanId ? (
            <EmptyCard
              title="No Plan Selected"
              body="Select a plan in the Program tab to see its workouts."
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
                    return (
                      <Card
                        key={d.id}
                        className={`border-2 ${scheduled ? "border-primary/40 hover:border-primary cursor-pointer transition-colors" : "border-border"}`}
                        onClick={() => scheduled && setLogger(scheduled)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold">{d.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {d.exercises?.length ?? 0} exercises
                              </p>
                            </div>
                            {scheduled ? (
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
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground"
                              >
                                Not scheduled today
                              </Badge>
                            )}
                          </div>
                          {scheduled && (
                            <p className="text-[11px] text-muted-foreground mt-2">
                              Click to{" "}
                              {status === "tracked"
                                ? "view / edit"
                                : "start session"}
                              .
                            </p>
                          )}
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
        </TabsContent>

        {/* ── HISTORY ───────────────────────────────────────────────────── */}
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

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <TabsContent value="stats">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatTile icon={Flame} label="Completed (30d)" value={completed.length} suffix="workouts" usePrimary />
            <StatTile icon={Clock} label="Time (30d)" value={totalMinutes} suffix="minutes" />
            <StatTile
              icon={CheckCircle}
              label="Completion rate"
              value={
                historyIds.length
                  ? `${Math.round((completed.length / historyIds.length) * 100)}%`
                  : "0%"
              }
              suffix="of scheduled"
              usePrimary
            />
            <StatTile icon={TrendingUp} label="Streak" value={computeStreak(completed)} suffix="days" />
            <StatTile icon={Dumbbell} label="Plans" value={plans.length} suffix="assigned" />
            <StatTile icon={Library} label="Programs" value={programs.length} suffix="enrolled" />
          </div>
        </TabsContent>
      </Tabs>

      {logger && (
        <WorkoutLoggerDialog
          workout={logger}
          onClose={() => setLogger(null)}
        />
      )}
    </div>
  );
}

// ─── Workout logger dialog ─────────────────────────────────────────────────

interface WorkoutLoggerDialogProps {
  workout: DailyWorkout;
  onClose: () => void;
}

function WorkoutLoggerDialog({ workout, onClose }: WorkoutLoggerDialogProps) {
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
            Log your sets, then mark tracked. Weights in {unitWeight}.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {exercises.map((ex, exIdx) => (
            <Card key={ex.dailyExerciseID || exIdx} className="border-2 border-border">
              <CardContent className="p-4">
                <div className="flex items-baseline justify-between mb-3">
                  <p className="font-bold">{ex.def?.name ?? `Exercise ${exIdx + 1}`}</p>
                  {ex.targetDetail && (
                    <span className="text-xs text-muted-foreground font-mono">
                      Target {ex.targetDetail}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {(ex.stats ?? []).map((s, setIdx) => (
                    <div
                      key={s.setID || setIdx}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="w-12 font-mono text-xs text-muted-foreground">
                        SET {setIdx + 1}
                      </span>
                      <Input
                        type="number"
                        placeholder="Reps"
                        value={s.reps ?? ""}
                        onChange={(e) =>
                          updateStat(
                            exIdx,
                            setIdx,
                            "reps",
                            Number(e.target.value) || 0,
                          )
                        }
                        className="h-9 w-24"
                      />
                      <Input
                        type="number"
                        placeholder={`Weight (${unitWeight})`}
                        value={s.weight ?? ""}
                        onChange={(e) =>
                          updateStat(
                            exIdx,
                            setIdx,
                            "weight",
                            Number(e.target.value) || 0,
                          )
                        }
                        className="h-9 w-32"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
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
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleSave(originalStatus as any)}
            disabled={upsert.isPending}
            title="Save stats without changing status"
          >
            Save progress
          </Button>
          {originalStatus === "scheduled" && (
            <Button
              variant="outline"
              onClick={() => void handleSave("checkedIn")}
              disabled={upsert.isPending}
              title="Check in — start the session without tracking yet"
            >
              Check in
            </Button>
          )}
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
            {originalStatus === "tracked" ? "Save changes" : "Mark tracked"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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
