/**
 * Trainerize daily cardio — `/api/trainerize/me/daily-cardio` (POST/GET/PUT).
 * See `docs/trainerize/client-apis.md` Phase 4.
 */
import type { DistanceUnit } from "./linkage_types";

export type CardioTarget = "distance" | "time" | "calories" | string;

export interface CardioTargetDetail {
  type?: number;
  distance?: number;
  distanceUnit?: DistanceUnit;
  time?: number;
  text?: string;
  zone?: number;
  unitDistance?: DistanceUnit;
}

/** `POST /me/daily-cardio` body. */
export interface CreateCardioPayload {
  exerciseId: number;
  date: string;
  target?: CardioTarget;
  targetDetail?: CardioTargetDetail;
  /** e.g. "manual" */
  from?: string;
}

/** `POST /me/daily-cardio` response — id becomes `dailyCardioId`. */
export interface CardioSession {
  id: number;
  name?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  workDuration?: number;
  status?: string;
  distance?: number;
  time?: number;
  calories?: number;
  activeCalories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  notes?: string;
  comments?: Array<{ comment?: string; rpe?: number }>;
  [key: string]: unknown;
}

export interface GetCardioParams {
  dailyCardioId: number;
  unitDistance?: DistanceUnit;
}

/** `PUT /me/daily-cardio` — all fields except `dailyCardioId` optional. */
export interface UpdateCardioPayload {
  dailyCardioId: number;
  name?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  workDuration?: number;
  target?: CardioTarget;
  targetDetail?: CardioTargetDetail;
  notes?: string;
  status?: string;
  unitDistance?: DistanceUnit;
  distance?: number;
  time?: number;
  calories?: number;
  activeCalories?: number;
  level?: number;
  speed?: number;
  maxHeartRate?: number;
  avgHeartRate?: number;
  location?: string;
  comments?: Array<{ comment: string; rpe: number }>;
}
