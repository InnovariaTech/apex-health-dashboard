// @ts-nocheck
import { useMemo, useState } from "react";
import {
  Target,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Scale,
  Apple,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useGoals } from "@/hooks/trainerize/useGoals";
import { useTrainerizeUnits } from "@/hooks/trainerize/useLinkage";
import {
  CLIENT_ACTIVE_LEVEL_LABELS,
  GOAL_TYPE_LABELS,
  NUTRITION_TRACKING_LABELS,
  isNutritionGoal,
  isTextGoal,
  isWeightGoal,
  type Goal,
  type NutritionGoal,
  type TextGoal,
  type WeightGoal,
} from "@/types/trainerize/goals_types";
import GoalDialog from "./GoalDialog";
import DeleteGoalDialog from "./DeleteGoalDialog";
import UpdateProgressDialog from "./UpdateProgressDialog";

/**
 * Goals tab — Trainerize goals on the patient Progress page.
 * See `docs/trainerize/goals/goals-issue-responses.md` for the latest
 * resolutions to clarification questions.
 *
 *  - Active / Achieved tab toggle (drives `achieved` query param)
 *  - Paginated list of cards
 *  - Card renders by `type`: text / weight / nutrition
 *  - Add + Edit via unified GoalDialog (PUT body = POST body; §1)
 *  - Edit gated when multiple goals of same `type` exist (§1 caveat)
 *  - Text progress dialog flips `achieved` server-side at 100% (§3)
 *  - No manual "Mark achieved" button — `achieved` is read-only (§3)
 *  - Weight current-weight updates routed to Progress → Measurements (§7)
 */

const PAGE_SIZE = 25;

type View = "active" | "achieved";

export default function GoalsTab() {
  const [view, setView] = useState<View>("active");
  const [start, setStart] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState<TextGoal | null>(null);
  const { unitWeight } = useTrainerizeUnits();

  const achieved = view === "achieved";
  const { data, isLoading, isError, error } = useGoals(achieved, start, PAGE_SIZE);

  const total = data?.total ?? 0;
  const goals = data?.goals ?? [];
  const hasPrev = start > 0;
  const hasNext = start + PAGE_SIZE < total;

  // §1 caveat: PUT /goals updates the type-level slot, not a specific row.
  // If the user has multiple goals of the same type, editing any of them is
  // unsafe — flag both list and dialog with a warning, but don't hard-block.
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const g of goals) c[g.type] = (c[g.type] ?? 0) + 1;
    return c;
  }, [goals]);
  const editingMultiple =
    editing != null && (typeCounts[editing.type] ?? 0) > 1;

  const onViewChange = (next: string) => {
    setView(next as View);
    setStart(0);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Goals
          </h2>
          <p className="text-sm text-muted-foreground">
            Text, weight, and nutrition goals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={onViewChange}>
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="achieved">Achieved</TabsTrigger>
            </TabsList>
            <TabsContent value="active" />
            <TabsContent value="achieved" />
          </Tabs>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add goal
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-8 flex items-start gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Couldn't load goals</p>
              <p className="text-sm">
                {(error as { message?: string } | undefined)?.message ??
                  "Please try again shortly."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : goals.length === 0 ? (
        <EmptyState view={view} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                unitWeight={unitWeight}
                multipleOfType={(typeCounts[g.type] ?? 0) > 1}
                onEdit={() => setEditing(g)}
                onDelete={() => setDeleting(g)}
                onUpdateProgress={
                  isTextGoal(g) ? () => setUpdatingProgress(g) : undefined
                }
              />
            ))}
          </div>

          {(hasPrev || hasNext) && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of{" "}
                {total}
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
        </>
      )}

      <GoalDialog open={addOpen} mode="create" onClose={() => setAddOpen(false)} />
      <GoalDialog
        open={editing != null}
        mode="edit"
        goal={editing}
        multipleOfType={editingMultiple}
        onClose={() => setEditing(null)}
      />
      <DeleteGoalDialog goal={deleting} onClose={() => setDeleting(null)} />
      <UpdateProgressDialog
        goal={updatingProgress}
        onClose={() => setUpdatingProgress(null)}
      />
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ view }: { view: View }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="font-semibold mb-1">
          {view === "achieved" ? "No achieved goals yet" : "No active goals"}
        </p>
        <p className="text-sm text-muted-foreground">
          {view === "achieved"
            ? "Goals you complete will appear here."
            : "Your trainer can add goals from their app, or you can add one here once available."}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Card switch by type ────────────────────────────────────────────────────

function GoalCard({
  goal,
  unitWeight,
  multipleOfType,
  onEdit,
  onDelete,
  onUpdateProgress,
}: {
  goal: Goal;
  unitWeight: string;
  multipleOfType: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateProgress?: () => void;
}) {
  if (isTextGoal(goal))
    return (
      <TextGoalCard
        goal={goal}
        multipleOfType={multipleOfType}
        onEdit={onEdit}
        onDelete={onDelete}
        onUpdateProgress={onUpdateProgress}
      />
    );
  if (isWeightGoal(goal))
    return (
      <WeightGoalCard
        goal={goal}
        fallbackUnit={unitWeight}
        multipleOfType={multipleOfType}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  if (isNutritionGoal(goal))
    return (
      <NutritionGoalCard
        goal={goal}
        multipleOfType={multipleOfType}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  // Defensive: unknown type — render a minimal stub so users see *something*
  // and we never crash on a wire shape we didn't model.
  return (
    <Card>
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Unsupported goal type:{" "}
          <span className="font-mono">{String((goal as Goal).type ?? "?")}</span>
        </p>
        <DeleteButton onClick={onDelete} />
      </CardContent>
    </Card>
  );
}

/**
 * Edit action — disabled when multiple goals share the same `type` (§1).
 * Renders a tooltip explaining why the button is inert in that case.
 */
function EditButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={
        disabled
          ? "Multiple goals of this type — delete duplicates to edit"
          : "Edit goal"
      }
      className="text-muted-foreground hover:text-foreground flex-shrink-0"
    >
      <Pencil className="w-4 h-4" />
    </Button>
  );
}

function MultipleTypeWarning() {
  return (
    <div className="flex items-start gap-1.5 text-[11px] text-amber-700 border border-amber-300 bg-amber-50 rounded-sm p-1.5">
      <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
      <span>
        Multiple goals of this type — Edit is disabled (it would update them
        as a group).
      </span>
    </div>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      title="Delete goal"
      className="text-muted-foreground hover:text-destructive flex-shrink-0"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

function AchievedBadge({ achieved }: { achieved: boolean }) {
  if (!achieved) return null;
  return (
    <Badge variant="outline" className="border-emerald-500 text-emerald-600 gap-1">
      <CheckCircle2 className="w-3 h-3" /> Achieved
    </Badge>
  );
}

// ─── Text goal card ─────────────────────────────────────────────────────────

function TextGoalCard({
  goal,
  multipleOfType,
  onEdit,
  onDelete,
  onUpdateProgress,
}: {
  goal: TextGoal;
  multipleOfType: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateProgress?: () => void;
}) {
  // Doc §9: `progress` may or may not echo back on read. Render only when
  // numeric and finite; otherwise skip the bar so we don't display 0% as
  // misleading "no progress yet".
  const showProgress =
    typeof goal.progress === "number" && Number.isFinite(goal.progress);
  const pct = showProgress
    ? Math.max(0, Math.min(100, goal.progress as number))
    : 0;

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <FileText className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {GOAL_TYPE_LABELS.textGoal}
              </p>
              <p className="font-semibold break-words">
                {goal.text || "Untitled goal"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <AchievedBadge achieved={goal.achieved} />
            <EditButton onClick={onEdit} disabled={multipleOfType} />
            <DeleteButton onClick={onDelete} />
          </div>
        </div>

        {multipleOfType && <MultipleTypeWarning />}

        {showProgress && (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {onUpdateProgress && !goal.achieved && (
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onUpdateProgress}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              {showProgress ? "Update progress" : "Log progress"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Weight goal card ───────────────────────────────────────────────────────

function WeightGoalCard({
  goal,
  fallbackUnit,
  multipleOfType,
  onEdit,
  onDelete,
}: {
  goal: WeightGoal;
  fallbackUnit: string;
  multipleOfType: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const unit = goal.unitWeight || fallbackUnit;
  const start = goal.startWeight;
  const current = goal.currentWeight;
  const target = goal.weightGoal;

  // Distance covered vs target — only render if all three are present and
  // start ≠ target (avoid divide-by-zero on a maintenance goal).
  let pct: number | null = null;
  if (
    typeof start === "number" &&
    typeof current === "number" &&
    typeof target === "number" &&
    start !== target
  ) {
    const totalDelta = target - start;
    const doneDelta = current - start;
    const raw = (doneDelta / totalDelta) * 100;
    pct = Math.max(0, Math.min(100, Math.round(raw)));
  }

  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <Scale className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {GOAL_TYPE_LABELS.weightGoal}
              </p>
              <p className="font-semibold">
                {typeof current === "number" ? `${current} ${unit}` : "—"}
                <span className="text-muted-foreground font-normal"> → </span>
                {typeof target === "number" ? `${target} ${unit}` : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <AchievedBadge achieved={goal.achieved} />
            <EditButton onClick={onEdit} disabled={multipleOfType} />
            <DeleteButton onClick={onDelete} />
          </div>
        </div>

        {multipleOfType && <MultipleTypeWarning />}

        <div className="flex flex-wrap gap-2 text-xs">
          {typeof goal.weeklyWeightGoal === "number" && (
            <Badge variant="outline" className="text-muted-foreground">
              {goal.weeklyWeightGoal} {unit}/wk
            </Badge>
          )}
          {goal.clientActiveLevel && (
            <Badge variant="outline" className="text-muted-foreground">
              {CLIENT_ACTIVE_LEVEL_LABELS[goal.clientActiveLevel] ??
                goal.clientActiveLevel}
            </Badge>
          )}
          {goal.startDate && (
            <Badge variant="outline" className="text-muted-foreground">
              Started {goal.startDate}
            </Badge>
          )}
        </div>

        {pct != null && (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>
                {typeof start === "number" ? `${start} ${unit}` : "Start"}
              </span>
              <span className="font-semibold text-foreground">{pct}%</span>
              <span>
                {typeof target === "number" ? `${target} ${unit}` : "Target"}
              </span>
            </div>
            <div className="h-2 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
          To log today's weight, use Progress → Measurements.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Nutrition goal card ────────────────────────────────────────────────────

function NutritionGoalCard({
  goal,
  multipleOfType,
  onEdit,
  onDelete,
}: {
  goal: NutritionGoal;
  multipleOfType: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="border-2">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <Apple className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {GOAL_TYPE_LABELS.nutritionGoal}
              </p>
              <p className="font-semibold">
                {typeof goal.caloricGoal === "number"
                  ? `${goal.caloricGoal} kcal/day`
                  : "Caloric goal —"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <AchievedBadge achieved={goal.achieved} />
            <EditButton onClick={onEdit} disabled={multipleOfType} />
            <DeleteButton onClick={onDelete} />
          </div>
        </div>

        {multipleOfType && <MultipleTypeWarning />}

        <div className="grid grid-cols-3 gap-2">
          <MacroTile
            label="Carbs"
            grams={goal.carbsGrams}
            percent={goal.carbsPercent}
          />
          <MacroTile
            label="Protein"
            grams={goal.proteinGrams}
            percent={goal.proteinPercent}
          />
          <MacroTile
            label="Fat"
            grams={goal.fatGrams}
            percent={goal.fatPercent}
          />
        </div>

        {goal.trackingType && (
          <Badge variant="outline" className="text-muted-foreground">
            Tracking:{" "}
            {NUTRITION_TRACKING_LABELS[goal.trackingType] ?? goal.trackingType}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function MacroTile({
  label,
  grams,
  percent,
}: {
  label: string;
  grams?: number;
  percent?: number;
}) {
  return (
    <div className="border border-border rounded-sm p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">
        {typeof grams === "number" ? `${grams} g` : "—"}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {typeof percent === "number" ? `${percent}%` : "—"}
      </p>
    </div>
  );
}
