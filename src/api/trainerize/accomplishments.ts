import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  AccomplishmentStatsResult,
  GetAccomplishmentStatsParams,
} from "@/types/trainerize/accomplishments_types";

/**
 * Trainerize accomplishment stats (personal records / bests).
 * See `docs/accomplishments-stats-api.md`.
 *
 * Proxies `POST /v03/accomplishment/getStatsList` for the linked client only —
 * the backend injects the Trainerize `userID`, so never send it. Returns
 * `{ stats[], total }`; use `unwrap` (not `unwrapArray`) so `total` survives
 * for pagination.
 *
 * Callers must hold a Trainerize link; the upstream returns `404` otherwise.
 */

const STATS = "/api/trainerize/me/accomplishments/stats";

export async function getAccomplishmentStats(
  params: GetAccomplishmentStatsParams = {},
): Promise<AccomplishmentStatsResult> {
  const res = await axiosService.get<Envelope<AccomplishmentStatsResult>>(
    STATS,
    { params },
  );
  const data = unwrap<AccomplishmentStatsResult | null>(res.data);
  if (!data) return { stats: [], total: 0 };
  return { stats: data.stats ?? [], total: data.total ?? 0 };
}
