import { axiosService } from "@/api/http/axiosInstance";
import { unwrapArray, type Envelope } from "./_envelope";
import type {
  DailyWorkout,
  QueryDailyWorkoutsPayload,
  UpsertDailyWorkoutsPayload,
} from "@/types/trainerize/workout_types";

/**
 * Trainerize daily workouts — query + upsert.
 * See `docs/trainerize/client-apis.md` Phase 4 (Daily Workouts).
 *
 * `query` hydrates full details from `dailyWorkoutIds` returned by the
 * calendar endpoint. `upsert` creates (`id: 0`) or updates (existing id).
 *
 * Uses `unwrapArray` defensively — upstream wraps arrays in objects.
 */

const BASE = "/api/trainerize/me/daily-workouts";

export async function queryDailyWorkouts(
  payload: QueryDailyWorkoutsPayload,
): Promise<DailyWorkout[]> {
  const res = await axiosService.post<Envelope<DailyWorkout[]>>(
    `${BASE}/query`,
    payload,
  );
  return unwrapArray<DailyWorkout>(res.data);
}

export async function upsertDailyWorkouts(
  payload: UpsertDailyWorkoutsPayload,
): Promise<DailyWorkout[]> {
  const res = await axiosService.post<Envelope<DailyWorkout[]>>(BASE, payload);
  return unwrapArray<DailyWorkout>(res.data);
}
