import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  GetHealthDataParams,
  GetSleepDataParams,
  HealthDataResponse,
  HealthDataSleepResponse,
} from "@/types/trainerize/healthData_types";

/**
 * Trainerize wearable-synced health data.
 * See `docs/trainerize/health-data-apis.md`.
 *
 * Both endpoints proxy through the Apex backend (which injects the linked
 * client's Trainerize `userID`). Callers must hold a Trainerize link;
 * otherwise the upstream returns `404`. Defer scheduling until
 * `useTrainerizeLink().data` is populated — same pattern as the other
 * `/me/*` hooks.
 */

const BASE = "/api/trainerize/me/health-data";

export async function getHealthData(
  params: GetHealthDataParams,
): Promise<HealthDataResponse> {
  const res = await axiosService.get<Envelope<HealthDataResponse>>(BASE, {
    params,
  });
  return unwrap<HealthDataResponse>(res.data);
}

export async function getSleepData(
  params: GetSleepDataParams,
): Promise<HealthDataSleepResponse> {
  const res = await axiosService.get<Envelope<HealthDataSleepResponse>>(
    `${BASE}/sleep`,
    { params },
  );
  return unwrap<HealthDataSleepResponse>(res.data);
}
