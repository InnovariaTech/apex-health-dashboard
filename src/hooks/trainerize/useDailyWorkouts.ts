import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  queryDailyWorkouts,
  scheduleDailyWorkout,
  upsertDailyWorkouts,
} from "@/api/trainerize/workouts";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  DailyWorkout,
  UpsertDailyWorkoutsPayload,
} from "@/types/trainerize/workout_types";
import type { ScheduleDailyWorkoutPayload } from "@/api/trainerize/workouts";

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

/**
 * "Add to today" — Flow 2 schedule step. Posts the minimal body, then
 * eagerly queries the new daily workout so the caller can open the session
 * UI immediately. Calendar and daily-workout caches are invalidated so the
 * Today tab reflects the new instance on next render.
 */
export function useScheduleWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: ScheduleDailyWorkoutPayload,
    ): Promise<DailyWorkout> => {
      const newId = await scheduleDailyWorkout(payload);
      const [dw] = await queryClient.fetchQuery({
        queryKey: queryKeys.trainerize.dailyWorkouts([newId]),
        queryFn: () => queryDailyWorkouts({ dailyWorkoutIds: [newId] }),
        staleTime: 0,
      });
      if (!dw) {
        throw new Error(
          "Scheduled the workout but couldn't load its session details.",
        );
      }
      return dw;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainerize", "calendar"] });
      queryClient.invalidateQueries({ queryKey: ["trainerize", "daily-workouts"] });
    },
  });
}
