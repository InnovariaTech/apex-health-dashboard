import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomFood,
  deleteCustomFood,
  getNutritionDay,
  listCustomFoods,
  listNutritionLogs,
  updateCustomFood,
} from "@/api/trainerize/nutrition";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  CreateCustomFoodPayload,
  CustomFoodSort,
  DeleteCustomFoodPayload,
  UpdateCustomFoodPayload,
} from "@/types/trainerize/nutrition_types";

/**
 * Trainerize nutrition hooks.
 *
 * - `useNutritionLogs` requires explicit `startDate` + `endDate` (response
 *   doc §10 — no default range). Both must be `YYYY-MM-DD HH:MM:SS`.
 * - `useNutritionDay` is enabled only when exactly one of `date` or
 *   `nutritionId` is provided (response doc §9).
 * - `useCustomFoods` cache is short — list IS the detail source (§8), so the
 *   page may consume it directly.
 */

const PAGE_SIZE = 20;

export function useNutritionLogs(startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.trainerize.nutritionLogs(startDate, endDate),
    queryFn: () => listNutritionLogs({ startDate, endDate }),
    enabled: Boolean(startDate) && Boolean(endDate),
    staleTime: 30 * 1000,
  });
}

export function useNutritionDay(date?: string, nutritionId?: number) {
  // Exactly-one gating: avoid the (date, nutritionId) all-empty fetch and the
  // (both-set) ambiguous-precedence case.
  const hasDate = typeof date === "string" && date.length > 0;
  const hasId = typeof nutritionId === "number" && nutritionId > 0;
  const enabled = hasDate !== hasId; // XOR
  return useQuery({
    queryKey: queryKeys.trainerize.nutritionDay(date, nutritionId),
    queryFn: () =>
      getNutritionDay(
        hasId
          ? { nutritionId: nutritionId as number }
          : { date: date as string },
      ),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useCustomFoods(
  searchTerm = "",
  sort: CustomFoodSort = "lastModified",
  start = 0,
  count = PAGE_SIZE,
) {
  return useQuery({
    queryKey: queryKeys.trainerize.customFoods(searchTerm, sort, start, count),
    queryFn: () =>
      listCustomFoods({
        ...(searchTerm ? { searchTerm } : {}),
        sort,
        start,
        count,
      }),
    staleTime: 60 * 1000,
  });
}

function invalidateNutrition(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["trainerize", "custom-foods"] });
  // Day detail can reflect food edits; refresh logs + day caches too.
  qc.invalidateQueries({ queryKey: ["trainerize", "nutrition-logs"] });
  qc.invalidateQueries({ queryKey: ["trainerize", "nutrition-day"] });
}

export function useCreateCustomFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomFoodPayload) => createCustomFood(payload),
    onSuccess: () => invalidateNutrition(qc),
  });
}

export function useUpdateCustomFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCustomFoodPayload) => updateCustomFood(payload),
    onSuccess: () => invalidateNutrition(qc),
  });
}

export function useDeleteCustomFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteCustomFoodPayload) => deleteCustomFood(payload),
    onSuccess: () => invalidateNutrition(qc),
  });
}
