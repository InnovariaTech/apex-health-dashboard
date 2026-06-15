/**
 * Trainerize goals — backs `src/api/trainerize/goals.ts`.
 * See `docs/trainerize/goals/` (README + per-endpoint docs) and the resolution
 * doc `docs/trainerize/goals/goals-issue-responses.md`.
 *
 * Wire contract is a discriminated union on `type`:
 *   - textGoal       → free-text goal with optional progress
 *   - weightGoal     → weight target, start/current/weekly rate, activity level
 *   - nutritionGoal  → caloric + macro targets, tracking source
 *
 * Resolved (responses doc):
 *   §1  PUT /goals updates by `type` (one slot per type), not by `goalId`.
 *       Edit dialog is live; warns when multiple goals share a type.
 *   §2  PUT /goals/progress is text-only — UI gates by type.
 *   §3  `achieved` is read-only — no manual "Mark achieved" write path.
 *       Text goals flip via progress=100; weight via bodystats crossing target.
 *   §6  nutritionGoal — Strategy A (calories + percents only, sum to 100).
 *   §7  weightGoal — `type + unitWeight + weightGoal` required at minimum.
 *
 * Still partial / open:
 *   §8  Cap on goals per type unknown — no hard gate; surface upstream errors.
 *   §9  `progress` on read tolerated as optional — Trainerize may or may not
 *       echo it back; UI shows last known value when absent.
 *   §10 DELETE-with-body — Fastify supports it; gateway pass-through unverified.
 */

// ─── Enums ────────────────────────────────────────────────────────────────

export type GoalType = "textGoal" | "weightGoal" | "nutritionGoal";

export const GOAL_TYPE_VALUES: GoalType[] = [
  "textGoal",
  "weightGoal",
  "nutritionGoal",
];

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  textGoal: "Text goal",
  weightGoal: "Weight goal",
  nutritionGoal: "Nutrition goal",
};

export type ClientActiveLevel =
  | "sedentary"
  | "lightlyActive"
  | "moderatelyActive"
  | "veryActive"
  | "extraActive";

export const CLIENT_ACTIVE_LEVEL_VALUES: ClientActiveLevel[] = [
  "sedentary",
  "lightlyActive",
  "moderatelyActive",
  "veryActive",
  "extraActive",
];

export const CLIENT_ACTIVE_LEVEL_LABELS: Record<ClientActiveLevel, string> = {
  sedentary: "Sedentary",
  lightlyActive: "Lightly active",
  moderatelyActive: "Moderately active",
  veryActive: "Very active",
  extraActive: "Extra active",
};

export type NutritionTrackingType =
  | "noTracking"
  | "trackWithMFP"
  | "trackWithFitbit";

export const NUTRITION_TRACKING_VALUES: NutritionTrackingType[] = [
  "noTracking",
  "trackWithMFP",
  "trackWithFitbit",
];

export const NUTRITION_TRACKING_LABELS: Record<NutritionTrackingType, string> = {
  noTracking: "No tracking",
  trackWithMFP: "MyFitnessPal",
  trackWithFitbit: "Fitbit",
};

// ─── Goal shapes (discriminated union) ────────────────────────────────────

interface GoalBase {
  id: number;
  type: GoalType;
  achieved: boolean;
  /**
   * Doc §9: not in sample responses but may surface from `goals/progress`
   * writes. Read-tolerant; UI only renders when present and numeric.
   */
  progress?: number;
}

export interface TextGoal extends GoalBase {
  type: "textGoal";
  text?: string;
}

export interface WeightGoal extends GoalBase {
  type: "weightGoal";
  unitWeight?: string;
  weightGoal?: number;
  weeklyWeightGoal?: number;
  clientActiveLevel?: ClientActiveLevel;
  startDate?: string;
  startWeight?: number;
  currentWeight?: number;
}

export interface NutritionGoal extends GoalBase {
  type: "nutritionGoal";
  trackingType?: NutritionTrackingType;
  caloricGoal?: number;
  carbsGrams?: number;
  carbsPercent?: number;
  proteinGrams?: number;
  proteinPercent?: number;
  fatGrams?: number;
  fatPercent?: number;
}

export type Goal = TextGoal | WeightGoal | NutritionGoal;

// ─── Type predicates ──────────────────────────────────────────────────────

export function isTextGoal(g: Goal): g is TextGoal {
  return g.type === "textGoal";
}

export function isWeightGoal(g: Goal): g is WeightGoal {
  return g.type === "weightGoal";
}

export function isNutritionGoal(g: Goal): g is NutritionGoal {
  return g.type === "nutritionGoal";
}

// ─── Query params ─────────────────────────────────────────────────────────

export interface ListGoalsParams {
  unitWeight?: string;
  achieved?: boolean;
  start?: number;
  count?: number;
}

export interface GoalDetailParams {
  goalId: number;
  unitWeight?: string;
  achieved?: boolean;
}

// ─── List response ────────────────────────────────────────────────────────

export interface ListGoalsResult {
  total: number;
  goals: Goal[];
}

// ─── Create/Update payloads (discriminated on `type`) ─────────────────────

export interface CreateTextGoalPayload {
  type: "textGoal";
  text?: string;
}

export interface CreateWeightGoalPayload {
  type: "weightGoal";
  unitWeight?: string;
  weightGoal?: number;
  weeklyWeightGoal?: number;
  clientActiveLevel?: ClientActiveLevel;
  startDate?: string;
  startWeight?: number;
  currentWeight?: number;
}

export interface CreateNutritionGoalPayload {
  type: "nutritionGoal";
  trackingType?: NutritionTrackingType;
  caloricGoal?: number;
  carbsGrams?: number;
  carbsPercent?: number;
  proteinGrams?: number;
  proteinPercent?: number;
  fatGrams?: number;
  fatPercent?: number;
}

export type CreateGoalPayload =
  | CreateTextGoalPayload
  | CreateWeightGoalPayload
  | CreateNutritionGoalPayload;

/**
 * §1 (resolved): PUT /goals shares the POST body shape — no `goalId` on wire.
 * Updates the type-level slot. Send the full target set you want active.
 */
export type UpdateGoalPayload = CreateGoalPayload;

export interface CreateGoalResult {
  id: number;
  [key: string]: unknown;
}

export interface UpdateGoalResult {
  code?: number;
  message?: string;
  [key: string]: unknown;
}

// ─── Progress ─────────────────────────────────────────────────────────────

export interface UpdateGoalProgressPayload {
  goalId: number;
  /** Doc says "e.g. percentage" — semantics confirmed only for textGoal (§2). */
  progress?: number;
}

export interface UpdateGoalProgressResult {
  code?: number;
  message?: string;
  [key: string]: unknown;
}

// ─── Delete ───────────────────────────────────────────────────────────────

export interface DeleteGoalPayload {
  goalId: number;
}
