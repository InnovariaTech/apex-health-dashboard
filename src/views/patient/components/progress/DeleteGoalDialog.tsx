// @ts-nocheck
import { Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useDeleteGoal } from "@/hooks/trainerize/useGoals";
import {
  GOAL_TYPE_LABELS,
  type Goal,
} from "@/types/trainerize/goals_types";

/**
 * Delete-goal confirmation. Single confirmation, no soft state.
 * Sends `DELETE /api/trainerize/me/goals` with `{goalId}` JSON body per
 * `docs/trainerize/goals/goal-delete.md`. Gateway compatibility (DELETE with
 * body) is tracked in §10 of `goals_clarification.md` — no FE workaround here.
 */

export interface DeleteGoalDialogProps {
  goal: Goal | null;
  onClose: () => void;
}

export default function DeleteGoalDialog({ goal, onClose }: DeleteGoalDialogProps) {
  const del = useDeleteGoal();
  const open = goal != null;

  const handleDelete = async () => {
    if (!goal) return;
    try {
      await del.mutateAsync({ goalId: goal.id });
      toast({
        title: "Goal deleted",
        description: GOAL_TYPE_LABELS[goal.type] ?? "Goal removed.",
      });
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't delete goal",
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
            <Trash2 className="w-5 h-5 text-destructive" />
            Delete this goal?
          </DialogTitle>
        </DialogHeader>

        {goal && (
          <p className="text-sm text-muted-foreground">
            {GOAL_TYPE_LABELS[goal.type] ?? "Goal"} —{" "}
            {goal.type === "textGoal" && (goal as any).text
              ? `"${(goal as any).text}"`
              : `id ${goal.id}`}
            <br />
            This can't be undone.
          </p>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={del.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={del.isPending}
            className="gap-2"
          >
            {del.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
