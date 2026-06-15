import { useQuery } from "@tanstack/react-query";
import { getMealPlan } from "@/api/trainerize/mealPlan";
import { queryKeys } from "@/hooks/queryKeys";

/**
 * `GET /me/meal-plan`. Without an id, returns the linked client's assigned
 * plan or `null` if none is assigned (the page renders an empty state).
 *
 * 5-minute staleTime — meal plans change rarely (coach-driven or via
 * `POST /me/meal-plan/generate`).
 */
export function useMealPlan(mealPlanId?: number) {
  return useQuery({
    queryKey: queryKeys.trainerize.mealPlan(mealPlanId),
    queryFn: () =>
      getMealPlan(typeof mealPlanId === "number" ? { mealPlanId } : {}),
    staleTime: 5 * 60 * 1000,
  });
}
