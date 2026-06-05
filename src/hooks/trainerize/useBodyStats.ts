import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBodyStats,
  deleteBodyStats,
  getBodyStats,
  updateBodyStats,
} from "@/api/trainerize/bodystats";
import { queryKeys } from "@/hooks/queryKeys";
import { useTrainerizeUnits } from "./useLinkage";
import type {
  CreateBodyStatsPayload,
  UpdateBodyStatsPayload,
  DeleteBodyStatsPayload,
  BodyStatsRecord,
} from "@/types/trainerize/bodystats_types";

/**
 * Body stats. Trainerize exposes only single-date GETs — `useBodyStatsRange`
 * fans out one query per date in parallel for trend charts.
 */

export function useBodyStats(date: string | undefined) {
  const { unitWeight, unitBodystat, isReady } = useTrainerizeUnits();
  return useQuery({
    queryKey: queryKeys.trainerize.bodyStats(date ?? "", unitWeight, unitBodystat),
    queryFn: () =>
      getBodyStats({
        date: date as string,
        unitWeight,
        unitBodystats: unitBodystat,
      }),
    enabled: isReady && !!date,
    staleTime: 60 * 1000,
    // 404 = "no record on this date" — don't retry it.
    retry: false,
  });
}

/**
 * Pull body stats for a list of dates in parallel — backs Progress charts.
 * `dates` should be an array of `YYYY-MM-DD`. Returns an array of query
 * results in the same order; callers can map to `[{date, record}]`.
 *
 * `retry: false` — Trainerize returns 404 ("Can't find the bodystats") for
 * any date the user hasn't logged. That's the expected empty case, not a
 * transient failure, so retrying 3× per missing date floods the server.
 */
export function useBodyStatsRange(dates: string[]) {
  const { unitWeight, unitBodystat, isReady } = useTrainerizeUnits();
  return useQueries({
    queries: dates.map((date) => ({
      queryKey: queryKeys.trainerize.bodyStats(date, unitWeight, unitBodystat),
      queryFn: () =>
        getBodyStats({
          date,
          unitWeight,
          unitBodystats: unitBodystat,
        }),
      enabled: isReady && !!date,
      staleTime: 60 * 1000,
      retry: false,
    })),
  });
}

function invalidateBodyStats(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["trainerize", "bodystats"] });
}

export function useCreateBodyStats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBodyStatsPayload) => createBodyStats(payload),
    onSuccess: () => invalidateBodyStats(queryClient),
  });
}

export function useUpdateBodyStats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBodyStatsPayload) => updateBodyStats(payload),
    onSuccess: (record: BodyStatsRecord) => {
      invalidateBodyStats(queryClient);
      // Seed the specific date's cache too — useBodyStats(date) returns
      // immediately on the next render.
      if (record?.date) {
        const { unitWeight, unitBodystats } = {
          unitWeight: (record as any).unitWeight ?? "lbs",
          unitBodystats: (record as any).unitBodystats ?? "inches",
        };
        queryClient.setQueryData(
          queryKeys.trainerize.bodyStats(record.date, unitWeight, unitBodystats),
          record,
        );
      }
    },
  });
}

export function useDeleteBodyStats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteBodyStatsPayload) => deleteBodyStats(payload),
    onSuccess: () => invalidateBodyStats(queryClient),
  });
}
