import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, unwrapNullable, type Envelope } from "./_envelope";
import type {
  TrainerizeLink,
  TrainerizeProfile,
  TrainerizeSettings,
} from "@/types/trainerize/linkage_types";

/**
 * Trainerize linkage / profile / settings. See
 * `docs/trainerize/client-apis.md` Phase 1 and
 * `docs/trainerize/CLIENT_DASHBOARD_INTEGRATION.md` Section 1.
 *
 * `/me/link` and `/me/profile` can return `data: null` when the user has no
 * Trainerize account linked — use `unwrapNullable`. `/me/settings` always
 * returns data when called for a linked user.
 */

const BASE = "/api/trainerize/me";

export async function getLink(): Promise<TrainerizeLink | null> {
  const res = await axiosService.get<Envelope<TrainerizeLink>>(`${BASE}/link`);
  return unwrapNullable<TrainerizeLink>(res.data);
}

export async function getProfile(): Promise<TrainerizeProfile | null> {
  const res = await axiosService.get<Envelope<TrainerizeProfile>>(
    `${BASE}/profile`,
  );
  return unwrapNullable<TrainerizeProfile>(res.data);
}

export async function getSettings(): Promise<TrainerizeSettings> {
  const res = await axiosService.get<Envelope<TrainerizeSettings>>(
    `${BASE}/settings`,
  );
  return unwrap<TrainerizeSettings>(res.data);
}
