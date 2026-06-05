import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createHabit,
  deleteDailyItem,
  getDailyItem,
  listHabits,
  trackDailyItem,
} from "@/api/trainerize/habits";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  CreateHabitPayload,
  DeleteDailyItemPayload,
  HabitStatusFilter,
  TrackDailyItemPayload,
} from "@/types/trainerize/habits_types";

const DEFAULT_STATUS: HabitStatusFilter = "current";
const HABITS_PAGE_SIZE = 25;

export function useHabits(
  status: HabitStatusFilter = DEFAULT_STATUS,
  start = 0,
  count = HABITS_PAGE_SIZE,
) {
  return useQuery({
    queryKey: queryKeys.trainerize.habits(status, start, count),
    queryFn: () => listHabits({ status, start, count }),
    staleTime: 30 * 1000,
  });
}

export function useDailyItem(dailyItemId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.trainerize.dailyItem(dailyItemId ?? 0),
    queryFn: () => getDailyItem({ dailyItemId: dailyItemId as number }),
    enabled: typeof dailyItemId === "number" && dailyItemId > 0,
    staleTime: 30 * 1000,
  });
}

function invalidateHabits(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["trainerize", "habits"] });
  qc.invalidateQueries({ queryKey: ["trainerize", "daily-item"] });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHabitPayload) => createHabit(payload),
    onSuccess: () => invalidateHabits(qc),
  });
}

export function useTrackDailyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TrackDailyItemPayload) => trackDailyItem(payload),
    onSuccess: () => invalidateHabits(qc),
  });
}

export function useDeleteDailyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteDailyItemPayload) => deleteDailyItem(payload),
    onSuccess: () => invalidateHabits(qc),
  });
}
