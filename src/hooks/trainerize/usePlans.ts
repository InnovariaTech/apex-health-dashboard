import { useQuery } from "@tanstack/react-query";
import {
  listPrograms,
  listTrainingPlans,
  listWorkoutDefs,
} from "@/api/trainerize/plans";
import { queryKeys } from "@/hooks/queryKeys";

const FIVE_MIN = 5 * 60 * 1000;

export function useTrainingPlans() {
  return useQuery({
    queryKey: queryKeys.trainerize.trainingPlans(),
    queryFn: listTrainingPlans,
    staleTime: FIVE_MIN,
  });
}

export function useTrainerizePrograms() {
  return useQuery({
    queryKey: queryKeys.trainerize.programs(),
    queryFn: listPrograms,
    staleTime: FIVE_MIN,
  });
}

export function useWorkoutDefs(
  planId: number | undefined,
  opts: { searchTerm?: string; start?: number; count?: number } = {},
) {
  const { searchTerm = "", start = 0, count = 10 } = opts;
  return useQuery({
    queryKey: queryKeys.trainerize.workoutDefs(
      planId ?? 0,
      searchTerm,
      start,
      count,
    ),
    queryFn: () =>
      listWorkoutDefs({
        planId: planId as number,
        ...(searchTerm ? { searchTerm } : {}),
        start,
        count,
      }),
    enabled: typeof planId === "number" && planId > 0,
    staleTime: 60 * 1000,
  });
}
