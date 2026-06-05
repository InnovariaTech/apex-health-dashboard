import { axiosService } from "@/api/http/axiosInstance";
import { unwrapArray, type Envelope } from "./_envelope";
import type {
  TrainingPlan,
  TrainerizeProgram,
  WorkoutDef,
  ListWorkoutDefsParams,
} from "@/types/trainerize/plan_types";

/**
 * Training plans, programs, and workout definitions.
 * See `docs/trainerize/client-apis.md` Phase 2.
 *
 * `workout-defs` is plan-scoped — pass the `planId` from `/me/training-plans`.
 * Offset/count pagination: increment `start` by `count`, stop when the
 * returned page is shorter than `count`.
 *
 * Uses `unwrapArray` defensively — upstream wraps arrays in objects.
 */

const BASE = "/api/trainerize/me";

export async function listTrainingPlans(): Promise<TrainingPlan[]> {
  const res = await axiosService.get<Envelope<TrainingPlan[]>>(
    `${BASE}/training-plans`,
  );
  return unwrapArray<TrainingPlan>(res.data);
}

export async function listPrograms(): Promise<TrainerizeProgram[]> {
  const res = await axiosService.get<Envelope<TrainerizeProgram[]>>(
    `${BASE}/programs`,
  );
  return unwrapArray<TrainerizeProgram>(res.data);
}

export async function listWorkoutDefs(
  params: ListWorkoutDefsParams,
): Promise<WorkoutDef[]> {
  const res = await axiosService.get<Envelope<WorkoutDef[]>>(
    `${BASE}/workout-defs`,
    { params },
  );
  return unwrapArray<WorkoutDef>(res.data);
}
