/**
 * Trainerize training plans, programs, and workout definitions.
 * See `docs/trainerize/client-apis.md` Phase 2.
 */

export type PlanDurationType =
  | "specificDate"
  | "week"
  | "month"
  | "notSpecified"
  | string;

export interface TrainingPlan {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  duration?: number | string;
  durationType?: PlanDurationType;
  [key: string]: unknown;
}

/** `GET /api/trainerize/me/programs` — trainer-created curricula. */
export interface TrainerizeProgram {
  id: number;
  name: string;
  [key: string]: unknown;
}

/** Workout definition inside a training plan. */
export interface WorkoutDef {
  id: number;
  name: string;
  exercises?: WorkoutDefExercise[];
  [key: string]: unknown;
}

export interface WorkoutDefExercise {
  id?: number;
  def?: {
    id: number;
    name?: string;
    description?: string;
  };
  sets?: number;
  target?: string;
  targetDetail?: string;
  restTime?: number;
  recordType?: string;
  [key: string]: unknown;
}

export interface ListWorkoutDefsParams {
  planId: number;
  searchTerm?: string;
  /** offset, default 0 */
  start?: number;
  /** page size, default 10 */
  count?: number;
}
