// @ts-nocheck
import { useEffect, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";
import { useUpdateGoalProgress } from "@/hooks/trainerize/useGoals";
import type { TextGoal } from "@/types/trainerize/goals_types";

/**
 * Update-progress dialog. Surfaced ONLY on textGoal cards — doc says progress
 * is "typically text goals" (§2 in `goals_clarification.md`). Once backend
 * confirms semantics for weight/nutrition we can lift this restriction.
 *
 * Validates: 0 ≤ progress ≤ 100 (we interpret as a percentage; backend may
 * accept other ranges but the doc gives no constraint).
 */

export interface UpdateProgressDialogProps {
  goal: TextGoal | null;
  onClose: () => void;
}

export default function UpdateProgressDialog({
  goal,
  onClose,
}: UpdateProgressDialogProps) {
  const update = useUpdateGoalProgress();
  const open = goal != null;
  const [value, setValue] = useState("");

  useEffect(() => {
    if (goal) {
      setValue(
        typeof goal.progress === "number" && Number.isFinite(goal.progress)
          ? String(goal.progress)
          : "",
      );
    }
  }, [goal]);

  const handleSave = async () => {
    if (!goal) return;
    const trimmed = value.trim();
    if (trimmed === "") {
      toast({ title: "Enter a progress value", description: "0–100." });
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      toast({
        title: "Invalid progress",
        description: "Progress must be a number between 0 and 100.",
      });
      return;
    }
    try {
      await update.mutateAsync({ goalId: goal.id, progress: n });
      toast({
        title: "Progress saved",
        description: `${n}%`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't save progress",
        description:
          (err as { message?: string } | undefined)?.message ??
          "Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Update progress
          </DialogTitle>
        </DialogHeader>

        {goal && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{goal.text || "Goal"}</p>
            <div className="space-y-2">
              <Label htmlFor="progress-value">Progress (%)</Label>
              <Input
                id="progress-value"
                type="number"
                min="0"
                max="100"
                step="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={update.isPending}
            className="gap-2"
          >
            {update.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4" />
            )}
            Save progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
