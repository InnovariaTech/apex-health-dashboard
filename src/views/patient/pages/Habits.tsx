// @ts-nocheck
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Sparkles,
  Plus,
  Flame,
  Trophy,
  Loader2,
  CheckCircle2,
  Info,
  AlertCircle,
  Trash2,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import TrainerizeGate from "@/components/trainerize/TrainerizeGate";
import {
  useCreateHabit,
  useDeleteDailyItem,
  useHabits,
  useTrackDailyItem,
} from "@/hooks/trainerize/useHabits";
import {
  DAYS_OF_WEEK,
  HABIT_TYPE_LABELS,
  HABIT_TYPE_VALUES,
  readTodayDailyItem,
  type DayOfWeek,
  type HabitStatusFilter,
  type HabitType,
} from "@/types/trainerize/habits_types";

/**
 * Trainerize habits — list / create / track.
 * See `docs/trainerize/habits-apis.md`.
 *
 * Doc gap (acknowledged in UI): the doc shows habit-level streak counters and
 * single-item GET/PUT/DELETE keyed by `dailyItemId`, but doesn't enumerate
 * how to discover today's `dailyItemId` from the habits list. We use the
 * `readTodayDailyItem` helper to look for any of the likely nested shapes
 * (`todayDailyItem`, `todayItem`, `dailyItems[]`). If none surface, the card
 * shows a "track in the Trainerize app" note instead of a broken button.
 */

const STATUS_TABS: { value: HabitStatusFilter; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

export default function Habits() {
  return (
    <TrainerizeGate>
      <HabitsInner />
    </TrainerizeGate>
  );
}

function HabitsInner() {
  const [status, setStatus] = useState<HabitStatusFilter>("current");
  const habitsQuery = useHabits(status);
  const habits = habitsQuery.data?.habits ?? [];
  const total = habitsQuery.data?.total ?? 0;
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6 pb-5 border-b-2 border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Habits</h1>
          <p className="text-sm text-muted-foreground">
            Track daily behaviours that move the needle — powered by Trainerize.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create habit
        </Button>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as HabitStatusFilter)} className="space-y-5">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {habitsQuery.isLoading ? (
              <Card>
                <CardContent className="py-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : habitsQuery.isError ? (
              <Card>
                <CardContent className="p-4 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Couldn't load habits.{" "}
                    {(habitsQuery.error as { message?: string } | undefined)?.message ?? ""}
                  </span>
                </CardContent>
              </Card>
            ) : habits.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <ListChecks className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-semibold mb-1">No {t.label.toLowerCase()} habits</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.value === "current"
                      ? "Create your first habit to start a streak."
                      : `You don't have any ${t.label.toLowerCase()} habits.`}
                  </p>
                  {t.value === "current" && (
                    <Button onClick={() => setShowCreate(true)} className="gap-2">
                      <Plus className="w-4 h-4" /> Create habit
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  {habits.length} of {total} habit{total === 1 ? "" : "s"}.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {habits.map((h) => (
                    <HabitCard key={h.id} habit={h} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {showCreate && <CreateHabitDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

// ─── Habit card ────────────────────────────────────────────────────────────

function HabitCard({ habit }: { habit: any }) {
  const trackable = readTodayDailyItem(habit);
  const isTracked = trackable?.status === "tracked";
  const track = useTrackDailyItem();
  const remove = useDeleteDailyItem();

  const typeLabel =
    HABIT_TYPE_LABELS[habit.type as HabitType] ?? habit.type ?? "Habit";
  const repeat = (habit.repeatDetail?.dayOfWeeks ?? []) as string[];
  const progressPct =
    typeof habit.totalItems === "number" && habit.totalItems > 0
      ? Math.round(((habit.totalCompleted ?? 0) / habit.totalItems) * 100)
      : null;

  const handleTrack = async () => {
    if (!trackable?.id) return;
    try {
      const result = await track.mutateAsync({
        dailyItemId: trackable.id,
        status: "tracked",
      });
      const streak = result?.currentStreak;
      toast({
        title: "Tracked",
        description: streak
          ? `Streak now ${streak} day${streak === 1 ? "" : "s"}.`
          : "Marked complete.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Couldn't track",
        description: err?.message ?? "Try again in a moment.",
      });
    }
  };

  const handleRemove = async () => {
    if (!trackable?.id) return;
    if (!confirm("Remove today's tracking entry?")) return;
    try {
      await remove.mutateAsync({ dailyItemId: trackable.id });
      toast({ title: "Daily item removed" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Couldn't remove",
        description: err?.message ?? "Try again in a moment.",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold leading-tight truncate">
              {habit.name || typeLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{typeLabel}</p>
          </div>
          {(habit.startDate || habit.endDate) && (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">
              {safeFormat(habit.startDate, "MMM d") ?? "—"}
              {habit.endDate ? ` → ${safeFormat(habit.endDate, "MMM d") ?? "—"}` : ""}
            </Badge>
          )}
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 gap-2">
          <StreakTile
            icon={Flame}
            label="Current streak"
            value={typeof habit.currentStreak === "number" ? `${habit.currentStreak}d` : "—"}
            tone="primary"
          />
          <StreakTile
            icon={Trophy}
            label="Longest"
            value={typeof habit.longestStreak === "number" ? `${habit.longestStreak}d` : "—"}
          />
        </div>

        {progressPct !== null && (
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>
                {habit.totalCompleted ?? 0} / {habit.totalItems} completed
              </span>
              <span className="font-mono">{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
          </div>
        )}

        {repeat.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {repeat.map((d) => (
              <Badge key={d} variant="secondary" className="text-[10px] capitalize">
                {String(d).slice(0, 3)}
              </Badge>
            ))}
          </div>
        )}

        {/* Tracking row */}
        {trackable?.id ? (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => void handleTrack()}
              disabled={track.isPending || isTracked}
              className="gap-1.5 flex-1"
            >
              {track.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isTracked ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {isTracked ? "Tracked today" : "Mark today complete"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void handleRemove()}
              disabled={remove.isPending}
              className="text-destructive"
              title="Remove today's item"
            >
              {remove.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground flex items-start gap-1.5 pt-1 border-t border-border/60 pt-2">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              No daily item surfaced for today — track from the Trainerize app
              and the streak will update here on refresh.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StreakTile({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  tone?: "primary" | "neutral";
}) {
  return (
    <div className="border border-border rounded-md p-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon
          className={`w-3.5 h-3.5 ${tone === "primary" ? "text-primary" : "text-muted-foreground"}`}
        />
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
          {label}
        </span>
      </div>
      <p
        className={`text-lg font-bold leading-none ${tone === "primary" ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Create habit dialog ───────────────────────────────────────────────────

function CreateHabitDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateHabit();
  const [type, setType] = useState<HabitType>("customHabit");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [days, setDays] = useState<DayOfWeek[]>([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]);
  const [error, setError] = useState("");

  const needsName = type === "customHabit";

  const toggleDay = (d: DayOfWeek) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  const handleCreate = async () => {
    setError("");
    if (needsName && !name.trim()) {
      setError("Custom habits need a name.");
      return;
    }
    if (days.length === 0) {
      setError("Pick at least one day of the week.");
      return;
    }
    try {
      await create.mutateAsync({
        type,
        ...(needsName ? { name: name.trim() } : {}),
        startDate,
        durationType: "week",
        duration: durationWeeks,
        repeatDetail: { dayOfWeeks: days },
      });
      toast({ title: "Habit created" });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't create the habit. Try again.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New habit</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose a habit type, schedule, and the days you want it scheduled on.
          </p>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="apex-eyebrow mb-1.5 block">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as HabitType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {HABIT_TYPE_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {HABIT_TYPE_LABELS[v]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsName && (
            <div>
              <label className="apex-eyebrow mb-1.5 block">Habit name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Drink 8 glasses of water"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="apex-eyebrow mb-1.5 block">Start date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="apex-eyebrow mb-1.5 block">Duration (weeks)</label>
              <Input
                type="number"
                min={1}
                value={durationWeeks}
                onChange={(e) =>
                  setDurationWeeks(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </div>
          </div>

          <div>
            <label className="apex-eyebrow mb-1.5 block">Repeats on</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((d) => {
                const active = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {d.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={create.isPending}
            className="gap-2"
          >
            {create.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Create habit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function safeFormat(value: string | undefined | null, fmt: string): string | null {
  if (!value) return null;
  try {
    return format(parseISO(value), fmt);
  } catch {
    return value;
  }
}
