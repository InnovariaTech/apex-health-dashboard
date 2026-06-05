import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  CreateCustomFoodPayload,
  CustomFood,
  DeleteCustomFoodPayload,
  GetNutritionDayParams,
  ListCustomFoodsParams,
  ListCustomFoodsResult,
  ListNutritionLogsParams,
  ListNutritionLogsResult,
  MutateCustomFoodResult,
  NutritionDay,
  NutritionLogEntry,
  UpdateCustomFoodPayload,
} from "@/types/trainerize/nutrition_types";

/**
 * Trainerize nutrition — logs, day detail, custom-foods CRUD.
 * See `docs/trainerize/nutrition-photos-appointments-apis.md` and
 * `docs/trainerize/nutrition-issue-responses.md` for the response-shape contract.
 *
 * Notes:
 *  - Server resolves the linked client ID; never send `userID`.
 *  - `getNutritionDay` REQUIRES exactly one of `date` or `nutritionId`
 *    (response doc §9) — pass exactly one or expect undefined behavior upstream.
 *  - `deleteCustomFood` uses a JSON body (response doc §11); gateway pass-through
 *    of DELETE bodies isn't verified — surface caution in the UI confirm.
 */

const NUTRITION = "/api/trainerize/me/nutrition";
const LOGS = `${NUTRITION}/logs`;
const CUSTOM_FOODS = `${NUTRITION}/custom-foods`;

// ─── Logs (date range) ────────────────────────────────────────────────────

export async function listNutritionLogs(
  params: ListNutritionLogsParams,
): Promise<ListNutritionLogsResult> {
  const res = await axiosService.get<Envelope<unknown>>(LOGS, { params });
  return normalizeLogs(unwrap(res.data));
}

function normalizeLogs(data: unknown): ListNutritionLogsResult {
  if (!data) return { total: 0, nutrition: [] };
  if (Array.isArray(data)) {
    return { total: data.length, nutrition: data as NutritionLogEntry[] };
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const arr =
      (obj.nutrition as NutritionLogEntry[] | undefined) ??
      (obj.results as NutritionLogEntry[] | undefined) ??
      (obj.items as NutritionLogEntry[] | undefined) ??
      [];
    return {
      total: typeof obj.total === "number" ? obj.total : arr.length,
      nutrition: Array.isArray(arr) ? arr : [],
    };
  }
  return { total: 0, nutrition: [] };
}

// ─── Day detail ───────────────────────────────────────────────────────────

export async function getNutritionDay(
  params: GetNutritionDayParams,
): Promise<NutritionDay | null> {
  if (
    params.date === undefined &&
    (params.nutritionId === undefined || params.nutritionId === null)
  ) {
    // Response doc §9: never call without at least one identifier.
    return null;
  }
  const res = await axiosService.get<Envelope<unknown>>(NUTRITION, { params });
  return normalizeDay(unwrap(res.data));
}

function normalizeDay(data: unknown): NutritionDay | null {
  if (!data) return null;
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    // Trainerize wraps inside `{ nutrition: {...} }` — unwrap if present.
    if (obj.nutrition && typeof obj.nutrition === "object") {
      return obj.nutrition as NutritionDay;
    }
    return obj as NutritionDay;
  }
  return null;
}

// ─── Custom foods ─────────────────────────────────────────────────────────

export async function listCustomFoods(
  params: ListCustomFoodsParams = {},
): Promise<ListCustomFoodsResult> {
  const res = await axiosService.get<Envelope<unknown>>(CUSTOM_FOODS, {
    params,
  });
  return normalizeCustomFoods(unwrap(res.data));
}

function normalizeCustomFoods(data: unknown): ListCustomFoodsResult {
  if (!data) return { total: 0, foods: [] };
  if (Array.isArray(data)) {
    return { total: data.length, foods: data as CustomFood[] };
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const arr =
      (obj.foods as CustomFood[] | undefined) ??
      (obj.results as CustomFood[] | undefined) ??
      (obj.items as CustomFood[] | undefined) ??
      [];
    return {
      total: typeof obj.total === "number" ? obj.total : arr.length,
      foods: Array.isArray(arr) ? arr : [],
    };
  }
  return { total: 0, foods: [] };
}

export async function createCustomFood(
  payload: CreateCustomFoodPayload,
): Promise<MutateCustomFoodResult> {
  const res = await axiosService.post<Envelope<MutateCustomFoodResult>>(
    CUSTOM_FOODS,
    payload,
  );
  return unwrap<MutateCustomFoodResult>(res.data) ?? {};
}

export async function updateCustomFood(
  payload: UpdateCustomFoodPayload,
): Promise<MutateCustomFoodResult> {
  const res = await axiosService.put<Envelope<MutateCustomFoodResult>>(
    CUSTOM_FOODS,
    payload,
  );
  return unwrap<MutateCustomFoodResult>(res.data) ?? {};
}

export async function deleteCustomFood(
  payload: DeleteCustomFoodPayload,
): Promise<void> {
  // DELETE with JSON body per the doc (response doc §11).
  await axiosService.delete<Envelope<null>>(CUSTOM_FOODS, { data: payload });
}
