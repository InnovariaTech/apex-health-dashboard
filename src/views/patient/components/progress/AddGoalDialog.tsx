// @ts-nocheck
import { useState } from "react";
import { Loader2, Plus, AlertCircle } from "lucide-react";
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
import { useCreateGoal } from "@/hooks/trainerize/useGoals";
import { useTrainerizeUnits } from "@/hooks/trainerize/useLinkage";
import {
  CLIENT_ACTIVE_LEVEL_LABELS,
  CLIENT_ACTIVE_LEVEL_VALUES,
  GOAL_TYPE_LABELS,
  NUTRITION_TRACKING_LABELS,
  NUTRITION_TRACKING_VALUES,
  type ClientActiveLevel,
  type CreateGoalPayload,
  type GoalType,
  type NutritionTrackingType,
} from "@/types/trainerize/goals_types";

/**
 * Add Goal dialog — covers all three goal types via a single dialog with a
 * type switcher. Validation is intentionally lenient: doc §6 (nutrition
 * grams/percent) and §7 (weight required fields) are unresolved (see
 * `docs/trainerize/goals/goals_clarification.md`), so we collect what the user
 * provides and rely on the backend to reject invalid combinations rather than
 * over-constraining the form.
 */

export interface AddGoalDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AddGoalDialog({ open, onClose }: AddGoalDialogProps) {
  const { unitWeight } = useTrainerizeUnits();
  const create = useCreateGoal();
  const [type, setType] = useState<GoalType>("textGoal");

  // Text
  const [text, setText] = useState("");

  // Weight
  const [weightGoal, setWeightGoal] = useState("");
  const [weeklyWeightGoal, setWeeklyWeightGoal] = useState("");
  const [clientActiveLevel, setClientActiveLevel] = useState<
    ClientActiveLevel | ""
  >("");
  const [startDate, setStartDate] = useState("");
  const [startWeight, setStartWeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");

  // Nutrition
  const [trackingType, setTrackingType] = useState<NutritionTrackingType | "">(
    "",
  );
  const [caloricGoal, setCaloricGoal] = useState("");
  const [carbsGrams, setCarbsGrams] = useState("");
  const [carbsPercent, setCarbsPercent] = useState("");
  const [proteinGrams, setProteinGrams] = useState("");
  const [proteinPercent, setProteinPercent] = useState("");
  const [fatGrams, setFatGrams] = useState("");
  const [fatPercent, setFatPercent] = useState("");

  const resetAll = () => {
    setType("textGoal");
    setText("");
    setWeightGoal("");
    setWeeklyWeightGoal("");
    setClientActiveLevel("");
    setStartDate("");
    setStartWeight("");
    setCurrentWeight("");
    setTrackingType("");
    setCaloricGoal("");
    setCarbsGrams("");
    setCarbsPercent("");
    setProteinGrams("");
    setProteinPercent("");
    setFatGrams("");
    setFatPercent("");
  };

  const close = () => {
    resetAll();
    onClose();
  };

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
      // Lenient: send only what the user typed. Backend / Trainerize may
      // require more (§7) — toast surfaces server errors if so.
      const payload: CreateGoalPayload = {
        type: "weightGoal",
        unitWeight,
      };
      const wg = num(weightGoal);
      const wwg = num(weeklyWeightGoal);
      const sw = num(startWeight);
      const cw = num(currentWeight);
      if (typeof wg === "number") payload.weightGoal = wg;
      if (typeof wwg === "number") payload.weeklyWeightGoal = wwg;
      if (clientActiveLevel) payload.clientActiveLevel = clientActiveLevel;
      if (startDate) payload.startDate = startDate;
      if (typeof sw === "number") payload.startWeight = sw;
      if (typeof cw === "number") payload.currentWeight = cw;
      return payload;
    }
    // nutritionGoal
    const payload: CreateGoalPayload = { type: "nutritionGoal" };
    if (trackingType) payload.trackingType = trackingType;
    const fields: Array<[string, string]> = [
      ["caloricGoal", caloricGoal],
      ["carbsGrams", carbsGrams],
      ["carbsPercent", carbsPercent],
      ["proteinGrams", proteinGrams],
      ["proteinPercent", proteinPercent],
      ["fatGrams", fatGrams],
      ["fatPercent", fatPercent],
    ];
    for (const [k, v] of fields) {
      const n = num(v);
      if (typeof n === "number") (payload as any)[k] = n;
    }
    return payload;
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;
    try {
      await create.mutateAsync(payload);
      toast({
        title: "Goal created",
        description: GOAL_TYPE_LABELS[type],
      });
      close();
    } catch (err) {
      toast({
        title: "Couldn't create goal",
        description:
          (err as { message?: string } | undefined)?.message ??
          "Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            New goal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-type">Goal type</Label>
            <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
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
            </div>
          )}

          {type === "weightGoal" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={`Goal weight (${unitWeight})`}
                  id="weight-goal"
                  value={weightGoal}
                  onChange={setWeightGoal}
                  type="number"
                />
                <Field
                  label={`Weekly rate (${unitWeight}/wk)`}
                  id="weekly-weight"
                  value={weeklyWeightGoal}
                  onChange={setWeeklyWeightGoal}
                  type="number"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={`Start weight (${unitWeight})`}
                  id="start-weight"
                  value={startWeight}
                  onChange={setStartWeight}
                  type="number"
                />
                <Field
                  label={`Current weight (${unitWeight})`}
                  id="current-weight"
                  value={currentWeight}
                  onChange={setCurrentWeight}
                  type="number"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Start date"
                  id="start-date"
                  value={startDate}
                  onChange={setStartDate}
                  type="date"
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
                <Field
                  label="Caloric goal (kcal)"
                  id="caloric-goal"
                  value={caloricGoal}
                  onChange={setCaloricGoal}
                  type="number"
                />
              </div>

              <MacroRow
                label="Carbs"
                grams={carbsGrams}
                percent={carbsPercent}
                onGrams={setCarbsGrams}
                onPercent={setCarbsPercent}
              />
              <MacroRow
                label="Protein"
                grams={proteinGrams}
                percent={proteinPercent}
                onGrams={setProteinGrams}
                onPercent={setProteinPercent}
              />
              <MacroRow
                label="Fat"
                grams={fatGrams}
                percent={fatPercent}
                onGrams={setFatGrams}
                onPercent={setFatPercent}
              />

              <div className="flex items-start gap-2 text-xs text-muted-foreground border border-border rounded-sm p-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Trainerize may require a specific combination of grams,
                  percent, and caloric goal. If submission fails, simplify the
                  inputs.
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={close} disabled={create.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={create.isPending}
            className="gap-2"
          >
            {create.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Create goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

function MacroRow({
  label,
  grams,
  percent,
  onGrams,
  onPercent,
}: {
  label: string;
  grams: string;
  percent: string;
  onGrams: (v: string) => void;
  onPercent: (v: string) => void;
}) {
  const slug = label.toLowerCase();
  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="grid grid-cols-2 gap-3 mt-1">
        <Input
          id={`${slug}-g`}
          type="number"
          step="0.1"
          placeholder="grams"
          value={grams}
          onChange={(e) => onGrams(e.target.value)}
        />
        <Input
          id={`${slug}-p`}
          type="number"
          step="1"
          placeholder="%"
          value={percent}
          onChange={(e) => onPercent(e.target.value)}
        />
      </div>
    </div>
  );
}
