import { useQueries, useQuery } from "@tanstack/react-query";
import {
  getHealthData,
  getSleepData,
} from "@/api/trainerize/healthData";
import { queryKeys } from "@/hooks/queryKeys";
import { useTrainerizeLink } from "./useLinkage";
import type {
  GetHealthDataParams,
  GetSleepDataParams,
  HealthDataResponse,
  HealthDataSleepResponse,
  HealthDataType,
} from "@/types/trainerize/healthData_types";

/**
 * Hooks for the wearable-synced `/me/health-data` endpoints.
 * See `docs/trainerize/health-data-apis.md`.
 *
 * Every hook is gated by `useTrainerizeLink` — the upstream returns `404`
 * when the user isn't linked, and the link query is already cached by other
 * Trainerize surfaces. `retry: false` because both transports have expected
 * empty cases (`isTracked: false`, or `404` pre-link) that we never want to
 * thrash.
 */

const ONE_MIN = 60 * 1000;

/**
 * Fetch one health metric type over a date range.
 *
 * Trainerize requires **one `type` per request** — for vitals dashboards
 * that need steps + RHR + BP, fan out via `useHealthDataMulti` instead.
 *
 * Range is optional per the API; omit `startDate`/`endDate` to let Trainerize
 * apply its default window. The cache key still segments by the literal
 * string `"all"` so omitting twice doesn't collide with an explicit range.
 */
export function useHealthData(params: GetHealthDataParams) {
  const linkQuery = useTrainerizeLink();
  const linked = !!linkQuery.data;
  return useQuery({
    queryKey: queryKeys.trainerize.healthData(
      params.type,
      params.startDate,
      params.endDate,
    ),
    queryFn: () => getHealthData(params),
    enabled: linked && !!params.type,
    staleTime: ONE_MIN,
    retry: false,
  });
}

/**
 * Fan out one query per metric type over the same date range — backs the
 * dashboard Vitals row and the Wearables page (steps + RHR + BP all share
 * the week window). React Query dedupes by key so repeating the same
 * `(type, range)` tuple across surfaces costs zero extra network.
 */
export function useHealthDataMulti(
  types: HealthDataType[],
  startDate?: string,
  endDate?: string,
) {
  const linkQuery = useTrainerizeLink();
  const linked = !!linkQuery.data;
  return useQueries({
    queries: types.map((type) => ({
      queryKey: queryKeys.trainerize.healthData(type, startDate, endDate),
      queryFn: () => {
        const params: GetHealthDataParams = { type };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return getHealthData(params);
      },
      enabled: linked,
      staleTime: ONE_MIN,
      retry: false,
    })),
  });
}

/**
 * Sleep segments over a datetime range. Range uses `YYYY-MM-DD HH:MM:SS`
 * (note the space, not `T`) — the API spec is explicit about that.
 */
export function useSleepData(params: GetSleepDataParams) {
  const linkQuery = useTrainerizeLink();
  const linked = !!linkQuery.data;
  return useQuery({
    queryKey: queryKeys.trainerize.healthDataSleep(
      params.startTime,
      params.endTime,
    ),
    queryFn: () => getSleepData(params),
    enabled: linked,
    staleTime: ONE_MIN,
    retry: false,
  });
}

/**
 * Sum sleep segments into per-local-night totals.
 *
 * One night can carry multiple segments (interrupted sleep); a segment that
 * crosses midnight is attributed to the night that ended on its `endTime`'s
 * local date — matches how wearables surface "last night's sleep" (the
 * morning you wake up). Returns a map keyed by `YYYY-MM-DD`.
 */
export function aggregateSleepByNight(
  data: HealthDataSleepResponse | undefined,
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!Array.isArray(data?.healthData)) return out;
  for (const seg of data.healthData) {
    const start = Date.parse(seg.startTime.replace(" ", "T"));
    const end = Date.parse(seg.endTime.replace(" ", "T"));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    const durationMs = end - start;
    // Attribute to the date you woke up on (end-of-segment local date).
    const wokeUpDate = new Date(end);
    const yyyy = wokeUpDate.getFullYear();
    const mm = String(wokeUpDate.getMonth() + 1).padStart(2, "0");
    const dd = String(wokeUpDate.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
    out[key] = (out[key] ?? 0) + durationMs;
  }
  return out;
}

/** Convenience: pull the `data.steps` for a single-day response. */
export function pickStepsForDate(
  data: HealthDataResponse | undefined,
  date: string,
): number | null {
  const row = data?.healthData?.find((e) => e.date === date);
  return typeof row?.data?.steps === "number" ? row.data.steps : null;
}

/** Convenience: latest non-null entry sorted by `date` descending. */
export function pickLatestEntry(
  data: HealthDataResponse | undefined,
) {
  if (!data?.healthData?.length) return null;
  const sorted = [...data.healthData].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
  );
  return sorted[0] ?? null;
}
