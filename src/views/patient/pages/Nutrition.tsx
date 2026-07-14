// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import {
  Apple,
  Loader2,
  AlertCircle,
  Info,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  ClipboardList,
  ExternalLink,
  FileText,
  Download,
  Calendar as CalendarIcon,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TrainerizeGate from "@/components/trainerize/TrainerizeGate";
import {
  useCustomFoods,
  useNutritionLogs,
} from "@/hooks/trainerize/useNutrition";
import { useMealPlan } from "@/hooks/trainerize/useMealPlan";
import {
  MEAL_PLAN_SLOT_LABELS,
  getMealCalories,
  getMealCarbs,
  getMealFat,
  getMealName,
  getMealProtein,
  getMealThumbnail,
  mealsForDay,
  type MealPlan,
  type MealPlanDay,
  type MealPlanMeal,
} from "@/types/trainerize/mealPlan_types";
import {
  CUSTOM_FOOD_SORT_LABELS,
  MEAL_NAME_LABELS,
  NUTRITION_SOURCE_LABELS,
  compliancePct,
  toLogsDateTime,
  type CustomFood,
  type CustomFoodSort,
  type NutritionLogEntry,
} from "@/types/trainerize/nutrition_types";
import DayDetailDialog from "@/views/patient/components/nutrition/DayDetailDialog";
import CustomFoodDialog from "@/views/patient/components/nutrition/CustomFoodDialog";
import DeleteCustomFoodDialog from "@/views/patient/components/nutrition/DeleteCustomFoodDialog";

/**
 * Nutrition — redesigned to mirror the `New Ui/5 Nutrition` mockup.
 *
 * Layout:
 *   1. Breadcrumb + display title "Nutrition *journal/plan*"
 *   2. Subhead with dot-separated counters + Export button
 *   3. Pill tab toggle — Journal | Plan
 *   4. Journal — sync banner, 3 stat tiles (top-bar accents), two SVG charts
 *      (calorie trend with goal line + macros stacked bars), day-row log
 *   5. Plan — plan card (eyebrow / title / 4-stat grid / note), day pills,
 *      meal grid with image cards
 *
 * Backend wiring is unchanged: `useNutritionLogs`, `useMealPlan`. Foods tab
 * (custom-food CRUD) is JSX-commented per design — code paths preserved.
 */

const RANGE_PRESETS = {
  "7d": { days: 7, label: "Last 7 days" },
  "30d": { days: 30, label: "Last 30 days" },
  "90d": { days: 90, label: "Last 90 days" },
} as const;

type RangeKey = keyof typeof RANGE_PRESETS;
type FoodFilter = "all" | "custom" | "system";
type TabKey = "journal" | "plan";
const PAGE_SIZE = 20;

const MOCKUP_BLUE = "#3b73e0";

export default function Nutrition() {
  return (
    <TrainerizeGate>
      <NutritionInner />
    </TrainerizeGate>
  );
}

function NutritionInner() {
  const [tab, setTab] = useState<TabKey>("journal");
  const [openDay, setOpenDay] = useState<{ nutritionId?: number; date?: string } | null>(null);

  // Subline data is derived inside JournalView from real API data — hoist
  // up via state so the page-level head can show counters from the response.
  const [journalSummary, setJournalSummary] = useState<JournalSummary | null>(
    null,
  );
  const planQuery = useMealPlan();

  return (
    <div className="p-4 md:p-9 max-w-[1320px] mx-auto bg-background text-foreground">
      {/* Breadcrumb */}
      <div
        className="mb-3"
        style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}
      >
        Apex Fit &nbsp;›&nbsp;{" "}
        <b style={{ color: "var(--ink-2)", fontWeight: 600 }}>Nutrition</b>
        &nbsp;›&nbsp;{" "}
        <span style={{ color: "var(--ink)" }}>
          {tab === "journal" ? "Journal" : "Plan"}
        </span>
      </div>

      {/* Page head — title + subline + export */}
      <div className="flex flex-wrap items-end justify-between gap-5 mb-6">
        <div className="min-w-0">
          <h1 className="apex-page-title">
            Nutrition <em>{tab === "journal" ? "journal" : "plan"}</em>
          </h1>
          <SubLine
            tab={tab}
            journal={journalSummary}
            plan={planQuery.data ?? null}
          />
        </div>
        {/* Export button hidden — no export endpoint wired yet.
        <div className="flex gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
              fontWeight: 600,
              fontSize: 14,
              padding: "11px 17px",
              borderRadius: 11,
              cursor: "pointer",
            }}
          >
            <Download className="w-4 h-4" strokeWidth={1.9} />
            Export
          </button>
        </div>
        */}
      </div>

      {/* Tab pill control */}
      <PillTabs value={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === "journal" ? (
          <JournalView
            onOpenDay={setOpenDay}
            onSummaryChange={setJournalSummary}
          />
        ) : (
          <PlanView />
        )}
      </div>

      {/* Foods tab hidden — preserved for revival.
      <FoodsTab />
      */}

      <DayDetailDialog
        nutritionId={openDay?.nutritionId}
        date={openDay?.date}
        onClose={() => setOpenDay(null)}
      />
    </div>
  );
}

interface JournalSummary {
  goal: number | null;
  daysLogged: number;
  windowDays: number;
  source: string | null;
}

// ─── Sub-line + Tabs ──────────────────────────────────────────────────────

function SubLine({
  tab,
  journal,
  plan,
}: {
  tab: TabKey;
  journal: JournalSummary | null;
  plan: MealPlan | null;
}) {
  const items: string[] = [];
  if (tab === "journal") {
    items.push("Daily intake & macro log");
    if (journal?.goal != null) {
      items.push(`Goal ${journal.goal.toLocaleString()} kcal/day`);
    }
    if (journal) {
      items.push(
        `${journal.daysLogged} of ${journal.windowDays} day${journal.windowDays === 1 ? "" : "s"} logged`,
      );
    }
    if (journal?.source) {
      items.push(`Synced from ${journal.source}`);
    }
  } else {
    items.push("Assigned meal plan");
    if (plan?.dietaryPreference) items.push(plan.dietaryPreference);
    if (plan?.mealsPerDay != null)
      items.push(`${plan.mealsPerDay} meals/day`);
    const days = plan?.sampleDays ?? plan?.mealPlanDays?.length;
    if (typeof days === "number") items.push(`${days} sample days`);
  }
  if (items.length === 0) return null;
  return (
    <div
      className="mt-3.5 flex items-center gap-3.5 flex-wrap"
      style={{ fontSize: 14.5, color: "var(--ink-2)", fontWeight: 500 }}
    >
      {items.map((label, i) => (
        <span key={`${label}-${i}`} className="flex items-center gap-3.5">
          {i > 0 && (
            <span
              className="inline-block rounded-full"
              style={{ width: 4, height: 4, background: "var(--ink-4)" }}
            />
          )}
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

function PillTabs({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
}) {
  return (
    <div
      className="inline-flex"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: 5,
        gap: 4,
        boxShadow: "0 1px 2px rgba(20,22,26,.04), 0 8px 24px -16px rgba(20,22,26,.18)",
      }}
    >
      <PillButton
        active={value === "journal"}
        onClick={() => onChange("journal")}
        icon={<Apple className="w-4 h-4" strokeWidth={1.9} />}
      >
        Journal
      </PillButton>
      <PillButton
        active={value === "plan"}
        onClick={() => onChange("plan")}
        icon={<ClipboardList className="w-4 h-4" strokeWidth={1.9} />}
      >
        Plan
      </PillButton>
    </div>
  );
}

function PillButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        padding: "10px 26px",
        borderRadius: 10,
        border: "none",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "#FFFFFF" : "var(--ink-2)",
        fontWeight: 600,
        fontSize: 14.5,
        cursor: "pointer",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ─── Journal view ─────────────────────────────────────────────────────────

function JournalView({
  onOpenDay,
  onSummaryChange,
}: {
  onOpenDay: (sel: { nutritionId?: number; date?: string }) => void;
  onSummaryChange: (summary: JournalSummary | null) => void;
}) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    return {
      startDate: toLogsDateTime(subDays(today, RANGE_PRESETS[rangeKey].days)),
      endDate: toLogsDateTime(today, true),
    };
  }, [rangeKey]);

  const { data, isLoading, isError, error } = useNutritionLogs(
    startDate,
    endDate,
  );
  const days = data?.nutrition ?? [];
  const total = data?.total ?? days.length;

  const stats = useMemo(() => {
    let totalKcal = 0;
    let counted = 0;
    let goal: number | null = null;
    let source: string | null = null;
    for (const d of days) {
      if (typeof d.calories === "number" && Number.isFinite(d.calories)) {
        totalKcal += d.calories;
        counted += 1;
      }
      if (typeof d.goal?.caloricGoal === "number") goal = d.goal.caloricGoal;
      if (d.source && !source) {
        source = NUTRITION_SOURCE_LABELS[d.source] ?? d.source;
      }
    }
    return {
      totalKcal,
      avgKcal: counted > 0 ? Math.round(totalKcal / counted) : null,
      daysLogged: counted,
      windowDays: RANGE_PRESETS[rangeKey].days,
      goal,
      source,
    };
  }, [days, rangeKey]);

  const sorted = useMemo(
    () => [...days].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [days],
  );

  const chartData = useMemo(() => {
    return [...days]
      .filter(
        (d) =>
          typeof d.calories === "number" ||
          typeof d.carbsGrams === "number" ||
          typeof d.proteinGrams === "number" ||
          typeof d.fatGrams === "number",
      )
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((d) => ({
        date: d.date,
        kcal: typeof d.calories === "number" ? d.calories : 0,
        carbs: typeof d.carbsGrams === "number" ? d.carbsGrams : 0,
        protein: typeof d.proteinGrams === "number" ? d.proteinGrams : 0,
        fat: typeof d.fatGrams === "number" ? d.fatGrams : 0,
        caloricGoal:
          typeof d.goal?.caloricGoal === "number" ? d.goal.caloricGoal : null,
      }));
  }, [days]);

  const caloricGoal = useMemo<number | null>(() => {
    for (let i = chartData.length - 1; i >= 0; i--) {
      const g = chartData[i]?.caloricGoal;
      if (typeof g === "number") return g;
    }
    return stats.goal;
  }, [chartData, stats.goal]);

  const avgDelta =
    stats.avgKcal != null && caloricGoal != null
      ? stats.avgKcal - caloricGoal
      : null;

  // Push real stats up so the page-level subhead reflects API data.
  useEffect(() => {
    onSummaryChange({
      goal: caloricGoal,
      daysLogged: stats.daysLogged,
      windowDays: stats.windowDays,
      source: stats.source,
    });
  }, [
    caloricGoal,
    stats.daysLogged,
    stats.windowDays,
    stats.source,
    onSummaryChange,
  ]);

  return (
    <div className="space-y-4">
      {/* Sync banner */}
      <div
        className="flex flex-wrap items-center justify-between gap-4"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 13,
          padding: "14px 18px",
          boxShadow:
            "0 1px 2px rgba(20,22,26,.04), 0 8px 24px -16px rgba(20,22,26,.18)",
        }}
      >
        <div
          className="flex items-center gap-2.5"
          style={{ color: "var(--ink-2)", fontSize: 14, fontWeight: 500 }}
        >
          <Info
            className="w-4 h-4 flex-shrink-0"
            strokeWidth={1.8}
            style={{ color: "var(--ink-4)" }}
          />
          <span>
            Log meals in the{" "}
            <b style={{ color: "var(--ink)", fontWeight: 700 }}>APEX FIT</b> app.
            Entries appear here automatically.
          </span>
        </div>
        <div
          className="flex items-center gap-2"
          style={{
            background: "var(--background)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "4px 6px 4px 13px",
            color: "var(--ink-2)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <CalendarIcon
            className="w-4 h-4"
            strokeWidth={1.9}
            style={{ color: "var(--ink-4)" }}
          />
          <Select
            value={rangeKey}
            onValueChange={(v) => setRangeKey(v as RangeKey)}
          >
            <SelectTrigger
              className="border-0 shadow-none focus:ring-0 h-8 px-1"
              style={{ background: "transparent", color: "var(--ink)" }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RANGE_PRESETS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatTile
          label="Total kcal"
          value={stats.totalKcal.toLocaleString()}
          accent="var(--ink)"
          note={`Across ${stats.daysLogged} logged day${stats.daysLogged === 1 ? "" : "s"}`}
          noteColor="var(--ink-2)"
        />
        <StatTile
          label="Avg / day"
          value={stats.avgKcal != null ? stats.avgKcal.toLocaleString() : "—"}
          accent="var(--bord)"
          note={
            stats.avgKcal == null
              ? "No logged days yet"
              : avgDelta == null
                ? "No goal set"
                : avgDelta > 0
                  ? `${avgDelta.toLocaleString()} over your goal`
                  : `${Math.abs(avgDelta).toLocaleString()} under your goal`
          }
          noteColor={avgDelta == null ? "var(--ink-2)" : "var(--bord)"}
        />
        <StatTile
          label="Days logged"
          value={stats.daysLogged.toString()}
          valueSmall={`/${stats.windowDays}`}
          accent="var(--opt)"
          note={`${stats.windowDays > 0 ? Math.round((stats.daysLogged / stats.windowDays) * 100) : 0}% of the window`}
          noteColor="var(--ink-2)"
        />
      </div>

      {/* Charts */}
      {!isLoading && !isError && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Calorie trend"
            icon={
              <TrendingUp
                className="w-[18px] h-[18px]"
                strokeWidth={2}
                style={{ color: "var(--apex-accent-bright)" }}
              />
            }
            chip={
              caloricGoal != null
                ? `Goal · ${caloricGoal.toLocaleString()} kcal`
                : undefined
            }
          >
            <CalorieTrendSvg data={chartData} goal={caloricGoal} />
          </ChartCard>
          <ChartCard
            title="Macros per day (g)"
            icon={
              <BarChart3
                className="w-[18px] h-[18px]"
                strokeWidth={2}
                style={{ color: "var(--apex-accent-bright)" }}
              />
            }
            chip="Carbs · Protein · Fat"
          >
            <MacroBarsSvg data={chartData} />
            <div className="flex justify-center gap-6 mt-1.5">
              <LegendDot color={MOCKUP_BLUE} label="Carbs" />
              <LegendDot color="var(--opt)" label="Protein" />
              <LegendDot color="var(--bord)" label="Fat" />
            </div>
          </ChartCard>
        </div>
      )}

      {/* Day log */}
      {isLoading ? (
        <LoadingCard />
      ) : isError ? (
        <ErrorCard error={error} label="Couldn't load nutrition" />
      ) : sorted.length === 0 ? (
        <EmptyCard
          icon={<Apple className="w-10 h-10 opacity-30" strokeWidth={1.5} />}
          title="No nutrition records in this range"
          body="Log meals from the Apex Fit app or sync MyFitnessPal / Fitbit."
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {sorted.map((d) => (
            <DayRow
              key={d.id}
              entry={d}
              goal={
                typeof d.goal?.caloricGoal === "number"
                  ? d.goal.caloricGoal
                  : caloricGoal
              }
              onOpen={() => onOpenDay({ nutritionId: d.id })}
            />
          ))}
          {total > sorted.length && (
            <p
              className="text-center pt-1"
              style={{ fontSize: 12, color: "var(--ink-3)" }}
            >
              Showing {sorted.length} of {total}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  valueSmall,
  accent,
  note,
  noteColor,
}: {
  label: string;
  value: string;
  valueSmall?: string;
  accent: string;
  note?: string;
  noteColor?: string;
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 15,
        padding: "22px 22px 20px",
        boxShadow:
          "0 1px 2px rgba(20,22,26,.04), 0 8px 24px -16px rgba(20,22,26,.18)",
      }}
    >
      <span
        className="absolute"
        style={{
          top: 0,
          left: 22,
          width: 46,
          height: 3,
          borderRadius: "0 0 3px 3px",
          background: accent,
        }}
      />
      <p
        className="uppercase"
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "1.2px",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontWeight: 800,
          fontSize: 43,
          letterSpacing: "-2px",
          margin: "8px 0 6px",
          lineHeight: 1,
          color: "var(--ink)",
        }}
      >
        {value}
        {valueSmall && (
          <small
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--ink-4)",
              letterSpacing: 0,
              marginLeft: 3,
            }}
          >
            {valueSmall}
          </small>
        )}
      </p>
      {note && (
        <p
          className="flex items-center gap-1.5"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: noteColor ?? "var(--ink-2)",
          }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// ─── Chart card frame ─────────────────────────────────────────────────────

function ChartCard({
  title,
  icon,
  chip,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  chip?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: "22px 24px 18px",
        boxShadow:
          "0 1px 2px rgba(20,22,26,.04), 0 8px 24px -16px rgba(20,22,26,.18)",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div
          className="flex items-center gap-2.5"
          style={{
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "-0.3px",
            color: "var(--ink)",
          }}
        >
          {icon}
          {title}
        </div>
        {chip && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-2)",
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: 20,
              padding: "5px 11px",
            }}
          >
            {chip}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="flex items-center gap-1.5"
      style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-2)" }}
    >
      <i
        style={{
          width: 11,
          height: 11,
          borderRadius: 3,
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

// ─── Calorie trend (smoothed line + goal dashed) ──────────────────────────

function CalorieTrendSvg({
  data,
  goal,
}: {
  data: Array<{ date: string; kcal: number }>;
  goal: number | null;
}) {
  if (!data.length) return null;
  const W = 720;
  const H = 330;
  const L = 58;
  const R = 694;
  const T = 24;
  const B = 288;

  const values = data.map((d) => d.kcal);
  const maxRaw = Math.max(goal != null ? goal * 1.2 : 0, ...values, 1);
  const maxY = niceTop(maxRaw);
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((maxY * i) / 4));

  const xs = (i: number) =>
    data.length <= 1 ? L + (R - L) / 2 : L + i * ((R - L) / (data.length - 1));
  const ys = (v: number) => B - (v / maxY) * (B - T);

  const pts = data.map((d, i) => [xs(i), ys(d.kcal)] as const);
  let pathD = `M ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[i + 1]!;
    const cx = (x0 + x1) / 2;
    pathD += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  const areaD = pts.length
    ? pathD + ` L ${pts[pts.length - 1]![0]} ${B} L ${pts[0]![0]} ${B} Z`
    : "";

  const goalY = goal != null ? ys(Math.min(goal, maxY)) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block mt-1">
      <defs>
        <linearGradient id="cal-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={MOCKUP_BLUE} stopOpacity={0.22} />
          <stop offset="1" stopColor={MOCKUP_BLUE} stopOpacity={0} />
        </linearGradient>
      </defs>

      {ticks.map((v, i) => {
        const y = ys(v);
        return (
          <g key={`tick-${i}`}>
            <line x1={L} y1={y} x2={R} y2={y} stroke="#eef0ec" />
            <text
              x={L - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#9aa1a9"
              fontFamily="Inter"
            >
              {v.toLocaleString()}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => (
        <text
          key={`xtick-${d.date}-${i}`}
          x={xs(i)}
          y={B + 22}
          textAnchor="middle"
          fontSize="12.5"
          fill="#9aa1a9"
          fontWeight={600}
          fontFamily="Inter"
        >
          {shortDateLabel(d.date)}
        </text>
      ))}

      {/* Goal dashed reference — drawn only when API supplies a goal */}
      {goalY != null && (
        <>
          <line
            x1={L}
            y1={goalY}
            x2={R}
            y2={goalY}
            stroke="#2f7d5b"
            strokeWidth={1.6}
            strokeDasharray="6 5"
            opacity={0.8}
          />
          <text
            x={R - 4}
            y={goalY - 8}
            textAnchor="end"
            fontSize="12"
            fill="#2f7d5b"
            fontWeight={700}
            fontFamily="Inter"
          >
            Goal
          </text>
        </>
      )}

      {areaD && <path d={areaD} fill="url(#cal-grad)" opacity={0.5} />}
      <path
        d={pathD}
        fill="none"
        stroke={MOCKUP_BLUE}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map(([px, py], i) => (
        <circle
          key={`pt-${i}`}
          cx={px}
          cy={py}
          r={5}
          fill={MOCKUP_BLUE}
          stroke="#fff"
          strokeWidth={2.5}
        />
      ))}
    </svg>
  );
}

// ─── Macros (stacked bars) ────────────────────────────────────────────────

function MacroBarsSvg({
  data,
}: {
  data: Array<{ date: string; carbs: number; protein: number; fat: number }>;
}) {
  if (!data.length) return null;
  const W = 720;
  const H = 330;
  const L = 58;
  const R = 694;
  const T = 24;
  const B = 288;

  const totals = data.map((d) => d.carbs + d.protein + d.fat);
  const maxRaw = Math.max(...totals, 1);
  const maxY = niceTop(maxRaw);
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((maxY * i) / 4));

  const bw = Math.min(58, ((R - L) / data.length) * 0.55);
  const band = (R - L) / data.length;

  const seg = (v: number) => (v / maxY) * (B - T);
  const ys = (v: number) => B - (v / maxY) * (B - T);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block mt-1">
      {ticks.map((v, i) => {
        const y = ys(v);
        return (
          <g key={`mt-${i}`}>
            <line x1={L} y1={y} x2={R} y2={y} stroke="#eef0ec" />
            <text
              x={L - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="12"
              fill="#9aa1a9"
              fontFamily="Inter"
            >
              {v}
            </text>
          </g>
        );
      })}

      {data.map((row, i) => {
        const cx = L + band * i + band / 2;
        const x = cx - bw / 2;
        let y = B;
        const stack: Array<[number, string]> = [
          [row.carbs, MOCKUP_BLUE],
          [row.protein, "#2f7d5b"],
          [row.fat, "#bd7c1c"],
        ];
        const rects: JSX.Element[] = [];
        stack.forEach(([v, color], k) => {
          const h = seg(v);
          if (h > 0) {
            y -= h;
            rects.push(
              <rect
                key={`r-${i}-${k}`}
                x={x}
                y={y}
                width={bw}
                height={h}
                fill={color}
                rx={2}
              />,
            );
          }
        });
        return (
          <g key={`row-${row.date}-${i}`}>
            {rects}
            <text
              x={cx}
              y={B + 22}
              textAnchor="middle"
              fontSize="12.5"
              fill="#9aa1a9"
              fontWeight={600}
              fontFamily="Inter"
            >
              {shortDateLabel(row.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function niceTop(v: number): number {
  if (v <= 100) return Math.ceil(v / 20) * 20;
  if (v <= 1000) return Math.ceil(v / 100) * 100;
  if (v <= 3000) return Math.ceil(v / 250) * 250;
  return Math.ceil(v / 500) * 500;
}

function shortDateLabel(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d");
  } catch {
    return iso;
  }
}

// ─── Day row ──────────────────────────────────────────────────────────────

function DayRow({
  entry,
  goal,
  onOpen,
}: {
  entry: NutritionLogEntry;
  goal: number | null;
  onOpen: () => void;
}) {
  const kcal = typeof entry.calories === "number" ? entry.calories : null;
  const hasGoal = typeof goal === "number" && goal > 0;
  const pct = hasGoal && kcal != null ? Math.round((kcal / goal) * 100) : null;
  const over = pct != null && pct > 100;
  const fillColor =
    kcal == null || kcal === 0
      ? "transparent"
      : over
        ? "var(--bord)"
        : "var(--apex-accent-bright)";
  const fillW = pct != null ? Math.min(pct, 100) : 0;

  const meals = entry.meals ?? [];
  const mealLabels = meals
    .map((m) => MEAL_NAME_LABELS[m.name ?? ""] ?? m.name)
    .filter(Boolean) as string[];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 15,
        padding: "22px 26px",
        boxShadow:
          "0 1px 2px rgba(20,22,26,.04), 0 8px 24px -16px rgba(20,22,26,.18)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p
            style={{
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-0.4px",
              color: "var(--ink)",
            }}
          >
            {safeFormat(entry.date)}
          </p>
          <p
            className="mt-1"
            style={{
              fontSize: 13.5,
              color: "var(--ink-3)",
              fontWeight: 500,
            }}
          >
            {macroLine(entry)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {entry.source && (
            <span
              className="inline-flex items-center gap-2"
              style={{
                border: "1px solid var(--line)",
                background: "var(--background)",
                borderRadius: 9,
                padding: "7px 12px",
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--ink-2)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--opt)",
                }}
              />
              {NUTRITION_SOURCE_LABELS[entry.source] ?? entry.source}
            </span>
          )}
        </div>
      </div>

      {hasGoal && pct != null && (
        <>
          <div
            className="flex items-center justify-between mb-2"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink-2)",
            }}
          >
            <span>
              {(kcal ?? 0).toLocaleString()} / {goal!.toLocaleString()} kcal
            </span>
            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>
              {pct}%
            </span>
          </div>
          <div
            style={{
              height: 7,
              borderRadius: 6,
              background: "var(--surface-2)",
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: `${fillW}%`,
                height: "100%",
                borderRadius: 6,
                background: fillColor,
                transition: "width .9s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
        </>
      )}

      {mealLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mealLabels.map((label, i) => (
            <span
              key={`${label}-${i}`}
              className="capitalize"
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: "var(--ink-2)",
                background: "var(--background)",
                border: "1px solid var(--line)",
                borderRadius: 20,
                padding: "5px 13px",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Plan view ────────────────────────────────────────────────────────────

function PlanView() {
  const { data, isLoading, isError, error } = useMealPlan();
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  if (isLoading) {
    return (
      <Card className="border border-border">
        <CardContent className="py-12 flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading meal plan…
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border border-border">
        <CardContent className="py-8 flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            {(error as { message?: string })?.message ?? "Couldn't load meal plan."}
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <EmptyCard
        icon={
          <ClipboardList
            className="w-10 h-10 opacity-30"
            strokeWidth={1.5}
          />
        }
        title="No meal plan assigned"
        body="Your coach hasn't assigned a plan yet. Your logged meals still appear in the Journal tab."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PlanCard plan={data} />
      <PlanContent
        plan={data}
        activeDayIdx={activeDayIdx}
        onActiveDayChange={setActiveDayIdx}
      />
    </div>
  );
}

function PlanCard({ plan }: { plan: MealPlan }) {
  const cals = plan.caloriesTarget ?? plan.caloricGoal;
  const macroSplit = plan.macroSplit ?? plan.dietaryPreference ?? "—";
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding: "26px 30px",
        boxShadow:
          "0 1px 2px rgba(20,22,26,.04), 0 8px 24px -16px rgba(20,22,26,.18)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-5 mb-6">
        <div className="min-w-0">
          <p
            className="uppercase"
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "1.4px",
              color: "var(--ink-3)",
            }}
          >
            Assigned meal plan
          </p>
          <p
            style={{
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: "-1px",
              margin: "8px 0 3px",
              color: "var(--ink)",
            }}
          >
            {plan.mealPlanName ?? "Untitled plan"}
          </p>
          <p
            style={{
              color: "var(--ink-3)",
              fontSize: 14.5,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {plan.dietaryPreference ?? macroSplit}
          </p>
        </div>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--ink)",
            border: "1px solid var(--line)",
            borderRadius: 20,
            padding: "7px 14px",
            background: "var(--background)",
            textTransform: "capitalize",
          }}
        >
          {plan.dietaryPreference ?? plan.macroSplit ?? "Plan"}
        </span>
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-5"
        style={{
          padding: "20px 0",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <PlanStat label="Daily calories" value={cals ? `~${cals.toLocaleString()} kcal` : "—"} />
        <PlanStat
          label="Macro split"
          value={macroSplit}
          capitalize
        />
        <PlanStat
          label="Meals / day"
          value={plan.mealsPerDay != null ? String(plan.mealsPerDay) : "—"}
        />
        <PlanStat
          label="Sample days"
          value={
            plan.sampleDays != null
              ? String(plan.sampleDays)
              : Array.isArray(plan.mealPlanDays)
                ? String(plan.mealPlanDays.length)
                : "—"
          }
        />
      </div>

      <div
        className="flex items-center gap-2.5 mt-5"
        style={{
          color: "var(--ink-2)",
          fontSize: 13.5,
          fontWeight: 500,
        }}
      >
        <Info
          className="w-4 h-4 flex-shrink-0"
          strokeWidth={1.8}
          style={{ color: "var(--ink-4)" }}
        />
        <span>
          On the web you can view recipes and swap meals you don't like — track
          and log meals in the{" "}
          <b style={{ color: "var(--ink)", fontWeight: 700 }}>APEX FIT</b> app.
        </span>
      </div>
    </div>
  );
}

function PlanStat({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: 13,
          color: "var(--ink-3)",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontWeight: 800,
          fontSize: 19,
          letterSpacing: "-0.4px",
          color: "var(--ink)",
          textTransform: capitalize ? "capitalize" : undefined,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function PlanContent({
  plan,
  activeDayIdx,
  onActiveDayChange,
}: {
  plan: MealPlan;
  activeDayIdx: number;
  onActiveDayChange: (n: number) => void;
}) {
  const type = plan.mealPlanType;

  if (type === "file") {
    const att = plan.attachment;
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 15,
          padding: "22px 26px",
          boxShadow:
            "0 1px 2px rgba(20,22,26,.04), 0 8px 24px -16px rgba(20,22,26,.18)",
        }}
      >
        <div className="flex items-start gap-3">
          <FileText
            className="w-6 h-6 flex-shrink-0 mt-0.5"
            style={{ color: "var(--apex-accent-bright)" }}
          />
          <div className="flex-1">
            <p style={{ fontWeight: 700, color: "var(--ink)", fontSize: 16 }}>
              {att?.filename ?? "Plan attachment"}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-3)",
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              {att?.mimeType ?? "PDF or document attached to this plan."}
            </p>
            {att?.url ? (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2.5"
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--apex-accent-bright)",
                }}
              >
                Open attachment <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <p
                className="mt-2.5"
                style={{ fontSize: 12.5, color: "var(--ink-3)" }}
              >
                Attachment URL not provided. Open the plan in the Apex Fit app.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === "en") {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 15,
          padding: "22px 26px",
          boxShadow:
            "0 1px 2px rgba(20,22,26,.04), 0 8px 24px -16px rgba(20,22,26,.18)",
        }}
      >
        <div className="flex items-start gap-3">
          <ExternalLink
            className="w-6 h-6 flex-shrink-0 mt-0.5"
            style={{ color: "var(--apex-accent-bright)" }}
          />
          <div>
            <p style={{ fontWeight: 700, color: "var(--ink)", fontSize: 16 }}>
              External meal plan
            </p>
            <p
              style={{
                fontSize: 14,
                color: "var(--ink-2)",
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              Hosted on Evolution Nutrition
              {plan.enMealPlanID ? ` (ref ${plan.enMealPlanID})` : ""}. Open it
              in the Apex Fit app for the full menu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const days = Array.isArray(plan.mealPlanDays) ? plan.mealPlanDays : [];
  if (days.length === 0) {
    return (
      <EmptyCard
        icon={<ClipboardList className="w-10 h-10 opacity-30" strokeWidth={1.5} />}
        title="No day templates yet"
        body="This plan doesn't have any day templates."
      />
    );
  }

  const safeIdx = Math.min(Math.max(0, activeDayIdx), days.length - 1);
  const activeDay = days[safeIdx] as MealPlanDay;
  const meals = mealsForDay(activeDay);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2.5">
        {days.map((d, i) => {
          const label =
            typeof d.day === "number" ? `Day ${d.day}` : `Day ${i + 1}`;
          const kcal =
            typeof d.caloriesSummary === "number"
              ? Math.round(d.caloriesSummary)
              : null;
          const isActive = i === safeIdx;
          return (
            <button
              key={`${label}-${i}`}
              type="button"
              onClick={() => onActiveDayChange(i)}
              className="transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                border: `1px solid ${isActive ? "var(--apex-accent-bright)" : "var(--ink)"}`,
                background: isActive ? "var(--apex-accent-bright)" : "var(--ink)",
                borderRadius: 12,
                padding: "10px 16px",
                fontWeight: 700,
                fontSize: 14.5,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {label}
              {kcal !== null && (
                <span
                  style={{
                    color: isActive
                      ? "rgba(255,255,255,.82)"
                      : "rgba(255,255,255,.65)",
                    fontWeight: 600,
                    marginLeft: 6,
                  }}
                >
                  · {kcal.toLocaleString()} kcal
                </span>
              )}
            </button>
          );
        })}
      </div>

      {meals.length === 0 ? (
        <EmptyCard
          icon={<ClipboardList className="w-10 h-10 opacity-30" strokeWidth={1.5} />}
          title="No meals scheduled for this day"
          body="Switch to another day to see your prescribed meals."
        />
      ) : (
        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(258px, 1fr))",
          }}
        >
          {meals.map(({ slot, meal }) => (
            <MealCard key={slot} slot={slot} meal={meal} />
          ))}
        </div>
      )}
    </div>
  );
}

function MealCard({
  slot,
  meal,
}: {
  slot: keyof typeof MEAL_PLAN_SLOT_LABELS;
  meal: MealPlanMeal;
}) {
  const thumb = getMealThumbnail(meal);
  const name = getMealName(meal);
  const cals = getMealCalories(meal);
  const isVideo = meal.media?.mediaType === "video";

  return (
    <div
      className="flex flex-col overflow-hidden transition-all"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 15,
        boxShadow:
          "0 1px 2px rgba(20,22,26,.04), 0 8px 24px -16px rgba(20,22,26,.18)",
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "271/105",
          background: "var(--surface-2)",
        }}
      >
        {thumb ? (
          <img
            src={thumb}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover block"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: "var(--ink-4)", fontSize: 12, fontWeight: 600 }}
          >
            No image
          </div>
        )}
        {isVideo && (
          <span
            className="absolute uppercase"
            style={{
              top: 10,
              right: 10,
              background: "rgba(21,24,29,.82)",
              color: "#fff",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "1px",
              padding: "4px 9px",
              borderRadius: 7,
            }}
          >
            Video
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1" style={{ padding: "16px 17px" }}>
        <p
          style={{
            fontWeight: 700,
            fontSize: 15.5,
            letterSpacing: "-0.2px",
            lineHeight: 1.3,
            minHeight: 40,
            color: "var(--ink)",
          }}
        >
          {name}
        </p>
        <div
          className="flex items-end justify-between gap-2.5 mt-auto"
          style={{
            paddingTop: 13,
            borderTop: "1px solid var(--line)",
          }}
        >
          <div>
            <p
              className="uppercase"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.6px",
                color: "var(--ink-3)",
              }}
            >
              {MEAL_PLAN_SLOT_LABELS[slot]}
            </p>
            <p
              className="mt-1"
              style={{
                fontSize: 13,
                color: "var(--ink-2)",
                fontWeight: 600,
              }}
            >
              {cals !== null
                ? `${Math.round(cals).toLocaleString()} cal / serving`
                : "—"}
            </p>
          </div>
          <button
            type="button"
            title="Swap meal"
            className="grid place-items-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              width: 36,
              height: 36,
              border: "1px solid var(--line)",
              borderRadius: 9,
              background: "var(--surface)",
              color: "var(--ink-2)",
              cursor: "not-allowed",
              opacity: 0.55,
            }}
            disabled
          >
            <ArrowLeftRight className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────

function EmptyCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div
      className="text-center"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 15,
        padding: "48px 28px",
        boxShadow:
          "0 1px 2px rgba(20,22,26,.04), 0 8px 24px -16px rgba(20,22,26,.18)",
      }}
    >
      <div className="flex justify-center mb-3" style={{ color: "var(--ink-3)" }}>
        {icon}
      </div>
      <p style={{ fontWeight: 700, color: "var(--ink)", fontSize: 16 }}>
        {title}
      </p>
      <p
        className="mt-1"
        style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 500 }}
      >
        {body}
      </p>
    </div>
  );
}

function LoadingCard() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 15,
        padding: "48px 28px",
      }}
    >
      <Loader2
        className="w-7 h-7 animate-spin"
        style={{ color: "var(--ink-3)" }}
      />
    </div>
  );
}

function ErrorCard({ error, label }: { error: unknown; label: string }) {
  return (
    <div
      className="flex items-start gap-3"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 15,
        padding: "22px 26px",
        color: "var(--apex-accent-bright)",
      }}
    >
      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div>
        <p style={{ fontWeight: 700, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 13.5 }}>
          {(error as { message?: string } | undefined)?.message ??
            "Please try again shortly."}
        </p>
      </div>
    </div>
  );
}

function safeFormat(date: string): string {
  try {
    return format(parseISO(date), "EEEE, MMM d, yyyy");
  } catch {
    return date;
  }
}

function macroLine(d: NutritionLogEntry): string {
  const parts: string[] = [];
  if (typeof d.calories === "number") parts.push(`${fmtNum(d.calories)} kcal`);
  if (typeof d.carbsGrams === "number") parts.push(`C ${fmtNum(d.carbsGrams)}g`);
  if (typeof d.proteinGrams === "number") parts.push(`P ${fmtNum(d.proteinGrams)}g`);
  if (typeof d.fatGrams === "number") parts.push(`F ${fmtNum(d.fatGrams)}g`);
  return parts.join(" · ") || "—";
}

function fmtNum(n: number | undefined | null): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: n < 10 ? 1 : 0,
  });
}

// ─── Foods tab — hidden per design, preserved for revival ─────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FoodsTab() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<CustomFoodSort>("lastModified");
  const [filter, setFilter] = useState<FoodFilter>("custom");
  const [start, setStart] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFood | null>(null);
  const [deleting, setDeleting] = useState<CustomFood | null>(null);

  const { data, isLoading, isError, error } = useCustomFoods(
    searchTerm,
    sort,
    start,
    PAGE_SIZE,
  );
  const allFoods = data?.foods ?? [];
  const total = data?.total ?? 0;
  const filtered =
    filter === "all" ? allFoods : allFoods.filter((f) => f.type === filter);

  const hasPrev = start > 0;
  const hasNext = start + PAGE_SIZE < total;

  const submitSearch = () => {
    setStart(0);
    setSearchTerm(searchInput.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Custom foods</h2>
          <p className="text-sm text-muted-foreground">
            Your custom food library. System foods are read-only.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add food
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 border border-border rounded-sm px-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            placeholder="Search foods…"
            className="border-0 focus-visible:ring-0"
          />
          {(searchTerm || searchInput) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchInput("");
                setSearchTerm("");
                setStart(0);
              }}
            >
              Clear
            </Button>
          )}
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as CustomFoodSort)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CUSTOM_FOOD_SORT_LABELS) as CustomFoodSort[]).map(
              (k) => (
                <SelectItem key={k} value={k}>
                  {CUSTOM_FOOD_SORT_LABELS[k]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        {(["all", "custom", "system"] as FoodFilter[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f === "custom" ? "Custom" : "System"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <LoadingCard />
      ) : isError ? (
        <ErrorCard error={error} label="Couldn't load foods" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Info className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-semibold mb-1">No foods to show</p>
            <p className="text-sm text-muted-foreground">
              {filter === "custom"
                ? "Add a custom food to get started."
                : "Try a different filter or search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((f) => (
            <FoodCard
              key={f.foodId}
              food={f}
              onEdit={() => setEditing(f)}
              onDelete={() => setDeleting(f)}
            />
          ))}
        </div>
      )}

      {(hasPrev || hasNext) && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total}
            {filter !== "all" && ` (filtered to ${filter})`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => setStart(Math.max(0, start - PAGE_SIZE))}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => setStart(start + PAGE_SIZE)}
              className="gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <CustomFoodDialog
        open={addOpen}
        mode="create"
        onClose={() => setAddOpen(false)}
      />
      <CustomFoodDialog
        open={editing != null}
        mode="edit"
        food={editing}
        onClose={() => setEditing(null)}
      />
      <DeleteCustomFoodDialog
        food={deleting}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function FoodCard({
  food,
  onEdit,
  onDelete,
}: {
  food: CustomFood;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isCustom = food.type === "custom";
  const s = food.sampleServing;

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold break-words">
              {food.name ?? `Food #${food.foodId}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {s?.name ? `${s.name}` : "—"}
              {typeof s?.weight === "number" ? ` • ${s.weight} g` : ""}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              isCustom
                ? "border-primary/40 text-primary"
                : "text-muted-foreground"
            }
          >
            {food.type}
          </Badge>
        </div>

        {s && (
          <div className="grid grid-cols-4 gap-2 text-xs">
            <MacroTile label="kcal" value={s.calories} />
            <MacroTile label="C" value={s.carbs} unit="g" />
            <MacroTile label="P" value={s.proteins} unit="g" />
            <MacroTile label="F" value={s.fat} unit="g" />
          </div>
        )}

        <div className="flex justify-end items-center gap-1">
          {isCustom ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="gap-1"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                title="Delete food"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              System food — read-only
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MacroTile({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit?: string;
}) {
  return (
    <div className="border border-border rounded-sm p-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">
        {typeof value === "number" ? fmtNum(value) : "—"}
        {unit && typeof value === "number" && (
          <span className="text-[10px] text-muted-foreground"> {unit}</span>
        )}
      </p>
    </div>
  );
}
