import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createGoal,
  deleteGoal,
  getGoalDetail,
  listGoals,
  updateGoal,
  updateGoalProgress,
} from "@/api/trainerize/goals";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  CreateGoalPayload,
  DeleteGoalPayload,
  UpdateGoalPayload,
  UpdateGoalProgressPayload,
} from "@/types/trainerize/goals_types";

/**
 * Trainerize goals — list / detail / create / update / progress / delete.
 *
 * `useUpdateGoal` is exported but not wired to UI yet (doc gap §1 in
 * `goals_clarification.md`: PUT body has no `id` field to target a specific
 * goal when the user has multiple of the same type). Hook ships so the wiring
 * is one line once backend clarifies.
 */

const GOALS_PAGE_SIZE = 25;

export function useGoals(
  achieved?: boolean,
  start = 0,
  count = GOALS_PAGE_SIZE,
) {
  return useQuery({
    queryKey: queryKeys.trainerize.goals(achieved, start, count),
    queryFn: () =>
      listGoals(
        typeof achieved === "boolean"
          ? { achieved, start, count }
          : { start, count },
      ),
    staleTime: 30 * 1000,
  });
}

export function useGoalDetail(goalId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.trainerize.goal(goalId ?? 0),
    queryFn: () => getGoalDetail({ goalId: goalId as number }),
    enabled: typeof goalId === "number" && goalId > 0,
    staleTime: 30 * 1000,
  });
}

function invalidateGoals(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["trainerize", "goals"] });
  qc.invalidateQueries({ queryKey: ["trainerize", "goal"] });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => createGoal(payload),
    onSuccess: () => invalidateGoals(qc),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateGoalPayload) => updateGoal(payload),
    onSuccess: () => invalidateGoals(qc),
  });
}

export function useUpdateGoalProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateGoalProgressPayload) =>
      updateGoalProgress(payload),
    onSuccess: () => invalidateGoals(qc),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteGoalPayload) => deleteGoal(payload),
    onSuccess: () => invalidateGoals(qc),
  });
}
