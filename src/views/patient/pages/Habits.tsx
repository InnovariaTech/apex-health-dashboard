// @ts-nocheck
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Plus,
  Flame,
  Trophy,
  Loader2,
  Check,
  Info,
  AlertCircle,
  Trash2,
  ListChecks,
  Sun,
  Droplet,
  Milk,
  Salad,
  Footprints,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { toast } from "@/components/ui/use-toast";
import TrainerizeGate from "@/components/trainerize/TrainerizeGate";
import {
  useCreateHabit,
  useDailyItem,
  useDeleteDailyItem,
  useHabits,
  useTrackDailyItem,
} from "@/hooks/trainerize/useHabits";
import { useTrainerizeCalendar } from "@/hooks/trainerize/useCalendar";
import {
  DAYS_OF_WEEK,
  HABIT_TYPE_LABELS,
  HABIT_TYPE_VALUES,
  type DayOfWeek,
  type HabitStatusFilter,
  type HabitType,
} from "@/types/trainerize/habits_types";
import { pickHabitEntries } from "@/types/trainerize/calendar_types";

/**
 * Habits page — restyled to the `apex-habits-portal` mockup.
 *
 * Every value on this page is derived from real Trainerize hooks:
 *   - `useHabits("current"|"upcoming"|"past")` → series list
 *   - `useTrainerizeCalendar(today, today)` → today's daily items
 *   - `useDailyItem` / `useTrackDailyItem` / `useDeleteDailyItem`
 *   - `useCreateHabit`
 *
 * Hero-band metrics are recomputed from those queries — no mock counts.
 */

const STATUS_TABS: { value: HabitStatusFilter; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

// ─── Per-habit theme + icon ──────────────────────────────────────────────

/**
 * Cycling palette used to tint each habit card. The demo picks a colour per
 * name; we pick deterministically from a hash of the habit id so a habit
 * keeps the same colour across renders + across the two lists.
 */
const HABIT_THEMES = [
  {
    key: "red",
    c: "#E11816",
    c2: "#ef2a27",
    tint: "rgba(225, 24, 22,.06)",
    badge: "rgba(225, 24, 22,.10)",
    sbg: "rgba(225, 24, 22,.04)",
  },
  {
    key: "blue",
    c: "#2563EB",
    c2: "#3b82f6",
    tint: "rgba(37,99,235,.07)",
    badge: "rgba(37,99,235,.11)",
    sbg: "rgba(37,99,235,.045)",
  },
  {
    key: "purple",
    c: "#7C3AED",
    c2: "#9061f0",
    tint: "rgba(124,58,237,.07)",
    badge: "rgba(124,58,237,.11)",
    sbg: "rgba(124,58,237,.045)",
  },
  {
    key: "slate",
    c: "#475569",
    c2: "#64748b",
    tint: "rgba(71,85,105,.06)",
    badge: "rgba(71,85,105,.10)",
    sbg: "rgba(71,85,105,.045)",
  },
  {
    key: "green",
    c: "#3E7C57",
    c2: "#4d9970",
    tint: "rgba(62,124,87,.07)",
    badge: "rgba(62,124,87,.11)",
    sbg: "rgba(62,124,87,.045)",
  },
] as const;

function themeForHabit(key: string | number | undefined | null) {
  const s = String(key ?? "");
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return HABIT_THEMES[hash % HABIT_THEMES.length]!;
}

/** Map a habit type to a lucide icon that reads well at ~22px. */
function iconForType(
  type: string | undefined | null,
  name: string | undefined | null,
) {
  const key = String(type ?? "").toLowerCase();
  const n = String(name ?? "").toLowerCase();
  if (key.includes("water") || n.includes("water") || n.includes("glass"))
    return Droplet;
  if (key.includes("sleep")) return Sun;
  if (
    key.includes("step") ||
    n.includes("run") ||
    n.includes("walk") ||
    n.includes("cardio")
  )
    return Footprints;
  if (n.includes("milk")) return Milk;
  if (
    key.includes("nutrition") ||
    key.includes("food") ||
    n.includes("salad") ||
    n.includes("veg") ||
    n.includes("yog")
  )
    return Salad;
  return ClipboardList;
}

// ─── Page ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Habits() {
  return (
    <TrainerizeGate>
      <HabitsInner />
    </TrainerizeGate>
  );
}

function HabitsInner() {
  const [status, setStatus] = useState<HabitStatusFilter>("current");
  const currentQuery = useHabits("current");
  const activeQuery = useHabits(status);
  const [showCreate, setShowCreate] = useState(false);
  const today = useMemo(() => todayISO(), []);

  const calendarQuery = useTrainerizeCalendar(today, today);
  const entries = calendarQuery.data ?? [];
  const habitEntries = useMemo(() => pickHabitEntries(entries), [entries]);

  // Hero stats — all real, derived from the two queries above.
  const currentSeries = currentQuery.data?.habits ?? [];
  const activeCount = currentQuery.data?.total ?? currentSeries.length;
  const todayCount = habitEntries.length;
  const todayCheckedIn = habitEntries.filter(
    (e: any) => e.status === "tracked",
  ).length;
  const longestStreak = currentSeries.reduce((max: number, h: any) => {
    const v = typeof h.longestStreak === "number" ? h.longestStreak : 0;
    return v > max ? v : max;
  }, 0);
  const totalCheckIns = currentSeries.reduce((sum: number, h: any) => {
    return sum + (typeof h.totalCompleted === "number" ? h.totalCompleted : 0);
  }, 0);

  const habits = activeQuery.data?.habits ?? [];
  const total = activeQuery.data?.total ?? 0;

  const headerDate = safeFormat(today, "EEE, MMM d") ?? today;

  return (
    <div className="p-4 md:p-9 max-w-[1480px] mx-auto bg-background text-foreground">
      {/* Page head */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="apex-ai-tag mb-3">
            <ListChecks className="w-3 h-3" strokeWidth={2.2} />
            Habits
          </div>
          <h1 className="apex-page-title">
            My <em>Habits</em>
          </h1>
          <p className="apex-page-sub">
            Check in on today&apos;s habits and watch your streaks build.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create habit
        </Button>
      </div>

      {/* Hero metric band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] mb-[26px]">
        <HeroStat
          icon={ListChecks}
          iconColor="#3E7C57"
          iconBg="rgba(62,124,87,.12)"
          tint="rgba(62,124,87,.10)"
          label="Active habits"
          value={String(activeCount)}
          note={
            activeCount === 0
              ? "No active habits yet"
              : todayCount === 0
                ? "None scheduled for today"
                : `${todayCount} scheduled for today`
          }
        />
        <HeroStat
          icon={Check}
          iconColor="#E11816"
          iconBg="rgba(225, 24, 22,.10)"
          tint="rgba(225, 24, 22,.08)"
          label="Checked in today"
          value={
            <>
              {todayCheckedIn}{" "}
              <small
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--muted-2, #9AA1AC)",
                  letterSpacing: 0,
                }}
              >
                / {Math.max(todayCount, todayCheckedIn)}
              </small>
            </>
          }
          note={
            todayCheckedIn === 0
              ? "Mark them complete below"
              : todayCheckedIn === todayCount
                ? "All today's habits complete"
                : "Keep going — a few more to go"
          }
        />
        <HeroStat
          icon={Trophy}
          iconColor="#7C3AED"
          iconBg="rgba(124,58,237,.11)"
          tint="rgba(124,58,237,.09)"
          label="Longest streak"
          value={
            <>
              {longestStreak}{" "}
              <small
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--muted-2, #9AA1AC)",
                  letterSpacing: 0,
                }}
              >
                {longestStreak === 1 ? "day" : "days"}
              </small>
            </>
          }
          note={longestStreakNote(currentSeries)}
        />
        <HeroStat
          icon={BarChartIcon}
          iconColor="#2563EB"
          iconBg="rgba(37,99,235,.11)"
          tint="rgba(37,99,235,.09)"
          label="Total check-ins"
          value={String(totalCheckIns)}
          note={
            activeCount === 0
              ? "Create a habit to start tracking"
              : `Across ${activeCount} habit${activeCount === 1 ? "" : "s"}`
          }
        />
      </div>

      {/* Today's check-ins */}
      <section className="mb-[26px]">
        <div className="flex items-center gap-3 mb-[18px]">
          <Sun className="w-[22px] h-[22px]" strokeWidth={1.8} />
          <h2 className="apex-section-title">Today&apos;s check-ins</h2>
          <span
            className="font-mono uppercase"
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "var(--ink-3, #6B7280)",
              background: "#fff",
              border: "1px solid var(--line, rgba(15,15,20,.085))",
              borderRadius: 100,
              padding: "4px 11px",
              fontWeight: 600,
            }}
          >
            {headerDate}
          </span>
        </div>

        {calendarQuery.isLoading ? (
          <LoadingRow />
        ) : calendarQuery.isError ? (
          <ErrorRow
            message={
              (calendarQuery.error as { message?: string } | undefined)?.message
            }
          />
        ) : habitEntries.length === 0 ? (
          <EmptyRow
            icon={Sun}
            title="No habits scheduled for today"
            body="Once you create a habit, its check-in card shows up here on scheduled days."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {habitEntries.map((entry: any) => (
              <TodayHabitCard
                key={entry.itemID}
                dailyItemId={entry.itemID}
                date={entry.date}
                calendarTitle={entry.title}
                calendarStatus={entry.status}
                calendarDetailType={entry.detail?.type}
              />
            ))}
          </div>
        )}
      </section>

      {/* Your habits — series tabs */}
      <section>
        <div className="flex items-center gap-3 mb-[18px]">
          <ListChecks className="w-[22px] h-[22px]" strokeWidth={1.8} />
          <h2 className="apex-section-title">Your habits</h2>
        </div>

        {/* Tab pills — mockup dark-pill treatment */}
        <div
          className="inline-flex mb-2"
          style={{
            background: "#f1f1ef",
            border: "1px solid rgba(15,15,20,.05)",
            borderRadius: 13,
            padding: 4,
            gap: 3,
          }}
        >
          {STATUS_TABS.map((t) => {
            const active = status === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setStatus(t.value)}
                type="button"
                style={{
                  border: "none",
                  background: active ? "#0B0B0C" : "transparent",
                  color: active ? "#fff" : "var(--ink-3, #6B7280)",
                  borderRadius: 10,
                  padding: "8px 22px",
                  fontSize: 13.5,
                  fontWeight: 600,
                  boxShadow: active ? "0 2px 6px rgba(0,0,0,.18)" : "none",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {!activeQuery.isLoading && !activeQuery.isError && habits.length > 0 && (
          <p
            className="mt-2 mb-[18px]"
            style={{
              fontSize: 13,
              color: "var(--ink-3, #6B7280)",
              fontWeight: 500,
            }}
          >
            {habits.length} of {total} habit{total === 1 ? "" : "s"}.
          </p>
        )}

        {activeQuery.isLoading ? (
          <LoadingRow />
        ) : activeQuery.isError ? (
          <ErrorRow
            message={
              (activeQuery.error as { message?: string } | undefined)?.message
            }
          />
        ) : habits.length === 0 ? (
          <EmptyRow
            icon={ListChecks}
            title={`No ${STATUS_TABS.find((t) => t.value === status)?.label.toLowerCase()} habits`}
            body={
              status === "current"
                ? "Create your first habit to start a streak."
                : `You don't have any ${STATUS_TABS.find((t) => t.value === status)?.label.toLowerCase()} habits.`
            }
            action={
              status === "current" && (
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Create habit
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {habits.map((h: any) => (
              <SeriesCard key={h.id} habit={h} />
            ))}
          </div>
        )}
      </section>

      {showCreate && <CreateHabitDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function longestStreakNote(series: any[]) {
  if (!series.length) return "No streaks yet";
  const max = series.reduce((m: number, h: any) => {
    const v = typeof h.longestStreak === "number" ? h.longestStreak : 0;
    return v > m ? v : m;
  }, 0);
  const holders = series
    .filter((h: any) => (h.longestStreak ?? 0) === max && max > 0)
    .map((h: any) => h.name)
    .filter(Boolean);
  if (!holders.length) return "Log check-ins to build a streak";
  return holders.slice(0, 3).join(" · ");
}

// ─── Hero stat ────────────────────────────────────────────────────────────

function HeroStat({
  icon: Icon,
  iconColor,
  iconBg,
  tint,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconColor: string;
  iconBg: string;
  tint: string;
  label: string;
  value: React.ReactNode;
  note: string;
}) {
  return (
    <div
      className="apex-card relative overflow-hidden"
      style={{ padding: "16px 18px" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(120% 90% at 100% 0%, ${tint}, transparent 60%)`,
        }}
      />
      <div className="relative z-[1] flex items-center gap-2.5 mb-[14px]">
        <div
          className="grid place-items-center flex-none"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: iconBg,
            color: iconColor,
          }}
        >
          <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
        </div>
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.06em",
            color: "var(--ink-3, #6B7280)",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <div
        className="relative z-[1] font-sans"
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        className="relative z-[1] mt-[7px]"
        style={{
          fontSize: 12,
          color: "var(--ink-3, #6B7280)",
        }}
      >
        {note}
      </div>
    </div>
  );
}

/** Small inline bar-chart icon so we don't pull an extra lucide export. */
function BarChartIcon({
  className,
  strokeWidth,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? 1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7" />
    </svg>
  );
}

// ─── Today's check-in card ────────────────────────────────────────────────

function TodayHabitCard({
  dailyItemId,
  date,
  calendarTitle,
  calendarStatus,
  calendarDetailType,
}: {
  dailyItemId: number;
  date: string;
  calendarTitle?: string;
  calendarStatus?: string;
  calendarDetailType?: string;
}) {
  const dailyItemQuery = useDailyItem(dailyItemId);
  const item = dailyItemQuery.data;
  const track = useTrackDailyItem();
  const remove = useDeleteDailyItem();

  const isPrivilegeBlocked = useMemo(() => {
    const err = dailyItemQuery.error as
      | { message?: string; trainerizeCode?: number }
      | undefined;
    if (!err) return false;
    if (err.trainerizeCode === 403) return true;
    return (err.message ?? "").toLowerCase().includes("privilege");
  }, [dailyItemQuery.error]);

  const isTracked = (item?.status ?? calendarStatus) === "tracked";
  const series = Array.isArray(item?.habit) ? item?.habit?.[0] : item?.habit;
  const habitName = calendarTitle ?? item?.name ?? series?.name ?? "Habit";
  const detailType = item?.type ?? series?.type ?? calendarDetailType;
  const habitTypeLabel =
    HABIT_TYPE_LABELS[detailType as HabitType] ?? detailType ?? "Custom habit";
  const currentStreak = series?.currentStreak;
  const longestStreak = series?.longestStreak;

  const theme = themeForHabit(series?.id ?? dailyItemId ?? habitName);
  const Icon = iconForType(detailType, habitName);

  const handleTrack = async () => {
    try {
      const result = await track.mutateAsync({
        dailyItemId,
        status: "tracked",
      });
      const streak = result?.currentStreak;
      const milestone =
        typeof result?.milestoneHabit === "number" && result.milestoneHabit > 0
          ? result.milestoneHabit
          : null;
      toast({
        title: milestone ? `Milestone — ${milestone}-day streak!` : "Tracked",
        description: streak
          ? `Streak now ${streak} day${streak === 1 ? "" : "s"}.${
              result?.nextMilestone
                ? ` Next milestone: ${result.nextMilestone}.`
                : ""
            }`
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
    if (!confirm("Remove today's check-in?")) return;
    try {
      await remove.mutateAsync({ dailyItemId });
      toast({ title: "Check-in removed" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Couldn't remove",
        description: err?.message ?? "Try again in a moment.",
      });
    }
  };

  return (
    <div
      className="apex-card relative overflow-hidden"
      style={{
        padding: 20,
        borderRadius: 20,
      }}
    >
      {/* Left accent stripe */}
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0"
        style={{ width: 4, background: theme.c, opacity: 0.85 }}
      />
      {/* Top-right radial tint */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(130% 80% at 100% 0%, ${theme.tint}, transparent 55%)`,
        }}
      />

      {/* Top row */}
      <div className="relative z-[1] flex items-start gap-[13px]">
        <div
          className="grid place-items-center flex-none"
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: theme.badge,
            color: theme.c,
          }}
        >
          <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="truncate"
            style={{
              fontSize: 16.5,
              fontWeight: 700,
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              margin: 0,
            }}
            title={habitName}
          >
            {habitName}
          </h3>
          <div
            className="mt-[2px]"
            style={{ fontSize: 12.5, color: "var(--ink-3, #6B7280)" }}
          >
            {habitTypeLabel}
          </div>
        </div>
        <StatusPill status={isTracked ? "tracked" : "scheduled"} />
      </div>

      {/* Streaks */}
      <div
        className="relative z-[1] grid grid-cols-2 gap-[10px]"
        style={{ marginTop: 16 }}
      >
        <StreakBox
          icon={Flame}
          label="Current streak"
          value={typeof currentStreak === "number" ? `${currentStreak}d` : "0d"}
          color={theme.c}
          background={theme.sbg}
          highlight
        />
        <StreakBox
          icon={Trophy}
          label="Longest"
          value={typeof longestStreak === "number" ? `${longestStreak}d` : "0d"}
          background={theme.sbg}
        />
      </div>

      {/* Errors */}
      {dailyItemQuery.isError && isPrivilegeBlocked && (
        <div
          className="relative z-[1] flex items-start gap-1.5"
          style={{
            marginTop: 14,
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(225, 24, 22,.3)",
            background: "rgba(225, 24, 22,.06)",
            color: "#E11816",
            fontSize: 11.5,
          }}
        >
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Habit tracking is blocked on your account (
            <code>403 No privilege</code>). Please contact support to enable
            habit privileges.
          </span>
        </div>
      )}

      {dailyItemQuery.isError && !isPrivilegeBlocked && (
        <div
          className="relative z-[1] flex items-start gap-1.5 mt-3"
          style={{ fontSize: 11.5, color: "#E11816" }}
        >
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Couldn&apos;t load this check-in.{" "}
            {(dailyItemQuery.error as { message?: string } | undefined)
              ?.message ?? ""}
          </span>
        </div>
      )}

      {/* Actions */}
      {!dailyItemQuery.isError && (
        <div
          className="relative z-[1] flex items-center gap-[10px]"
          style={{ marginTop: 16 }}
        >
          <button
            type="button"
            onClick={() => void handleTrack()}
            disabled={
              track.isPending || isTracked || dailyItemQuery.isLoading
            }
            className="flex-1 inline-flex items-center justify-center gap-2 transition-[filter,transform]"
            style={{
              background: isTracked
                ? "linear-gradient(180deg,#3E7C57,#2f6044)"
                : "linear-gradient(180deg,#E11816,#B70402)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: 13,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: isTracked
                ? "0 5px 14px rgba(47,96,68,.24), inset 0 1px 0 rgba(255,255,255,.16)"
                : "0 6px 16px rgba(183,4,2,.26), inset 0 1px 0 rgba(255,255,255,.2)",
              cursor:
                track.isPending || isTracked || dailyItemQuery.isLoading
                  ? "default"
                  : "pointer",
              opacity:
                (track.isPending || dailyItemQuery.isLoading) && !isTracked
                  ? 0.7
                  : 1,
            }}
          >
            {track.isPending ? (
              <Loader2 className="w-[17px] h-[17px] animate-spin" />
            ) : (
              <Check className="w-[17px] h-[17px]" strokeWidth={2} />
            )}
            <span>{isTracked ? "Checked in today" : "Mark today complete"}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleRemove()}
            disabled={remove.isPending || dailyItemQuery.isLoading}
            aria-label="Remove today's check-in"
            className="grid place-items-center flex-none transition-colors"
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              border: "1px solid var(--line, rgba(15,15,20,.085))",
              background: "#fff",
              cursor:
                remove.isPending || dailyItemQuery.isLoading
                  ? "default"
                  : "pointer",
            }}
          >
            {remove.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin text-ink-3" />
            ) : (
              <Trash2
                className="w-[18px] h-[18px]"
                strokeWidth={1.8}
                style={{ color: "#b0606a" }}
              />
            )}
          </button>
        </div>
      )}

      {/* Meta footer */}
      <div
        className="relative z-[1] flex flex-wrap items-center gap-2 font-mono"
        style={{
          marginTop: 15,
          paddingTop: 13,
          borderTop: "1px dashed var(--line, rgba(15,15,20,.085))",
          fontSize: 11,
          color: "var(--ink-3, #6B7280)",
        }}
      >
        <span>
          <b style={{ color: "#8a909a", fontWeight: 600 }}>dailyItemId</b>{" "}
          {dailyItemId}
        </span>
        <span>·</span>
        <span>{date}</span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "tracked" | "scheduled" }) {
  const isTracked = status === "tracked";
  return (
    <span
      className="inline-flex items-center gap-1.5 flex-none whitespace-nowrap font-mono uppercase"
      style={{
        fontSize: 10,
        letterSpacing: "0.08em",
        fontWeight: 600,
        padding: "5px 10px",
        borderRadius: 100,
        background: isTracked
          ? "rgba(62,124,87,.12)"
          : "rgba(180,83,9,.09)",
        color: isTracked ? "#2f6044" : "#9a5409",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 50,
          background: isTracked ? "#3E7C57" : "#C2740E",
        }}
      />
      {isTracked ? "Tracked" : "Scheduled"}
    </span>
  );
}

function StreakBox({
  icon: Icon,
  label,
  value,
  color,
  background,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  color?: string;
  background?: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(15,15,20,.05)",
        borderRadius: 13,
        padding: "11px 13px",
        background: background ?? "#fafafa",
      }}
    >
      <div
        className="font-mono uppercase flex items-center gap-1.5"
        style={{
          fontSize: 9.5,
          letterSpacing: "0.07em",
          color: highlight ? color : "var(--ink-3, #6B7280)",
          fontWeight: 600,
          marginBottom: 5,
        }}
      >
        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
        {label}
      </div>
      <div
        className="font-sans"
        style={{
          fontSize: 23,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: highlight ? color : "var(--ink, #0B0B0C)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Series card ──────────────────────────────────────────────────────────

function SeriesCard({ habit }: { habit: any }) {
  const theme = themeForHabit(habit.id ?? habit.name);
  const typeLabel =
    HABIT_TYPE_LABELS[habit.type as HabitType] ?? habit.type ?? "Custom habit";
  const repeat = (habit.repeatDetail?.dayOfWeeks ?? []) as string[];
  const done = typeof habit.totalCompleted === "number" ? habit.totalCompleted : 0;
  const total = typeof habit.totalItems === "number" ? habit.totalItems : 0;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : null;

  const Icon = iconForType(habit.type, habit.name);

  return (
    <div
      className="apex-card relative overflow-hidden"
      style={{ padding: 20, borderRadius: 20 }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0"
        style={{ width: 4, background: theme.c, opacity: 0.85 }}
      />
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(130% 80% at 100% 0%, ${theme.tint}, transparent 55%)`,
        }}
      />

      <div className="relative z-[1] flex items-start gap-[13px]">
        <div
          className="grid place-items-center flex-none"
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: theme.badge,
            color: theme.c,
          }}
        >
          <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="truncate"
            style={{
              fontSize: 16.5,
              fontWeight: 700,
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              margin: 0,
            }}
            title={habit.name || typeLabel}
          >
            {habit.name || typeLabel}
          </h3>
          <div
            className="mt-[2px]"
            style={{ fontSize: 12.5, color: "var(--ink-3, #6B7280)" }}
          >
            {typeLabel}
          </div>
        </div>
        {(habit.startDate || habit.endDate) && (
          <span
            className="font-mono flex-none whitespace-nowrap"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.04em",
              color: "var(--ink-3, #6B7280)",
              background: "#f6f6f5",
              border: "1px solid rgba(15,15,20,.05)",
              borderRadius: 100,
              padding: "5px 11px",
              fontWeight: 600,
            }}
          >
            {safeFormat(habit.startDate, "MMM d") ?? "—"}
            {habit.endDate
              ? ` → ${safeFormat(habit.endDate, "MMM d") ?? "—"}`
              : ""}
          </span>
        )}
      </div>

      {/* Streaks */}
      <div
        className="relative z-[1] grid grid-cols-2 gap-[10px]"
        style={{ marginTop: 16 }}
      >
        <StreakBox
          icon={Flame}
          label="Current streak"
          value={
            typeof habit.currentStreak === "number"
              ? `${habit.currentStreak}d`
              : "0d"
          }
          color={theme.c}
          background={theme.sbg}
          highlight
        />
        <StreakBox
          icon={Trophy}
          label="Longest"
          value={
            typeof habit.longestStreak === "number"
              ? `${habit.longestStreak}d`
              : "0d"
          }
          background={theme.sbg}
        />
      </div>

      {/* Progress bar */}
      {progressPct !== null && (
        <>
          <div
            className="relative z-[1] flex items-center justify-between"
            style={{ marginTop: 16, fontSize: 13 }}
          >
            <div style={{ color: "var(--ink-2, #1F2227)", fontWeight: 600 }}>
              {done}{" "}
              <span
                style={{ color: "var(--ink-3, #6B7280)", fontWeight: 500 }}
              >
                / {total} completed
              </span>
            </div>
            <div
              className="font-mono"
              style={{ fontWeight: 700, color: theme.c }}
            >
              {progressPct}%
            </div>
          </div>
          <div
            className="relative z-[1]"
            style={{
              height: 9,
              borderRadius: 100,
              background: "#eeefee",
              marginTop: 9,
              overflow: "hidden",
            }}
          >
            <span
              style={{
                display: "block",
                height: "100%",
                borderRadius: 100,
                width: `${Math.min(100, Math.max(2, progressPct))}%`,
                background: `linear-gradient(90deg, ${theme.c}, ${theme.c2})`,
              }}
            />
          </div>
        </>
      )}

      {/* Days chips */}
      {repeat.length > 0 && (
        <div
          className="relative z-[1] flex flex-wrap"
          style={{ marginTop: 15, gap: 7 }}
        >
          {repeat.map((d) => (
            <span
              key={d}
              className="font-mono uppercase"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#5a6068",
                background: "#f5f5f4",
                border: "1px solid rgba(15,15,20,.05)",
                borderRadius: 9,
                padding: "5px 11px",
                letterSpacing: "0.03em",
              }}
            >
              {String(d).slice(0, 3)}
            </span>
          ))}
        </div>
      )}

      {/* Info hint */}
      <div
        className="relative z-[1] flex items-start gap-2"
        style={{
          marginTop: 15,
          paddingTop: 13,
          borderTop: "1px solid rgba(15,15,20,.05)",
          fontSize: 12,
          color: "var(--ink-3, #6B7280)",
          lineHeight: 1.45,
        }}
      >
        <Info className="w-[15px] h-[15px] mt-[1px] flex-none" />
        <span>
          Check in from the &ldquo;Today&apos;s check-ins&rdquo; section above —
          series IDs can&apos;t be tracked directly.
        </span>
      </div>
    </div>
  );
}

// ─── Shared row states ────────────────────────────────────────────────────

function LoadingRow() {
  return (
    <div className="apex-card py-10 flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-ink-3" />
    </div>
  );
}

function ErrorRow({ message }: { message?: string }) {
  return (
    <div
      className="apex-card p-4 flex items-start gap-2"
      style={{
        borderColor: "rgba(225, 24, 22,.3)",
        background: "rgba(225, 24, 22,.06)",
        color: "#E11816",
        fontSize: 13,
      }}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>Couldn&apos;t load — {message ?? "try again in a moment."}</span>
    </div>
  );
}

function EmptyRow({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="apex-card text-center"
      style={{ padding: "42px 24px", borderStyle: "dashed" }}
    >
      <Icon
        className="w-10 h-10 mx-auto mb-3"
        strokeWidth={1.6}
        style={{ color: "var(--ink-3, #6B7280)", opacity: 0.5 }}
      />
      <p
        className="font-sans"
        style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "-0.015em",
          color: "var(--ink, #0B0B0C)",
          marginBottom: 6,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--ink-3, #6B7280)",
          maxWidth: 420,
          margin: "0 auto",
        }}
      >
        {body}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Create habit dialog ──────────────────────────────────────────────────

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
            Choose a habit type, schedule, and the days you want it scheduled
            on.
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
              <label className="apex-eyebrow mb-1.5 block">
                Duration (weeks)
              </label>
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
          <Button
            variant="outline"
            onClick={onClose}
            disabled={create.isPending}
          >
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

// ─── Utilities ────────────────────────────────────────────────────────────

function safeFormat(
  value: string | undefined | null,
  fmt: string,
): string | null {
  if (!value) return null;
  try {
    return format(parseISO(value), fmt);
  } catch {
    return value;
  }
}
