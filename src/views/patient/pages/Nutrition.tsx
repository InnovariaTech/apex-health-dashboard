// @ts-nocheck
import { useMemo, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import {
  Apple,
  Loader2,
  AlertCircle,
  Camera,
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
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
 * Nutrition page — Journal (read-only) + custom foods CRUD.
 *
 * Held — surfaced as UI copy, no FE write paths:
 *   §1  No documented endpoint to add/edit/delete meals or foods on a date.
 *   §11 DELETE cascade unverified.
 */

const RANGE_PRESETS = {
  "7d": { days: 7, label: "Last 7 days" },
  "30d": { days: 30, label: "Last 30 days" },
  "90d": { days: 90, label: "Last 90 days" },
} as const;

type RangeKey = keyof typeof RANGE_PRESETS;
type FoodFilter = "all" | "custom" | "system";
const PAGE_SIZE = 20;

export default function Nutrition() {
  return (
    <TrainerizeGate>
      <NutritionInner />
    </TrainerizeGate>
  );
}

function NutritionInner() {
  const [openDay, setOpenDay] = useState<{ nutritionId?: number; date?: string } | null>(null);

  // Eagerly trigger `GET /me/meal-plan` as soon as the user lands on the
  // Nutrition page — the actual consumer is `PlanTab`, but a parent-level
  // call kicks the request off without forcing the user to switch sub-tabs
  // first. TanStack Query dedupes by key, so this + the call inside
  // `PlanTab` share a single network request.
  useMealPlan();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Nutrition</h1>
        <p className="text-muted-foreground">
          Daily intake & custom food library.
        </p>
      </header>

      <Tabs defaultValue="journal" className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <Apple className="w-4 h-4" /> Journal
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> Plan
          </TabsTrigger>
          <TabsTrigger value="foods" className="flex items-center gap-2">
            <Info className="w-4 h-4" /> Foods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal">
          <JournalTab onOpenDay={setOpenDay} />
        </TabsContent>

        <TabsContent value="plan">
          <PlanTab />
        </TabsContent>

        <TabsContent value="foods">
          <FoodsTab />
        </TabsContent>
      </Tabs>

      <DayDetailDialog
        nutritionId={openDay?.nutritionId}
        date={openDay?.date}
        onClose={() => setOpenDay(null)}
      />
    </div>
  );
}

// ─── Journal tab ──────────────────────────────────────────────────────────

function JournalTab({
  onOpenDay,
}: {
  onOpenDay: (sel: { nutritionId?: number; date?: string }) => void;
}) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    return {
      startDate: toLogsDateTime(subDays(today, RANGE_PRESETS[rangeKey].days)),
      endDate: toLogsDateTime(today, true),
    };
  }, [rangeKey]);

  const { data, isLoading, isError, error } = useNutritionLogs(startDate, endDate);
  const days = data?.nutrition ?? [];
  const total = data?.total ?? days.length;

  const stats = useMemo(() => {
    let totalKcal = 0;
    let counted = 0;
    for (const d of days) {
      if (typeof d.calories === "number" && Number.isFinite(d.calories)) {
        totalKcal += d.calories;
        counted += 1;
      }
    }
    return {
      totalKcal,
      avgKcal: counted > 0 ? Math.round(totalKcal / counted) : null,
      daysLogged: counted,
      windowDays: RANGE_PRESETS[rangeKey].days,
    };
  }, [days, rangeKey]);

  const sorted = useMemo(
    () => [...days].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [days],
  );

  // Chart data: chronological order (oldest → newest), only days with calories
  // or macros logged. Goal line uses the most recent non-null goal target so a
  // mid-range goal change shows the *current* target — the per-day goal still
  // lives on each entry for compliance computations.
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
        kcal: typeof d.calories === "number" ? d.calories : null,
        carbs: typeof d.carbsGrams === "number" ? d.carbsGrams : 0,
        protein: typeof d.proteinGrams === "number" ? d.proteinGrams : 0,
        fat: typeof d.fatGrams === "number" ? d.fatGrams : 0,
        caloricGoal:
          typeof d.goal?.caloricGoal === "number" ? d.goal.caloricGoal : null,
      }));
  }, [days]);

  const caloricGoal = useMemo(() => {
    for (let i = chartData.length - 1; i >= 0; i--) {
      const g = chartData[i]?.caloricGoal;
      if (typeof g === "number") return g;
    }
    return null;
  }, [chartData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground border border-border rounded-sm p-3 flex-1">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Log meals from your trainer's app, MyFitnessPal, or Fitbit.
            Entries sync here automatically.
          </span>
        </div>
        <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as RangeKey)}>
          <SelectTrigger className="w-[180px]">
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatTile label="Total kcal" value={stats.totalKcal.toLocaleString()} />
        <StatTile
          label="Avg / day"
          value={stats.avgKcal != null ? stats.avgKcal.toLocaleString() : "—"}
        />
        <StatTile
          label="Days logged"
          value={`${stats.daysLogged} / ${stats.windowDays}`}
        />
      </div>

      {!isLoading && !isError && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CalorieTrendChart data={chartData} caloricGoal={caloricGoal} />
          <MacroBreakdownChart data={chartData} />
        </div>
      )}

      {isLoading ? (
        <LoadingCard />
      ) : isError ? (
        <ErrorCard error={error} label="Couldn't load nutrition" />
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Apple className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-semibold mb-1">No nutrition records in this range</p>
            <p className="text-sm text-muted-foreground">
              Log meals from your trainer's app or sync MyFitnessPal / Fitbit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((d) => (
            <DayRow
              key={d.id}
              entry={d}
              onOpen={() => onOpenDay({ nutritionId: d.id })}
            />
          ))}
          {total > sorted.length && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              Showing {sorted.length} of {total}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Plan tab (`GET /me/meal-plan`) ──────────────────────────────────────
//
// Surfaces the prescribed meal plan returned by Trainerize. The doc enumerates
// fields (`mealPlanName`, `mealPlanType`, `caloriesTarget`, `macroSplit`,
// `mealsPerDay`, `mealPlanDays[]`) but doesn't pin down every nested field on
// a meal object — `MealCard` renders defensively (only shows what's present).
//
// Three render branches by `mealPlanType`:
//   - `planner`         → day selector + meal cards from `mealPlanDays[]`
//   - `file`            → download link to the PDF attachment
//   - `en`              → external Evolution Nutrition reference
//   - missing / unknown → "No plan assigned" empty state

function PlanTab() {
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
          <span>{(error as { message?: string })?.message ?? "Couldn't load meal plan."}</span>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border border-border">
        <CardContent className="py-12 text-center space-y-2">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-semibold">No meal plan assigned</p>
          <p className="text-sm text-muted-foreground">
            Your coach hasn't assigned a plan yet. Your logged meals still
            appear in the Journal tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PlanHeader plan={data} />
      <PlanContent
        plan={data}
        activeDayIdx={activeDayIdx}
        onActiveDayChange={setActiveDayIdx}
      />
    </div>
  );
}

function PlanHeader({ plan }: { plan: MealPlan }) {
  const type = plan.mealPlanType;
  const typeLabel =
    type === "planner"
      ? "Planner"
      : type === "file"
        ? "PDF"
        : type === "en"
          ? "Evolution Nutrition"
          : type === "flexiblemealplan"
            ? "Flexible Plan"
            : type
              ? String(type)
              : "Plan";
  const cals = plan.caloriesTarget ?? plan.caloricGoal;
  return (
    <Card className="border-2 border-border">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Assigned meal plan
            </p>
            <p className="text-xl font-bold text-foreground mt-0.5">
              {plan.mealPlanName ?? "Untitled plan"}
            </p>
            {plan.dietaryPreference && (
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {plan.dietaryPreference}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {typeLabel}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Daily calories</p>
            <p className="font-semibold">{cals ? `${cals} kcal` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Macro split</p>
            <p className="font-semibold capitalize">
              {plan.macroSplit ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Meals / day</p>
            <p className="font-semibold">{plan.mealsPerDay ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sample days</p>
            <p className="font-semibold">
              {plan.sampleDays ?? plan.mealPlanDays?.length ?? "—"}
            </p>
          </div>
        </div>
        {Array.isArray(plan.excludes) && plan.excludes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Excludes:</span>
            {plan.excludes.map((x) => (
              <Badge key={String(x)} variant="outline" className="text-[10px] capitalize">
                {String(x)}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
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
      <Card className="border border-border">
        <CardContent className="p-5 flex items-start gap-3">
          <FileText className="w-6 h-6 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{att?.filename ?? "Plan attachment"}</p>
            <p className="text-xs text-muted-foreground">
              {att?.mimeType ?? "PDF or document attached to this plan."}
            </p>
            {att?.url ? (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                Open attachment <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                Attachment URL not provided. Open the plan in your trainer's app.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === "en") {
    return (
      <Card className="border border-border">
        <CardContent className="p-5 flex items-start gap-3">
          <ExternalLink className="w-6 h-6 text-primary mt-0.5" />
          <div>
            <p className="font-semibold">External meal plan</p>
            <p className="text-sm text-muted-foreground">
              Hosted on Evolution Nutrition
              {plan.enMealPlanID ? ` (ref ${plan.enMealPlanID})` : ""}. Open it
              in your trainer's app for the full menu.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default `planner` branch (and fallback for unknown types if mealPlanDays
  // happen to be present — render what we can).
  const days = Array.isArray(plan.mealPlanDays) ? plan.mealPlanDays : [];

  if (days.length === 0) {
    return (
      <Card className="border border-border">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          This plan doesn't have any day templates yet.
        </CardContent>
      </Card>
    );
  }

  const safeIdx = Math.min(Math.max(0, activeDayIdx), days.length - 1);
  const activeDay = days[safeIdx] as MealPlanDay;
  const meals = mealsForDay(activeDay);

  return (
    <div className="space-y-4">
      {days.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {days.map((d, i) => {
            const label =
              typeof d.day === "number" ? `Day ${d.day}` : `Day ${i + 1}`;
            const kcal =
              typeof d.caloriesSummary === "number"
                ? Math.round(d.caloriesSummary)
                : null;
            return (
              <Button
                key={`${label}-${i}`}
                size="sm"
                variant={i === safeIdx ? "default" : "outline"}
                onClick={() => onActiveDayChange(i)}
                className="text-xs gap-1.5"
              >
                {label}
                {kcal !== null && (
                  <span className="text-[10px] opacity-70">
                    · {kcal} kcal
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}

      {meals.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No meals for this day.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
  const protein = getMealProtein(meal);
  const carbs = getMealCarbs(meal);
  const fat = getMealFat(meal);

  const macros: string[] = [];
  if (cals !== null) macros.push(`${Math.round(cals)} kcal`);
  if (protein !== null) macros.push(`P ${Math.round(protein)}g`);
  if (carbs !== null) macros.push(`C ${Math.round(carbs)}g`);
  if (fat !== null) macros.push(`F ${Math.round(fat)}g`);

  const timeParts: string[] = [];
  if (typeof meal.prepareTime === "number" && meal.prepareTime > 0)
    timeParts.push(`Prep ${meal.prepareTime}m`);
  if (typeof meal.cookTime === "number" && meal.cookTime > 0)
    timeParts.push(`Cook ${meal.cookTime}m`);

  const isVideo = meal.media?.mediaType === "video";

  return (
    <Card className="border border-border overflow-hidden">
      {thumb && (
        <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden">
          <img
            src={thumb}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {isVideo && (
            <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold tracking-wide rounded-full px-2 py-0.5">
              VIDEO
            </span>
          )}
        </div>
      )}
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {MEAL_PLAN_SLOT_LABELS[slot]}
          </p>
          {typeof meal.recipeServingAmount === "number" &&
            meal.recipeServingAmount > 0 && (
              <p className="text-[10px] text-muted-foreground">
                {meal.recipeServingAmount} serving
                {meal.recipeServingAmount === 1 ? "" : "s"}
              </p>
            )}
        </div>
        <p className="font-semibold leading-tight">{name}</p>
        {macros.length > 0 && (
          <p className="text-xs text-foreground/80">{macros.join(" • ")}</p>
        )}
        {timeParts.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {timeParts.join(" • ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DayRow({
  entry,
  onOpen,
}: {
  entry: NutritionLogEntry;
  onOpen: () => void;
}) {
  const pct = compliancePct(entry.calories, entry.goal?.caloricGoal);
  const meals = entry.meals ?? [];
  const mealLabels = meals
    .map((m) => MEAL_NAME_LABELS[m.name ?? ""] ?? m.name)
    .filter(Boolean) as string[];
  const hasImage = meals.some((m) => m.hasImage);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left border border-border rounded-sm hover:border-primary/60 transition-colors bg-card"
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{safeFormat(entry.date)}</p>
            <p className="text-xs text-muted-foreground">{macroLine(entry)}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasImage && (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <Camera className="w-3 h-3" />
              </Badge>
            )}
            {entry.source && (
              <Badge variant="outline" className="text-muted-foreground">
                {NUTRITION_SOURCE_LABELS[entry.source] ?? entry.source}
              </Badge>
            )}
          </div>
        </div>

        {pct != null && (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>
                {fmtNum(entry.calories)} / {fmtNum(entry.goal?.caloricGoal)} kcal
              </span>
              <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded overflow-hidden">
              <div
                className={
                  "h-full transition-all " +
                  (pct > 110
                    ? "bg-amber-500"
                    : pct >= 80
                      ? "bg-emerald-500"
                      : "bg-primary")
                }
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        )}

        {mealLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mealLabels.map((label, i) => (
              <Badge
                key={`${label}-${i}`}
                variant="outline"
                className="text-[10px] text-muted-foreground"
              >
                {label}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Charts ───────────────────────────────────────────────────────────────

function CalorieTrendChart({
  data,
  caloricGoal,
}: {
  data: Array<{ date: string; kcal: number | null }>;
  caloricGoal: number | null;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Calorie trend</h3>
          {caloricGoal != null && (
            <Badge
              variant="outline"
              className="ml-auto text-[10px] text-muted-foreground"
            >
              Goal: {caloricGoal.toLocaleString()} kcal
            </Badge>
          )}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={shortDateTick}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              labelFormatter={fullDateLabel}
              formatter={(value) =>
                value == null ? ["—", "kcal"] : [`${value} kcal`, "Calories"]
              }
            />
            {caloricGoal != null && (
              <ReferenceLine
                y={caloricGoal}
                stroke="#10b981"
                strokeDasharray="5 5"
                label={{
                  value: "Goal",
                  position: "insideTopRight",
                  fill: "#10b981",
                  fontSize: 10,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="kcal"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: "#3b82f6", r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function MacroBreakdownChart({
  data,
}: {
  data: Array<{ date: string; carbs: number; protein: number; fat: number }>;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Macros per day (g)</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={shortDateTick}
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              labelFormatter={fullDateLabel}
              formatter={(value, name) => [`${value} g`, capLabel(name)]}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar
              dataKey="carbs"
              stackId="m"
              fill="#3b82f6"
              name="Carbs"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="protein"
              stackId="m"
              fill="#10b981"
              name="Protein"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="fat"
              stackId="m"
              fill="#f59e0b"
              name="Fat"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function shortDateTick(value: string): string {
  try {
    return format(parseISO(value), "MMM d");
  } catch {
    return value;
  }
}

function fullDateLabel(value: string): string {
  try {
    return format(parseISO(value), "EEE, MMM d, yyyy");
  } catch {
    return value;
  }
}

function capLabel(name: string | number): string {
  const s = String(name);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function macroLine(d: NutritionLogEntry): string {
  const parts: string[] = [];
  if (typeof d.calories === "number")
    parts.push(`${fmtNum(d.calories)} kcal`);
  if (typeof d.carbsGrams === "number") parts.push(`C ${fmtNum(d.carbsGrams)}g`);
  if (typeof d.proteinGrams === "number")
    parts.push(`P ${fmtNum(d.proteinGrams)}g`);
  if (typeof d.fatGrams === "number") parts.push(`F ${fmtNum(d.fatGrams)}g`);
  return parts.join(" · ") || "—";
}

// ─── Foods tab ────────────────────────────────────────────────────────────

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

// ─── Shared bits ──────────────────────────────────────────────────────────

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function LoadingCard() {
  return (
    <Card>
      <CardContent className="py-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function ErrorCard({ error, label }: { error: unknown; label: string }) {
  return (
    <Card>
      <CardContent className="py-8 flex items-start gap-3 text-destructive">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold mb-1">{label}</p>
          <p className="text-sm">
            {(error as { message?: string } | undefined)?.message ??
              "Please try again shortly."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function safeFormat(date: string): string {
  try {
    return format(parseISO(date), "EEEE, MMM d, yyyy");
  } catch {
    return date;
  }
}

function fmtNum(n: number | undefined | null): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: n < 10 ? 1 : 0,
  });
}
