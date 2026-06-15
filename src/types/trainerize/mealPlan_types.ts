/**
 * Trainerize meal-plan — `GET /api/trainerize/me/meal-plan`.
 *
 * See `docs/documents/workflows/workflow-meal-plans-and-nutrition.md`.
 *
 * Field list comes from the doc's "Response highlights" table. We don't have
 * a sampled live response yet, so the per-meal shape is intentionally loose
 * (`Record<string, unknown>` keys); when a real payload is observed we can
 * tighten `MealPlanMeal` without rewriting the API client / hook.
 */

/**
 * Plan source type — `planner`, `file`, `en` per doc, plus `flexiblemealplan`
 * observed on live responses but not documented. Anything else falls through
 * to the planner-style days-based render if `mealPlanDays[]` is present.
 */
export type MealPlanType =
  | "planner"
  | "file"
  | "en"
  | "flexiblemealplan"
  | string;

/** Macro split labels documented for planner-type plans. */
export type MealPlanMacroSplit =
  | "balanced"
  | "lowCarb"
  | "lowFat"
  | "highProtein"
  | string;

/**
 * Recipe media block — nested under each meal, same flavor as the workout
 * exercise media. Carries thumbnail and (when the recipe has a demo video)
 * an HLS stream.
 */
export interface MealPlanMedia {
  id?: number;
  /** Storage tier — observed: "awss3". */
  type?: string;
  /** "video" or "image" — drives whether `videoUrl` is populated. */
  mediaType?: string;
  status?: string;
  duration?: number;
  videoUrl?: {
    hls?: string | null;
    hlssd?: string | null;
    hlshd?: string | null;
  } | null;
  thumbnailUrl?: { hd?: string | null; sd?: string | null } | null;
  [key: string]: unknown;
}

/**
 * A single meal slot inside a `mealPlanDay`. Real upstream field names
 * (`mealName`, `caloriesSummary`, `proteinSummary`, etc.) live alongside
 * doc-style aliases (`name`, `calories`, `proteinGrams`) so the accessor
 * helpers below stay tolerant if Trainerize renames anything.
 */
export interface MealPlanMeal {
  /** Real upstream identifier for the recipe template. */
  mealTemplateId?: number;
  templateType?: string;
  multiplier?: number;
  /** Real upstream display name (e.g. "Breakfast Burrito (Balanced)"). */
  mealName?: string;
  mealTypes?: string[];
  caloriesSummary?: number;
  caloriesSummaryRaw?: number | null;
  carbsSummary?: number;
  proteinSummary?: number;
  fatSummary?: number;
  nutrients?: Array<{ nutrNo?: number; nutrVal?: number }>;
  macroSplit?: string;
  prepareTime?: number;
  cookTime?: number;
  recipeServingAmount?: number;
  isPublished?: boolean;
  isActive?: boolean;
  manualFoods?: unknown[] | null;
  isManual?: boolean;
  fileId?: number;
  media?: MealPlanMedia | null;

  /** Legacy / doc-aligned fallback names — keep accepting them. */
  name?: string;
  description?: string;
  calories?: number;
  carbsGrams?: number;
  proteinGrams?: number;
  fatGrams?: number;
  /** Recipes/foods within this meal — shape varies; render defensively. */
  recipes?: Array<Record<string, unknown>>;
  foods?: Array<Record<string, unknown>>;
  thumbnailUrl?: string;
  imageUrl?: string;

  [key: string]: unknown;
}

/** Display name — real `mealName`, fallback to legacy `name`. */
export function getMealName(meal: MealPlanMeal | null | undefined): string {
  if (!meal) return "(Unnamed)";
  return meal.mealName ?? meal.name ?? "(Unnamed)";
}

/** Calories — `caloriesSummary` then doc-style `calories`. */
export function getMealCalories(
  meal: MealPlanMeal | null | undefined,
): number | null {
  if (typeof meal?.caloriesSummary === "number") return meal.caloriesSummary;
  if (typeof meal?.calories === "number") return meal.calories;
  return null;
}

export function getMealProtein(
  meal: MealPlanMeal | null | undefined,
): number | null {
  if (typeof meal?.proteinSummary === "number") return meal.proteinSummary;
  if (typeof meal?.proteinGrams === "number") return meal.proteinGrams;
  return null;
}

export function getMealCarbs(
  meal: MealPlanMeal | null | undefined,
): number | null {
  if (typeof meal?.carbsSummary === "number") return meal.carbsSummary;
  if (typeof meal?.carbsGrams === "number") return meal.carbsGrams;
  return null;
}

export function getMealFat(
  meal: MealPlanMeal | null | undefined,
): number | null {
  if (typeof meal?.fatSummary === "number") return meal.fatSummary;
  if (typeof meal?.fatGrams === "number") return meal.fatGrams;
  return null;
}

/** Best-fit thumbnail — prefers `media.thumbnailUrl.sd`, then `hd`, then
 *  legacy flat `thumbnailUrl` / `imageUrl`. */
export function getMealThumbnail(
  meal: MealPlanMeal | null | undefined,
): string | null {
  const t = meal?.media?.thumbnailUrl;
  if (t?.sd) return t.sd;
  if (t?.hd) return t.hd;
  if (typeof meal?.thumbnailUrl === "string") return meal.thumbnailUrl;
  if (typeof meal?.imageUrl === "string") return meal.imageUrl;
  return null;
}

/**
 * One "day" entry in `mealPlanDays[]`. Day rotation: `day: 1, 2, 3…` cycled
 * by calendar day since plan start (see doc) — without a documented
 * `startDate`, callers fall back to "day 1" or a user-picked tab.
 *
 * Real upstream also adds `caloriesSummary` — the day's combined calorie
 * total across all slots — so the UI can show a per-day kcal pill.
 */
export interface MealPlanDay {
  day?: number;
  caloriesSummary?: number;
  breakfast?: MealPlanMeal | null;
  lunch?: MealPlanMeal | null;
  dinner?: MealPlanMeal | null;
  snack1?: MealPlanMeal | null;
  snack2?: MealPlanMeal | null;
  snack3?: MealPlanMeal | null;
  [key: string]: unknown;
}

/** PDF-type attachment block — only present when `mealPlanType === "file"`. */
export interface MealPlanAttachment {
  url?: string;
  token?: string;
  filename?: string;
  mimeType?: string;
  [key: string]: unknown;
}

/**
 * The full meal-plan response. Doc names the fields we surface in the UI;
 * `[key: string]: unknown` keeps the upstream's extra fields available
 * without forcing us to enumerate them up front.
 */
export interface MealPlan {
  id?: number;
  mealPlanName?: string;
  mealPlanType?: MealPlanType;
  caloriesTarget?: number;
  /** Older payloads sometimes use `caloricGoal` instead of `caloriesTarget`. */
  caloricGoal?: number;
  macroSplit?: MealPlanMacroSplit;
  /** Optional override when the user picked custom macro %s. */
  customMacroSplit?: {
    carbsPercent?: number;
    proteinPercent?: number;
    fatPercent?: number;
  } | null;
  mealsPerDay?: number;
  sampleDays?: number;
  /** Real upstream field — e.g. "vegan", "vegetarian", "keto". */
  dietaryPreference?: string;
  excludes?: string[];
  mealPlanDays?: MealPlanDay[];
  /** PDF source. */
  attachment?: MealPlanAttachment | null;
  /** Evolution Nutrition reference. */
  enMealPlanID?: string | number;
  [key: string]: unknown;
}

export interface GetMealPlanParams {
  mealPlanId?: number;
}

/** Slot keys that may exist on a `mealPlanDay`, in display order. */
export const MEAL_PLAN_SLOTS = [
  "breakfast",
  "lunch",
  "dinner",
  "snack1",
  "snack2",
  "snack3",
] as const;

export type MealPlanSlotKey = (typeof MEAL_PLAN_SLOTS)[number];

export const MEAL_PLAN_SLOT_LABELS: Record<MealPlanSlotKey, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack1: "Snack 1",
  snack2: "Snack 2",
  snack3: "Snack 3",
};

/**
 * Pull the meals out of a day in canonical display order. Returns only
 * slots that actually carry a meal so the UI doesn't render empty rows
 * for snack2/3 on plans that don't use them.
 */
export function mealsForDay(
  day: MealPlanDay | null | undefined,
): Array<{ slot: MealPlanSlotKey; meal: MealPlanMeal }> {
  if (!day) return [];
  const out: Array<{ slot: MealPlanSlotKey; meal: MealPlanMeal }> = [];
  for (const slot of MEAL_PLAN_SLOTS) {
    const meal = day[slot];
    if (meal && typeof meal === "object") {
      out.push({ slot, meal: meal as MealPlanMeal });
    }
  }
  return out;
}
