/**
 * Trainerize daily workouts — `/api/trainerize/me/daily-workouts`
 * and `/api/trainerize/me/daily-workouts/query`.
 * See `docs/trainerize/client-apis.md` Phase 4 (Daily Workouts).
 *
 * Create: `id: 0`. Update: existing id. Same shape for both.
 */
import type { WeightUnit, DistanceUnit } from "./linkage_types";

export type WorkoutType = "strength" | "cardio" | string;
export type WorkoutStatus = "completed" | "scheduled" | string;
export type WorkoutStyle = "regular" | "circuit" | "interval" | string;

export interface WorkoutComment {
  comment?: string;
  rpe?: number;
}

export interface WorkoutTrackingStats {
  stats?: {
    maxHeartRate?: number;
    avgHeartRate?: number;
    calories?: number;
    activeCalories?: number;
  };
}

export interface ExerciseSetStat {
  setID: number;
  reps?: number;
  weight?: number;
  distance?: number;
  time?: number;
  calories?: number;
  speed?: number;
  level?: number;
}

export interface DailyWorkoutExercise {
  /** `0` to create, existing id to update. */
  dailyExerciseID: number;
  def: {
    id: number;
    name?: string;
    description?: string;
  };
  sets?: number;
  target?: string;
  targetDetail?: string;
  side?: string;
  restTime?: number;
  recordType?: string;
  type?: string;
  stats?: ExerciseSetStat[];
}

export interface DailyWorkout {
  /** `0` to create, existing id to update. */
  id: number;
  name: string;
  date: string;
  type: WorkoutType;
  status: WorkoutStatus;
  style: WorkoutStyle;
  exercises: DailyWorkoutExercise[];
  startTime?: string;
  endTime?: string;
  workoutDuration?: number;
  instructions?: string;
  hasOverride?: boolean;
  intervalProgress?: number;
  rounds?: number;
  comments?: WorkoutComment;
  trackingStats?: WorkoutTrackingStats;
  [key: string]: unknown;
}

/** `POST /me/daily-workouts/query` body. */
export interface QueryDailyWorkoutsPayload {
  dailyWorkoutIds: number[];
}

/** `POST /me/daily-workouts` body. */
export interface UpsertDailyWorkoutsPayload {
  unitWeight?: WeightUnit;
  unitDistance?: DistanceUnit;
  /** min length 1 */
  dailyWorkouts: DailyWorkout[];
}
