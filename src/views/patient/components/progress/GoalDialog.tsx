// @ts-nocheck
import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, AlertCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useCreateGoal, useUpdateGoal } from "@/hooks/trainerize/useGoals";
import { useTrainerizeUnits } from "@/hooks/trainerize/useLinkage";
import {
  CLIENT_ACTIVE_LEVEL_LABELS,
  CLIENT_ACTIVE_LEVEL_VALUES,
  GOAL_TYPE_LABELS,
  NUTRITION_TRACKING_LABELS,
  NUTRITION_TRACKING_VALUES,
  isNutritionGoal,
  isTextGoal,
  isWeightGoal,
  type ClientActiveLevel,
  type CreateGoalPayload,
  type Goal,
  type GoalType,
  type NutritionTrackingType,
  type UpdateGoalPayload,
} from "@/types/trainerize/goals_types";

/**
 * Goal dialog — Add + Edit unified.
 *
 * Per response doc §1: POST and PUT bodies are identical (discriminated union
 * on `type`). PUT targets the type-level goal slot — no `goalId` on wire.
 * Per §6: nutrition uses Strategy A (calories + percents only; grams hidden).
 * Per §7: weight requires `type + unitWeight + weightGoal`.
 *
 * The dialog also warns inside Edit when the user has multiple goals of the
 * same type — PUT is unsafe there (§1 caveat).
 */

type Mode = "create" | "edit";

export interface GoalDialogProps {
  open: boolean;
  mode: Mode;
  /** Required on edit. Pre-fills the form by type. */
  goal?: Goal | null;
  /** Set to true when the user has 2+ goals of the same type as `goal`. */
  multipleOfType?: boolean;
  onClose: () => void;
}

const PERCENT_TOLERANCE = 0.5;

export default function GoalDialog({
  open,
  mode,
  goal,
  multipleOfType = false,
  onClose,
}: GoalDialogProps) {
  const { unitWeight: settingsUnitWeight } = useTrainerizeUnits();
  const create = useCreateGoal();
  const update = useUpdateGoal();
  const isEdit = mode === "edit";
  const busy = create.isPending || update.isPending;

  const [type, setType] = useState<GoalType>("textGoal");

  // Text
  const [text, setText] = useState("");

  // Weight
  const [unitWeight, setUnitWeight] = useState<string>("");
  const [weightGoal, setWeightGoal] = useState("");
  const [weeklyWeightGoal, setWeeklyWeightGoal] = useState("");
  const [clientActiveLevel, setClientActiveLevel] = useState<
    ClientActiveLevel | ""
  >("");
  const [startDate, setStartDate] = useState("");
  const [startWeight, setStartWeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");

  // Nutrition — Strategy A (percents only)
  const [trackingType, setTrackingType] = useState<NutritionTrackingType | "">(
    "",
  );
  const [caloricGoal, setCaloricGoal] = useState("");
  const [carbsPercent, setCarbsPercent] = useState("");
  const [proteinPercent, setProteinPercent] = useState("");
  const [fatPercent, setFatPercent] = useState("");

  // Reset / pre-fill on every open.
  useEffect(() => {
    if (!open) return;
    if (isEdit && goal) {
      setType(goal.type);
      // Text
      if (isTextGoal(goal)) {
        setText(goal.text ?? "");
      } else {
        setText("");
      }
      // Weight
      if (isWeightGoal(goal)) {
        setUnitWeight(goal.unitWeight ?? settingsUnitWeight ?? "");
        setWeightGoal(numToStr(goal.weightGoal));
        setWeeklyWeightGoal(numToStr(goal.weeklyWeightGoal));
        setClientActiveLevel(
          (goal.clientActiveLevel as ClientActiveLevel | undefined) ?? "",
        );
        setStartDate(goal.startDate ?? "");
        setStartWeight(numToStr(goal.startWeight));
        setCurrentWeight(numToStr(goal.currentWeight));
      } else {
        setUnitWeight(settingsUnitWeight ?? "");
        setWeightGoal("");
        setWeeklyWeightGoal("");
        setClientActiveLevel("");
        setStartDate("");
        setStartWeight("");
        setCurrentWeight("");
      }
      // Nutrition — read percents back (response doc §6 example shows
      // Trainerize echoes both grams and percents; we trust the percent fields).
      if (isNutritionGoal(goal)) {
        setTrackingType(
          (goal.trackingType as NutritionTrackingType | undefined) ?? "",
        );
        setCaloricGoal(numToStr(goal.caloricGoal));
        setCarbsPercent(numToStr(goal.carbsPercent));
        setProteinPercent(numToStr(goal.proteinPercent));
        setFatPercent(numToStr(goal.fatPercent));
      } else {
        setTrackingType("");
        setCaloricGoal("");
        setCarbsPercent("");
        setProteinPercent("");
        setFatPercent("");
      }
    } else {
      setType("textGoal");
      setText("");
      setUnitWeight(settingsUnitWeight ?? "");
      setWeightGoal("");
      setWeeklyWeightGoal("");
      setClientActiveLevel("");
      setStartDate("");
      setStartWeight("");
      setCurrentWeight("");
      setTrackingType("");
      setCaloricGoal("");
      setCarbsPercent("");
      setProteinPercent("");
      setFatPercent("");
    }
  }, [open, isEdit, goal, settingsUnitWeight]);

  const num = (s: string): number | undefined => {
    if (s.trim() === "") return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const buildPayload = (): CreateGoalPayload | null => {
    if (type === "textGoal") {
      const trimmed = text.trim();
      if (!trimmed) {
        toast({
          title: "Add a goal description",
          description: "Text goals need at least a short description.",
        });
        return null;
      }
      return { type: "textGoal", text: trimmed };
    }

    if (type === "weightGoal") {
      // §7: required = type + unitWeight + weightGoal.
      const wg = num(weightGoal);
      const chosenUnit = unitWeight || settingsUnitWeight;
      if (!chosenUnit) {
        toast({
          title: "Weight unit required",
          description: "Pick kg or lbs.",
        });
        return null;
      }
      if (typeof wg !== "number") {
        toast({
          title: "Target weight required",
          description: "Enter a goal weight.",
        });
        return null;
      }
      const payload: CreateGoalPayload = {
        type: "weightGoal",
        unitWeight: chosenUnit,
        weightGoal: wg,
      };
      const wwg = num(weeklyWeightGoal);
      const sw = num(startWeight);
      const cw = num(currentWeight);
      if (typeof wwg === "number") payload.weeklyWeightGoal = wwg;
      if (clientActiveLevel) payload.clientActiveLevel = clientActiveLevel;
      if (startDate) payload.startDate = startDate;
      if (typeof sw === "number") payload.startWeight = sw;
      if (typeof cw === "number") payload.currentWeight = cw;
      return payload;
    }

    // nutritionGoal — Strategy A: calories + percents only.
    const cg = num(caloricGoal);
    if (typeof cg !== "number" || cg <= 0) {
      toast({
        title: "Caloric goal required",
        description: "Set a daily calorie target.",
      });
      return null;
    }
    const cp = num(carbsPercent);
    const pp = num(proteinPercent);
    const fp = num(fatPercent);
    const provided = [cp, pp, fp].filter((n): n is number => typeof n === "number");
    // If the user filled any percent, require all three and sum to 100.
    if (provided.length > 0) {
      if (provided.length < 3) {
        toast({
          title: "Set all macro percents",
          description: "Carbs, protein, and fat — all three required when using percents.",
        });
        return null;
      }
      const sum = (cp ?? 0) + (pp ?? 0) + (fp ?? 0);
      if (Math.abs(sum - 100) > PERCENT_TOLERANCE) {
        toast({
          title: "Percents must total 100",
          description: `Currently ${sum.toFixed(1)}%.`,
        });
        return null;
      }
    }
    const payload: CreateGoalPayload = {
      type: "nutritionGoal",
      caloricGoal: cg,
    };
    if (trackingType) payload.trackingType = trackingType;
    if (typeof cp === "number") payload.carbsPercent = cp;
    if (typeof pp === "number") payload.proteinPercent = pp;
    if (typeof fp === "number") payload.fatPercent = fp;
    return payload;
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;
    try {
      if (isEdit) {
        // §1: PUT body is identical to POST; no goalId.
        await update.mutateAsync(payload as UpdateGoalPayload);
        toast({
          title: "Goal updated",
          description: GOAL_TYPE_LABELS[type],
        });
      } else {
        await create.mutateAsync(payload);
        toast({
          title: "Goal created",
          description: GOAL_TYPE_LABELS[type],
        });
      }
      onClose();
    } catch (err) {
      toast({
        title: isEdit ? "Couldn't update goal" : "Couldn't create goal",
        description:
          (err as { message?: string } | undefined)?.message ??
          "Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <Pencil className="w-5 h-5 text-primary" />
            ) : (
              <Plus className="w-5 h-5 text-primary" />
            )}
            {isEdit ? "Edit goal" : "New goal"}
          </DialogTitle>
        </DialogHeader>

        {isEdit && multipleOfType && (
          <div className="flex items-start gap-2 text-sm text-amber-700 border border-amber-300 bg-amber-50 rounded-sm p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Multiple {GOAL_TYPE_LABELS[type]}s on your account</p>
              <p className="text-xs">
                The update endpoint targets the type-level goal slot — saving
                here may not affect this specific row. Delete duplicates first
                or edit from your trainer's app.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-type">Goal type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as GoalType)}
              disabled={isEdit}
            >
              <SelectTrigger id="goal-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="textGoal">
                  {GOAL_TYPE_LABELS.textGoal}
                </SelectItem>
                <SelectItem value="weightGoal">
                  {GOAL_TYPE_LABELS.weightGoal}
                </SelectItem>
                <SelectItem value="nutritionGoal">
                  {GOAL_TYPE_LABELS.nutritionGoal}
                </SelectItem>
              </SelectContent>
            </Select>
            {isEdit && (
              <p className="text-[11px] text-muted-foreground">
                Goal type can't be changed after creation.
              </p>
            )}
          </div>

          {type === "textGoal" && (
            <div className="space-y-2">
              <Label htmlFor="goal-text">Goal description</Label>
              <Textarea
                id="goal-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Run a 5K under 25 minutes"
                rows={3}
              />
              {isEdit && (
                <p className="text-[11px] text-muted-foreground">
                  Update progress via the "Update progress" button on the card,
                  not here.
                </p>
              )}
            </div>
          )}

          {type === "weightGoal" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="unit-weight">
                    Unit <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={unitWeight}
                    onValueChange={setUnitWeight}
                  >
                    <SelectTrigger id="unit-weight">
                      <SelectValue placeholder="kg or lbs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lbs">lbs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <RequiredNumField
                  label={`Goal weight (${unitWeight || "—"})`}
                  id="weight-goal"
                  value={weightGoal}
                  onChange={setWeightGoal}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={`Weekly rate (${unitWeight || "—"}/wk)`}
                  id="weekly-weight"
                  value={weeklyWeightGoal}
                  onChange={setWeeklyWeightGoal}
                  type="number"
                />
                <div className="space-y-2">
                  <Label htmlFor="active-level">Activity level</Label>
                  <Select
                    value={clientActiveLevel}
                    onValueChange={(v) =>
                      setClientActiveLevel(v as ClientActiveLevel)
                    }
                  >
                    <SelectTrigger id="active-level">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIENT_ACTIVE_LEVEL_VALUES.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          {CLIENT_ACTIVE_LEVEL_LABELS[lvl]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={`Start weight (${unitWeight || "—"})`}
                  id="start-weight"
                  value={startWeight}
                  onChange={setStartWeight}
                  type="number"
                />
                <Field
                  label={`Current weight (${unitWeight || "—"})`}
                  id="current-weight"
                  value={currentWeight}
                  onChange={setCurrentWeight}
                  type="number"
                />
              </div>
              <Field
                label="Start date"
                id="start-date"
                value={startDate}
                onChange={setStartDate}
                type="date"
              />
              <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border rounded-sm p-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  To log today's weight (not change the goal), use the
                  Measurements tab on the Progress page.
                </span>
              </div>
            </div>
          )}

          {type === "nutritionGoal" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tracking-type">Tracking source</Label>
                  <Select
                    value={trackingType}
                    onValueChange={(v) =>
                      setTrackingType(v as NutritionTrackingType)
                    }
                  >
                    <SelectTrigger id="tracking-type">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {NUTRITION_TRACKING_VALUES.map((tt) => (
                        <SelectItem key={tt} value={tt}>
                          {NUTRITION_TRACKING_LABELS[tt]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <RequiredNumField
                  label="Caloric goal (kcal)"
                  id="caloric-goal"
                  value={caloricGoal}
                  onChange={setCaloricGoal}
                />
              </div>

              <PercentRow
                label="Carbs"
                value={carbsPercent}
                onChange={setCarbsPercent}
              />
              <PercentRow
                label="Protein"
                value={proteinPercent}
                onChange={setProteinPercent}
              />
              <PercentRow
                label="Fat"
                value={fatPercent}
                onChange={setFatPercent}
              />

              <PercentSumIndicator
                carbs={carbsPercent}
                protein={proteinPercent}
                fat={fatPercent}
              />

              <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border rounded-sm p-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Gram targets are derived from your calorie goal and
                  percents. To skip macro split, leave the three percent
                  fields blank.
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={busy}
            className="gap-2"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEdit ? (
              <Pencil className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isEdit ? "Save changes" : "Create goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number" | "date";
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        step={type === "number" ? "0.1" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function RequiredNumField({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <Input
        id={id}
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="required"
      />
    </div>
  );
}

function PercentRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr,140px] gap-3 items-end">
      <Label className="text-sm font-semibold pb-2">{label}</Label>
      <Input
        type="number"
        step="0.1"
        min="0"
        max="100"
        placeholder="%"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PercentSumIndicator({
  carbs,
  protein,
  fat,
}: {
  carbs: string;
  protein: string;
  fat: string;
}) {
  const provided = [carbs, protein, fat].filter((s) => s.trim() !== "");
  if (provided.length === 0) return null;
  const sum =
    (Number(carbs) || 0) + (Number(protein) || 0) + (Number(fat) || 0);
  const ok = Math.abs(sum - 100) <= PERCENT_TOLERANCE && provided.length === 3;
  return (
    <p
      className={
        "text-xs " +
        (ok
          ? "text-emerald-600"
          : provided.length < 3
            ? "text-muted-foreground"
            : "text-amber-600")
      }
    >
      Sum: <span className="font-semibold">{sum.toFixed(1)}%</span>
      {provided.length < 3
        ? " — add all three to validate"
        : ok
          ? " ✓"
          : " — must total 100%"}
    </p>
  );
}

function numToStr(n: number | undefined | null): string {
  return typeof n === "number" && Number.isFinite(n) ? String(n) : "";
}
