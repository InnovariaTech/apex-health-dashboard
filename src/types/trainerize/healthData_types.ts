/**
 * Trainerize health data — wearable-synced metrics.
 * See `docs/trainerize/health-data-apis.md`.
 *
 * Two endpoints feed this type set:
 *   - `GET /me/health-data`        → general daily metrics (one `type` per call)
 *   - `GET /me/health-data/sleep`  → sleep segments over a datetime range
 *
 * Read-only — the backend injects the linked client's Trainerize `userID`.
 * `isTracked: false` means the metric is not actively synced (no wearable
 * connected, or that metric type disabled in Health Connect / Apple Health);
 * `healthData` is still a valid array (typically empty) — render an empty
 * state, not an error.
 */

export type HealthDataType =
  | "step"
  | "restingHeartRate"
  | "sleep"
  | "bloodPressure"
  | "calorieOut";

/** Per-day entry on `/me/health-data`. `data` carries only the type-specific keys. */
export interface HealthDataEntry {
  healthDataID: number;
  type: HealthDataType;
  /** `YYYY-MM-DD`. */
  date: string;
  data: {
    steps?: number;
    restingHeartRate?: number;
    systolic?: number;
    diastolic?: number;
    /** kcal — typically a basal resting-energy estimate. */
    restingEnergy?: number;
    /** kcal — workout / movement burn. */
    activeEnergy?: number;
  };
}

export interface HealthDataResponse {
  isTracked: boolean;
  healthData: HealthDataEntry[];
}

export interface GetHealthDataParams {
  type: HealthDataType;
  /** `YYYY-MM-DD`. */
  startDate?: string;
  /** `YYYY-MM-DD`. */
  endDate?: string;
}

/**
 * Sleep segments — one row per asleep window. A single night can span
 * multiple segments (interrupted sleep); the doc instructs callers to sum
 * `(endTime - startTime)` per local night for a nightly total.
 */
export interface HealthDataSleepEntry {
  /** `YYYY-MM-DD HH:MM:SS`. */
  startTime: string;
  /** `YYYY-MM-DD HH:MM:SS`. */
  endTime: string;
  /** Sleep stage / state, e.g. `"asleep"`. */
  type: string;
}

export interface HealthDataSleepResponse {
  isTracked: boolean;
  healthData: HealthDataSleepEntry[];
}

export interface GetSleepDataParams {
  /** `YYYY-MM-DD HH:MM:SS`. */
  startTime?: string;
  /** `YYYY-MM-DD HH:MM:SS`. */
  endTime?: string;
}
