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
  const data = unwrap<HealthDataResponse>(res.data);
  // Upstream occasionally returns a non-array (or wrong shape) with HTTP 200;
  // force `healthData` to an array so every consumer's spread/`for…of` is safe.
  return {
    isTracked: Boolean(data?.isTracked),
    healthData: Array.isArray(data?.healthData) ? data.healthData : [],
  };
}

export async function getSleepData(
  params: GetSleepDataParams,
): Promise<HealthDataSleepResponse> {
  const res = await axiosService.get<Envelope<HealthDataSleepResponse>>(
    `${BASE}/sleep`,
    { params },
  );
  const data = unwrap<HealthDataSleepResponse>(res.data);
  return {
    isTracked: Boolean(data?.isTracked),
    healthData: Array.isArray(data?.healthData) ? data.healthData : [],
  };
}
