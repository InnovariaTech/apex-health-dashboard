import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  queryDailyWorkouts,
  upsertDailyWorkouts,
} from "@/api/trainerize/workouts";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  UpsertDailyWorkoutsPayload,
} from "@/types/trainerize/workout_types";

/**
 * Daily workouts — query by IDs from the calendar, upsert with `id: 0`
 * to create or existing ID to update. The query is treated as a normal
 * cached `useQuery` even though the underlying call is a POST (the IDs
 * form the cache key).
 */

export function useDailyWorkouts(dailyWorkoutIds: number[] | undefined) {
  const ids = dailyWorkoutIds ?? [];
  return useQuery({
    queryKey: queryKeys.trainerize.dailyWorkouts(ids),
    queryFn: () => queryDailyWorkouts({ dailyWorkoutIds: ids }),
    enabled: ids.length > 0,
    staleTime: 30 * 1000,
  });
}

export function useUpsertDailyWorkouts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertDailyWorkoutsPayload) =>
      upsertDailyWorkouts(payload),
    onSuccess: () => {
      // A completed workout changes calendar status and detail caches.
      queryClient.invalidateQueries({ queryKey: ["trainerize", "calendar"] });
      queryClient.invalidateQueries({ queryKey: ["trainerize", "daily-workouts"] });
    },
  });
}
