import { useQuery } from "@tanstack/react-query";
import { getAccomplishmentStats } from "@/api/trainerize/accomplishments";
import { queryKeys } from "@/hooks/queryKeys";
import { useTrainerizeLink } from "./useLinkage";
import type {
  AccomplishmentStatsCategory,
  GetAccomplishmentStatsParams,
} from "@/types/trainerize/accomplishments_types";

/**
 * Trainerize accomplishment stats (personal records / bests).
 * See `docs/accomplishments-stats-api.md`.
 *
 * Gated by `useTrainerizeLink` — the upstream returns `404` when the user
 * isn't linked, and the link query is already cached by other Trainerize
 * surfaces. `retry: false` so a pre-link `404` doesn't thrash.
 */

const THIRTY_SEC = 30 * 1000;
const DEFAULT_PAGE_SIZE = 25;

export function useAccomplishmentStats(
  category?: AccomplishmentStatsCategory,
  start = 0,
  count = DEFAULT_PAGE_SIZE,
) {
  const linkQuery = useTrainerizeLink();
  const linked = !!linkQuery.data;

  const params: GetAccomplishmentStatsParams = { start, count };
  if (category) params.category = category;

  return useQuery({
    queryKey: queryKeys.trainerize.accomplishmentStats(category, start, count),
    queryFn: () => getAccomplishmentStats(params),
    enabled: linked,
    staleTime: THIRTY_SEC,
    retry: false,
  });
}
