// @ts-nocheck
import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Loader2,
  AlertCircle,
  Apple,
  Camera,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useNutritionDay } from "@/hooks/trainerize/useNutrition";
import {
  MEAL_NAME_LABELS,
  MEAL_ORDER,
  NUTRIENT_BY_NO,
  NUTRITION_SOURCE_LABELS,
  compliancePct,
  withinCaloricDeviation,
  type MealFood,
  type NutritionDay,
  type NutritionGoalSnapshot,
  type NutritionMeal,
} from "@/types/trainerize/nutrition_types";

/**
 * Day detail dialog. Deep-links by `nutritionId` (preferred per §9) or `date`.
 * Renders 4 macro rings vs `goal`, meals with summaries + foods, and a
 * collapsible advanced-nutrients section from top-level `nutrients[]`.
 */

export interface DayDetailDialogProps {
  /** Pass exactly one — `nutritionId` is preferred when available. */
  nutritionId?: number;
  date?: string;
  onClose: () => void;
}

export default function DayDetailDialog({
  nutritionId,
  date,
  onClose,
}: DayDetailDialogProps) {
  const open = nutritionId != null || date != null;
  const { data, isLoading, isError, error } = useNutritionDay(date, nutritionId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-primary" />
            Day detail
            {data?.date && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {safeFormat(data.date)}
              </span>
            )}
            {data?.source && (
              <Badge variant="outline" className="ml-auto text-muted-foreground">
                {NUTRITION_SOURCE_LABELS[data.source] ?? data.source}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="py-8 flex items-start gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Couldn't load this day</p>
              <p className="text-sm">
                {(error as { message?: string } | undefined)?.message ??
                  "Please try again shortly."}
              </p>
            </div>
          </div>
        ) : !data ? (
          <EmptyDay />
        ) : (
          <div className="space-y-4">
            <MacroRings day={data} />
            <Meals meals={data.meals ?? []} />
            <AdvancedNutrients day={data} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Macro rings ──────────────────────────────────────────────────────────

function MacroRings({ day }: { day: NutritionDay }) {
  const goal = day.goal;
  const within = withinCaloricDeviation(day.calories, goal);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <RingTile
          label="Calories"
          actual={day.calories}
          target={goal?.caloricGoal}
          unit="kcal"
        />
        <RingTile
          label="Carbs"
          actual={day.carbsGrams}
          target={goal?.carbsGrams}
          unit="g"
        />
        <RingTile
          label="Protein"
          actual={day.proteinGrams}
          target={goal?.proteinGrams}
          unit="g"
        />
        <RingTile
          label="Fat"
          actual={day.fatGrams}
          target={goal?.fatGrams}
          unit="g"
        />
      </div>
      {within != null && (
        <div className="flex items-center gap-2 text-xs">
          {within ? (
            <Badge variant="outline" className="border-emerald-500 text-emerald-600 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Within {goal?.nutritionDeviation ?? 10}% of calorie goal
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500 text-amber-600">
              Outside the {goal?.nutritionDeviation ?? 10}% calorie window
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function RingTile({
  label,
  actual,
  target,
  unit,
}: {
  label: string;
  actual: number | undefined;
  target: number | undefined;
  unit: string;
}) {
  const pct = compliancePct(actual, target);
  const hasActual = typeof actual === "number" && Number.isFinite(actual);
  const hasTarget = typeof target === "number" && Number.isFinite(target);

  return (
    <div className="border border-border rounded-sm p-3 bg-card">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-xl font-bold">
        {hasActual ? fmtNum(actual) : "—"}
        <span className="text-xs text-muted-foreground font-normal">
          {hasActual ? ` ${unit}` : ""}
        </span>
      </p>
      <p className="text-xs text-muted-foreground">
        {hasTarget ? `/ ${fmtNum(target)} ${unit}` : "no goal"}
      </p>
      {pct != null && (
        <div className="mt-2 h-1.5 bg-muted rounded overflow-hidden">
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
      )}
      {pct != null && (
        <p className="text-[10px] text-muted-foreground mt-1">{pct}%</p>
      )}
    </div>
  );
}

// ─── Meals ────────────────────────────────────────────────────────────────

function Meals({ meals }: { meals: NutritionMeal[] }) {
  if (meals.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6 border border-dashed border-border rounded-sm">
        No meals logged for this day.
      </div>
    );
  }
  const sorted = [...meals].sort((a, b) => {
    const ao = MEAL_ORDER[a.name ?? ""] ?? 99;
    const bo = MEAL_ORDER[b.name ?? ""] ?? 99;
    if (ao !== bo) return ao - bo;
    return (a.mealTime ?? "").localeCompare(b.mealTime ?? "");
  });
  return (
    <div className="space-y-3">
      {sorted.map((m, i) => (
        <MealCard key={m.mealGuid ?? `${m.name}-${i}`} meal={m} />
      ))}
    </div>
  );
}

function MealCard({ meal }: { meal: NutritionMeal }) {
  const label = MEAL_NAME_LABELS[meal.name ?? ""] ?? meal.name ?? "Meal";
  const time = meal.mealTime ? safeTime(meal.mealTime) : null;
  return (
    <div className="border border-border rounded-sm p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold flex items-center gap-2">
            {label}
            {meal.hasImage && (
              <Camera className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </p>
          {meal.description && (
            <p className="text-xs text-muted-foreground">{meal.description}</p>
          )}
          {time && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {time}
            </p>
          )}
        </div>
        {typeof meal.caloriesSummary === "number" && (
          <Badge variant="outline" className="text-muted-foreground">
            {fmtNum(meal.caloriesSummary)} kcal
          </Badge>
        )}
      </div>

      {(meal.foods ?? []).length > 0 ? (
        <ul className="space-y-1 pl-1">
          {(meal.foods ?? []).map((f, i) => (
            <FoodRow key={`${meal.mealGuid ?? ""}-${i}`} food={f} />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No foods recorded.</p>
      )}

      {/* Per-meal macro percent strip when any percent is present. */}
      {(typeof meal.carbsPercent === "number" ||
        typeof meal.proteinPercent === "number" ||
        typeof meal.fatPercent === "number") && (
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border">
          {typeof meal.carbsPercent === "number" && (
            <span>C {meal.carbsPercent}%</span>
          )}
          {typeof meal.proteinPercent === "number" && (
            <span>P {meal.proteinPercent}%</span>
          )}
          {typeof meal.fatPercent === "number" && (
            <span>F {meal.fatPercent}%</span>
          )}
        </div>
      )}
    </div>
  );
}

function FoodRow({ food }: { food: MealFood }) {
  return (
    <li className="flex items-start justify-between gap-2 text-sm">
      <div className="min-w-0">
        <p className="truncate">
          <span className="font-medium">{food.name ?? "Unnamed"}</span>
          {typeof food.amount === "number" && (
            <span className="text-muted-foreground">
              {" • "}
              {food.amount}
              {food.unit ? ` ${food.unit}` : ""}
            </span>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {macroLine(food)}
        </p>
      </div>
      {food.type && (
        <Badge
          variant="outline"
          className={
            food.type === "custom"
              ? "text-primary border-primary/40 text-[10px]"
              : "text-muted-foreground text-[10px]"
          }
        >
          {food.type}
        </Badge>
      )}
    </li>
  );
}

function macroLine(f: MealFood): string {
  const parts: string[] = [];
  if (typeof f.calories === "number") parts.push(`${fmtNum(f.calories)} kcal`);
  if (typeof f.proteins === "number") parts.push(`P ${fmtNum(f.proteins)}g`);
  if (typeof f.carbs === "number") parts.push(`C ${fmtNum(f.carbs)}g`);
  if (typeof f.fat === "number") parts.push(`F ${fmtNum(f.fat)}g`);
  return parts.join(" · ") || "—";
}

// ─── Advanced nutrients (top-level nutrients[]) ───────────────────────────

function AdvancedNutrients({ day }: { day: NutritionDay }) {
  const [open, setOpen] = useState(false);
  const rows = (day.nutrients ?? []).filter(
    (n) => typeof n?.nutrNo === "number",
  );
  if (rows.length === 0) return null;
  return (
    <div className="border border-border rounded-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-2 text-sm font-semibold hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          Advanced nutrients
        </span>
        <Badge variant="outline" className="text-muted-foreground">
          {rows.length} entries
        </Badge>
      </button>
      {open && (
        <div className="border-t border-border p-2 grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-1 text-xs">
          {rows.map((n, i) => {
            const meta = NUTRIENT_BY_NO[n.nutrNo];
            const label = meta?.name ?? `Nutrient #${n.nutrNo}`;
            const unit = meta?.unit ?? "";
            return (
              <div key={`${n.nutrNo}-${i}`} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground truncate">{label}</span>
                <span className="font-mono">
                  {fmtNum(n.nutrVal)} {unit}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Empty / helpers ──────────────────────────────────────────────────────

function EmptyDay() {
  return (
    <div className="text-center text-muted-foreground py-10">
      <Apple className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="font-semibold mb-1">No nutrition record for this day</p>
      <p className="text-xs">Log meals from the Apex Fit app or MFP / Fitbit.</p>
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

function safeTime(mealTime: string): string {
  // mealTime is `YYYY-MM-DD HH:MM:SS` per response doc; convert to ISO for parseISO.
  const iso = mealTime.includes("T") ? mealTime : mealTime.replace(" ", "T");
  try {
    return format(parseISO(iso), "h:mm a");
  } catch {
    return mealTime;
  }
}

function fmtNum(n: number | undefined | null): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: n < 10 ? 1 : 0,
  });
}
