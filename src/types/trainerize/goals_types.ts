/**
 * Trainerize goals — backs `src/api/trainerize/goals.ts`.
 * See `docs/trainerize/goals/` (README + per-endpoint docs).
 *
 * Wire contract is a discriminated union on `type`:
 *   - textGoal       → free-text goal with optional progress
 *   - weightGoal     → weight target, start/current/weekly rate, activity level
 *   - nutritionGoal  → caloric + macro targets, tracking source
 *
 * Doc gaps tracked in `docs/trainerize/goals/goals_clarification.md`:
 *   §1  PUT /goals body has no `id` — Edit affordance is held.
 *   §2  PUT /goals/progress may not apply to weight/nutrition — UI gates by type.
 *   §3  `achieved` write path is unclear — no "Mark achieved" UI for now.
 *   §6  nutritionGoal grams/percent validation is unconfirmed — lenient form.
 *   §7  weightGoal required fields are unconfirmed — lenient form.
 *   §9  `progress` field on read is undocumented — UI tolerates absence.
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
 * Doc §1: PUT /goals has no `id` in the documented body — the wire shape
 * matches add exactly. We keep them as separate aliases so the call sites
 * read clearly, but the type is intentionally identical.
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
