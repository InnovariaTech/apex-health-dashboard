import { axiosService } from "@/api/http/axiosInstance";
import { unwrapNullable, type Envelope } from "./_envelope";
import type {
  GetMealPlanParams,
  MealPlan,
} from "@/types/trainerize/mealPlan_types";

/**
 * Trainerize meal plan — `GET /api/trainerize/me/meal-plan`.
 * See `docs/documents/workflows/workflow-meal-plans-and-nutrition.md` Flow 1.
 *
 * Without `mealPlanId` the proxy resolves the linked client's assigned plan
 * (`mealPlan/get` with `userid`). Returns `null` when no plan is assigned —
 * the page shows an empty state rather than crashing.
 *
 * We intentionally don't ship the `POST /generate`, `PUT` or `DELETE`
 * verbs yet; the doc shows them but they're not required to surface the
 * plan in the Nutrition tab. Add when a sample mutation response is
 * available so we tighten the types around the real shape.
 */

const BASE = "/api/trainerize/me/meal-plan";

export async function getMealPlan(
  params: GetMealPlanParams = {},
): Promise<MealPlan | null> {
  const res = await axiosService.get<Envelope<unknown>>(BASE, { params });
  return normalizeMealPlan(unwrapNullable(res.data));
}

/**
 * Real response shape (observed):
 *   { success, data: {
 *       mealPlan: { mealPlanID: 0, mealPlanName: null, … all nulls },
 *       code: 0, statusMsg: "OK",
 *       id, mealPlanName, mealPlanType, caloriesTarget,
 *       mealPlanDays[…]
 *   } }
 *
 * The plan lives at the TOP LEVEL of `data`. The nested `mealPlan` field is
 * a legacy skeleton with every value null and must not be picked. We treat
 * the top-level object as the plan when it has any plan-shaped field
 * (`mealPlanName`, `id`, or `mealPlanDays`), and only fall back to the
 * nested `mealPlan` if the upstream ever inverts the shape.
 */
function normalizeMealPlan(data: unknown): MealPlan | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const topLevelHasPlan =
    typeof obj.mealPlanName === "string" ||
    typeof obj.id === "number" ||
    Array.isArray(obj.mealPlanDays);
  if (topLevelHasPlan) return obj as MealPlan;
  if (obj.mealPlan && typeof obj.mealPlan === "object") {
    return obj.mealPlan as MealPlan;
  }
  return obj as MealPlan;
}
