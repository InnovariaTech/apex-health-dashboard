// @ts-nocheck
import { Loader2, Trash2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useDeleteCustomFood } from "@/hooks/trainerize/useNutrition";
import type { CustomFood } from "@/types/trainerize/nutrition_types";

/**
 * Delete confirm — cautious copy per response doc §11 (cascade unverified).
 * Only ever opened on `type === "custom"` foods; system foods are read-only.
 */

export interface DeleteCustomFoodDialogProps {
  food: CustomFood | null;
  onClose: () => void;
}

export default function DeleteCustomFoodDialog({
  food,
  onClose,
}: DeleteCustomFoodDialogProps) {
  const del = useDeleteCustomFood();
  const open = food != null;

  const handleDelete = async () => {
    if (!food) return;
    try {
      await del.mutateAsync({ foodId: food.foodId });
      toast({
        title: "Food deleted",
        description: food.name ?? `Food #${food.foodId}`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't delete food",
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
            Delete this food?
          </DialogTitle>
        </DialogHeader>

        {food && (
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-semibold">{food.name ?? `Food #${food.foodId}`}</span>
            </p>
            <div className="flex items-start gap-2 text-xs text-muted-foreground border border-amber-300 bg-amber-50 rounded-sm p-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>
                Deleting this food may affect historical day logs that
                referenced it. This can't be undone.
              </span>
            </div>
          </div>
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
