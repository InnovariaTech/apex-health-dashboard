import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  BodyStatsRecord,
  GetBodyStatsParams,
  CreateBodyStatsPayload,
  UpdateBodyStatsPayload,
  DeleteBodyStatsPayload,
} from "@/types/trainerize/bodystats_types";

/**
 * Trainerize body stats (per-date records).
 * See `docs/trainerize/client-apis.md` Phase 4 (Body Stats).
 *
 * Lifecycle for a new entry:
 *   1. POST /me/bodystats { date, status: "recorded" }  → create stub
 *   2. PUT  /me/bodystats { date, bodyMeasures, ... }   → save values
 */

const BASE = "/api/trainerize/me/bodystats";

export async function getBodyStats(
  params: GetBodyStatsParams,
): Promise<BodyStatsRecord> {
  const res = await axiosService.get<Envelope<BodyStatsRecord>>(BASE, {
    params,
  });
  return unwrap<BodyStatsRecord>(res.data);
}

export async function createBodyStats(
  payload: CreateBodyStatsPayload,
): Promise<BodyStatsRecord> {
  const res = await axiosService.post<Envelope<BodyStatsRecord>>(BASE, payload);
  return unwrap<BodyStatsRecord>(res.data);
}

export async function updateBodyStats(
  payload: UpdateBodyStatsPayload,
): Promise<BodyStatsRecord> {
  const res = await axiosService.put<Envelope<BodyStatsRecord>>(BASE, payload);
  return unwrap<BodyStatsRecord>(res.data);
}

export async function deleteBodyStats(
  payload: DeleteBodyStatsPayload,
): Promise<void> {
  await axiosService.delete<Envelope<null>>(BASE, { data: payload });
}
