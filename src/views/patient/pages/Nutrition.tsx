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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrainerizeGate from "@/components/trainerize/TrainerizeGate";
import {
  useCustomFoods,
  useNutritionLogs,
} from "@/hooks/trainerize/useNutrition";
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Nutrition</h1>
        <p className="text-muted-foreground">
          Daily intake & custom food library — Trainerize.
        </p>
      </header>

      <Tabs defaultValue="journal" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <Apple className="w-4 h-4" /> Journal
          </TabsTrigger>
          <TabsTrigger value="foods" className="flex items-center gap-2">
            <Info className="w-4 h-4" /> Foods
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal">
          <JournalTab onOpenDay={setOpenDay} />
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground border border-border rounded-sm p-3 flex-1">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Log meals from the Trainerize app, MyFitnessPal, or Fitbit. Entries
            sync here automatically.
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
              Log meals from the Trainerize app or sync MyFitnessPal / Fitbit.
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
            Trainerize library. System foods are read-only.
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
