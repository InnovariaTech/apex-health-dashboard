/**
 * Trainerize nutrition — backs `src/api/trainerize/nutrition.ts`.
 * See `docs/trainerize/nutrition-photos-appointments-apis.md` and
 * `docs/trainerize/nutrition-issue-responses.md`.
 *
 * Coverage (read paths fully resolved):
 *   - List day summaries:        GET /me/nutrition/logs
 *   - Single-day detail:         GET /me/nutrition
 *   - Custom food library:       GET /me/nutrition/custom-foods
 *   - Add custom food:           POST   (single serving)
 *   - Update custom food:        PUT    (full shape, multi-serving)
 *   - Delete custom food:        DELETE (JSON body { foodId })
 *
 * Held — surfaced as UI copy, no FE write paths:
 *   §1  No documented endpoint to add/edit/delete a meal or food on a date.
 *   §10 No default range on logs — caller always sends an explicit window.
 *   §11 DELETE cascade unverified — confirm dialog uses cautious copy.
 */

// ─── Date formatting per §2 of the response doc ───────────────────────────

/**
 * `/nutrition/logs` requires `YYYY-MM-DD HH:MM:SS` (space-separated, no TZ).
 * `/nutrition` requires `YYYY-MM-DD`.
 * Helpers below produce both shapes; never mix.
 */
export function toLogsDateTime(date: Date | string, endOfDay = false): string {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return endOfDay
    ? `${yyyy}-${mm}-${dd} 23:59:59`
    : `${yyyy}-${mm}-${dd} 00:00:00`;
}

export function toDayKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Meal names (per response doc §3) ─────────────────────────────────────

export type MealName =
  | "breakfast"
  | "morningSnack"
  | "lunch"
  | "afternoonSnack"
  | "dinner"
  | "afterDinner"
  | "anytime"
  | string;

export const MEAL_NAME_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  morningSnack: "Morning snack",
  lunch: "Lunch",
  afternoonSnack: "Afternoon snack",
  dinner: "Dinner",
  afterDinner: "After dinner",
  anytime: "Anytime",
};

/** Stable display order — falls back to insertion order for unknowns. */
export const MEAL_ORDER: Record<string, number> = {
  breakfast: 0,
  morningSnack: 1,
  lunch: 2,
  afternoonSnack: 3,
  dinner: 4,
  afterDinner: 5,
  anytime: 6,
};

// ─── Food / serving (custom-foods + day-detail meal foods) ────────────────

export type FoodType = "custom" | "system" | string;
export type NutritionSource = "trainerize" | "mFP" | "fitbit" | string;

export const NUTRITION_SOURCE_LABELS: Record<string, string> = {
  trainerize: "Trainerize",
  mFP: "MyFitnessPal",
  fitbit: "Fitbit",
};

/** Per-meal food row (lives inside `meals[].foods[]` on /nutrition). */
export interface MealFood {
  name?: string;
  amount?: number;
  unit?: string;
  calories?: number;
  proteins?: number;
  carbs?: number;
  fat?: number;
  imageId?: number;
  type?: FoodType;
  convertedAmount?: number | null;
  convertedUnit?: string | null;
  [key: string]: unknown;
}

/** Nutrient row used inside servings on POST/PUT custom-foods. */
export interface NutrientRow {
  nutrNo: number;
  nutrVal: number;
}

/** Serving on a custom food. `weight` only valid on PUT (response doc §13). */
export interface Serving {
  name?: string;
  amount?: number;
  weight?: number;
  calories?: number;
  proteins?: number;
  carbs?: number;
  fat?: number;
  nutrients?: NutrientRow[];
  [key: string]: unknown;
}

export interface CustomFood {
  foodId: number;
  type: FoodType;
  name?: string;
  imageId?: number;
  userId?: number | null;
  groupId?: number | null;
  sampleServing?: Serving;
  serving?: Serving[];
  barcode?: string;
  [key: string]: unknown;
}

// ─── Daily nutrition (logs + detail) ──────────────────────────────────────

export interface NutritionGoalSnapshot {
  nutritionDeviation?: number;
  caloricGoal?: number;
  carbsGrams?: number;
  proteinGrams?: number;
  fatGrams?: number;
  [key: string]: unknown;
}

/** Meal summary on the list endpoint (no foods). */
export interface NutritionMealSummary {
  name?: MealName;
  mealGuid?: string;
  mealTime?: string;
  description?: string;
  hasImage?: boolean;
  modifiedAt?: string;
  caloriesSummary?: number;
  proteinSummary?: number;
  fatSummary?: number;
  carbsSummary?: number;
  proteinPercent?: number;
  carbsPercent?: number;
  fatPercent?: number;
  [key: string]: unknown;
}

/** Meal on the detail endpoint — same as summary but with `foods[]`. */
export interface NutritionMeal extends NutritionMealSummary {
  foods?: MealFood[];
}

/** One day on `/nutrition/logs`. */
export interface NutritionLogEntry {
  id: number;
  date: string;
  source?: NutritionSource;
  calories?: number;
  carbsGrams?: number;
  carbsPercent?: number;
  proteinGrams?: number;
  proteinPercent?: number;
  fatGrams?: number;
  fatPercent?: number;
  fiberGrams?: number;
  sodiumGrams?: number;
  sugarGrams?: number;
  meals?: NutritionMealSummary[];
  goal?: NutritionGoalSnapshot;
  mealPhoto?: { id?: number };
  [key: string]: unknown;
}

/** Single-day detail from `/nutrition`. */
export interface NutritionDay {
  id?: number;
  date?: string;
  numberOfComments?: number;
  source?: NutritionSource;
  calories?: number;
  carbsGrams?: number;
  carbsPercent?: number;
  proteinGrams?: number;
  proteinPercent?: number;
  fatGrams?: number;
  fatPercent?: number;
  fiberGrams?: number;
  sodiumGrams?: number;
  sugarGrams?: number;
  nutrients?: NutrientRow[];
  meals?: NutritionMeal[];
  goal?: NutritionGoalSnapshot;
  mealPhoto?: { id?: number };
  [key: string]: unknown;
}

// ─── Query params ─────────────────────────────────────────────────────────

export interface ListNutritionLogsParams {
  /** Required in practice (response doc §10). Use `toLogsDateTime`. */
  startDate: string;
  endDate: string;
}

export interface ListNutritionLogsResult {
  total: number;
  nutrition: NutritionLogEntry[];
}

/**
 * `/nutrition` — pass exactly one of `date` or `nutritionId` (response doc §9).
 * Prefer `nutritionId` when deep-linking from a log row; `date` for a day tap.
 */
export interface GetNutritionDayParams {
  date?: string;
  nutritionId?: number;
}

export type CustomFoodSort = "lastModified" | "name" | "calories";

export const CUSTOM_FOOD_SORT_LABELS: Record<CustomFoodSort, string> = {
  lastModified: "Recently modified",
  name: "Name",
  calories: "Calories",
};

export interface ListCustomFoodsParams {
  searchTerm?: string;
  sort?: CustomFoodSort;
  start?: number;
  count?: number;
}

export interface ListCustomFoodsResult {
  total: number;
  foods: CustomFood[];
}

// ─── Create / update / delete payloads ────────────────────────────────────

export interface CreateCustomFoodServing {
  name?: string;
  amount?: number;
  nutrients?: NutrientRow[];
}

export interface CreateCustomFoodPayload {
  name: string;
  barcode?: string;
  serving: CreateCustomFoodServing[];
}

export interface UpdateCustomFoodServing extends CreateCustomFoodServing {
  /** PUT-only (response doc §13). Grams. */
  weight?: number;
}

export interface UpdateCustomFoodPayload {
  foodId: number;
  name: string;
  barcode?: string;
  serving: UpdateCustomFoodServing[];
}

export interface DeleteCustomFoodPayload {
  foodId: number;
}

export interface MutateCustomFoodResult {
  foodId?: number;
  code?: number;
  message?: string;
  [key: string]: unknown;
}

// ─── Nutrient catalog (`nutrNo` whitelist from §4) ────────────────────────

export interface NutrientDescriptor {
  nutrNo: number;
  name: string;
  unit: string;
}

/** All 48 documented nutrNo values (response doc §4). */
export const NUTRIENT_CATALOG: NutrientDescriptor[] = [
  { nutrNo: 203, name: "Protein", unit: "g" },
  { nutrNo: 204, name: "Total fat", unit: "g" },
  { nutrNo: 205, name: "Carbohydrate", unit: "g" },
  { nutrNo: 208, name: "Energy", unit: "kcal" },
  { nutrNo: 209, name: "Starch", unit: "g" },
  { nutrNo: 210, name: "Sucrose", unit: "g" },
  { nutrNo: 211, name: "Glucose (dextrose)", unit: "g" },
  { nutrNo: 212, name: "Fructose", unit: "g" },
  { nutrNo: 213, name: "Lactose", unit: "g" },
  { nutrNo: 214, name: "Maltose", unit: "g" },
  { nutrNo: 221, name: "Alcohol, ethyl", unit: "g" },
  { nutrNo: 255, name: "Water", unit: "g" },
  { nutrNo: 262, name: "Caffeine", unit: "mg" },
  { nutrNo: 269, name: "Sugars (total)", unit: "g" },
  { nutrNo: 291, name: "Fiber", unit: "g" },
  { nutrNo: 301, name: "Calcium", unit: "mg" },
  { nutrNo: 303, name: "Iron", unit: "mg" },
  { nutrNo: 304, name: "Magnesium", unit: "mg" },
  { nutrNo: 305, name: "Phosphorus", unit: "mg" },
  { nutrNo: 306, name: "Potassium", unit: "mg" },
  { nutrNo: 307, name: "Sodium", unit: "mg" },
  { nutrNo: 309, name: "Zinc", unit: "mg" },
  { nutrNo: 312, name: "Copper", unit: "mg" },
  { nutrNo: 315, name: "Manganese", unit: "mg" },
  { nutrNo: 317, name: "Selenium", unit: "µg" },
  { nutrNo: 318, name: "Vitamin A", unit: "IU" },
  { nutrNo: 321, name: "Choline", unit: "mg" },
  { nutrNo: 322, name: "Vitamin D (D2 + D3)", unit: "IU" },
  { nutrNo: 323, name: "Vitamin E", unit: "mg" },
  { nutrNo: 324, name: "Vitamin K", unit: "µg" },
  { nutrNo: 401, name: "Vitamin C", unit: "mg" },
  { nutrNo: 404, name: "Thiamin", unit: "mg" },
  { nutrNo: 405, name: "Riboflavin", unit: "mg" },
  { nutrNo: 406, name: "Niacin", unit: "mg" },
  { nutrNo: 410, name: "Pantothenic acid", unit: "mg" },
  { nutrNo: 415, name: "Vitamin B-6", unit: "mg" },
  { nutrNo: 417, name: "Folate", unit: "µg" },
  { nutrNo: 418, name: "Vitamin B-12", unit: "µg" },
  { nutrNo: 430, name: "Vitamin K (alt)", unit: "µg" },
  { nutrNo: 601, name: "Cholesterol", unit: "mg" },
  { nutrNo: 605, name: "Fatty acids, trans", unit: "g" },
  { nutrNo: 606, name: "Fatty acids, saturated", unit: "g" },
  { nutrNo: 645, name: "Fatty acids, monounsaturated", unit: "g" },
  { nutrNo: 646, name: "Fatty acids, polyunsaturated", unit: "g" },
  { nutrNo: 700, name: "Phytosterols", unit: "mg" },
  { nutrNo: 701, name: "Beta-sitosterol", unit: "mg" },
  { nutrNo: 1100, name: "Added sugars", unit: "g" },
  { nutrNo: 1102, name: "Vitamin D (µg)", unit: "µg" },
];

/** O(1) lookup by `nutrNo`. */
export const NUTRIENT_BY_NO: Record<number, NutrientDescriptor> =
  NUTRIENT_CATALOG.reduce<Record<number, NutrientDescriptor>>((acc, n) => {
    acc[n.nutrNo] = n;
    return acc;
  }, {});

/** Required nutrient on a custom food create — Energy/calories (response doc §5). */
export const NUTRIENT_REQUIRED_NO = 208;

/** Recommended macros — Protein / Carbs / Total fat. */
export const NUTRIENT_RECOMMENDED_NOS: number[] = [203, 205, 204];

/** UI grouping for the Add/Edit dialog. */
export interface NutrientGroup {
  key: string;
  label: string;
  nutrNos: number[];
}

export const NUTRIENT_GROUPS: NutrientGroup[] = [
  {
    key: "sugars-carbs",
    label: "Sugars & carbs",
    nutrNos: [209, 210, 211, 212, 213, 214, 269, 1100, 291],
  },
  {
    key: "fats",
    label: "Fats",
    nutrNos: [605, 606, 645, 646, 601],
  },
  {
    key: "minerals",
    label: "Minerals",
    nutrNos: [301, 303, 304, 305, 306, 307, 309, 312, 315, 317],
  },
  {
    key: "vitamins",
    label: "Vitamins",
    nutrNos: [318, 321, 322, 323, 324, 401, 404, 405, 406, 410, 415, 417, 418, 430, 1102],
  },
  {
    key: "other",
    label: "Other",
    nutrNos: [221, 255, 262, 700, 701],
  },
];

// ─── Type predicates ──────────────────────────────────────────────────────

export function isCustomFood(food: CustomFood): boolean {
  return food.type === "custom";
}

export function isSystemFood(food: CustomFood): boolean {
  return food.type === "system";
}

// ─── Goal compliance helpers ──────────────────────────────────────────────

/**
 * Percent of `goal` reached for a numeric actual value. Returns `null` if
 * either side is missing/non-finite. Capped at 200 — the UI clamps further
 * for display.
 */
export function compliancePct(
  actual: number | undefined | null,
  target: number | undefined | null,
): number | null {
  if (
    typeof actual !== "number" ||
    typeof target !== "number" ||
    !Number.isFinite(actual) ||
    !Number.isFinite(target) ||
    target === 0
  ) {
    return null;
  }
  return Math.min(200, Math.max(0, Math.round((actual / target) * 100)));
}

/**
 * True if a day's calorie total is within `goal.nutritionDeviation` percent
 * of `goal.caloricGoal`. Defaults to a 10% window when no deviation set.
 */
export function withinCaloricDeviation(
  calories: number | undefined,
  goal: NutritionGoalSnapshot | undefined,
): boolean | null {
  if (
    !goal ||
    typeof calories !== "number" ||
    typeof goal.caloricGoal !== "number" ||
    goal.caloricGoal === 0
  ) {
    return null;
  }
  const tolerance = (typeof goal.nutritionDeviation === "number"
    ? goal.nutritionDeviation
    : 10) / 100;
  const lower = goal.caloricGoal * (1 - tolerance);
  const upper = goal.caloricGoal * (1 + tolerance);
  return calories >= lower && calories <= upper;
}
