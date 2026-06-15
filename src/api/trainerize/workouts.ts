import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, unwrapArray, type Envelope } from "./_envelope";
import type { WeightUnit, DistanceUnit } from "@/types/trainerize/linkage_types";
import type {
  DailyWorkout,
  QueryDailyWorkoutsPayload,
  UpsertDailyWorkoutsPayload,
} from "@/types/trainerize/workout_types";

/**
 * Trainerize daily workouts — query + upsert.
 * See `docs/trainerize/client-apis.md` Phase 4 and
 * `docs/trainerize/workouts/daily-workouts-flows.md` Flow 2.
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

/**
 * "Add to today" — Flow 2 step "Create today's instance".
 *
 * Posts the minimal `id: 0, status: "scheduled"` body and returns the new
 * `dailyWorkoutIDs[0]`. Do NOT send `exercises[]` here — Trainerize
 * materializes them on the next `query`. See the doc's "Add to today —
 * request body (verified)" section.
 */
export interface ScheduleDailyWorkoutPayload {
  workoutID: number;
  name: string;
  /** `YYYY-MM-DD` */
  date: string;
  unitWeight?: WeightUnit;
  unitDistance?: DistanceUnit;
}

export async function scheduleDailyWorkout(
  payload: ScheduleDailyWorkoutPayload,
): Promise<number> {
  const body = {
    ...(payload.unitWeight ? { unitWeight: payload.unitWeight } : {}),
    ...(payload.unitDistance ? { unitDistance: payload.unitDistance } : {}),
    dailyWorkouts: [
      {
        id: 0,
        workoutID: payload.workoutID,
        name: payload.name,
        date: payload.date,
        type: "workoutRegular",
        status: "scheduled",
        style: "normal",
      },
    ],
  };
  const res = await axiosService.post<Envelope<{ dailyWorkoutIDs?: number[] }>>(
    BASE,
    body,
  );
  const data = unwrap<{ dailyWorkoutIDs?: number[] } | null>(res.data);
  const newId = data?.dailyWorkoutIDs?.[0];
  if (typeof newId !== "number") {
    throw new Error(
      "Trainerize did not return a new daily workout id from schedule.",
    );
  }
  return newId;
}
