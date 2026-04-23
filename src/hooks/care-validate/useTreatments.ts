import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAvailableTreatmentBundles, fetchTreatmentBundleById } from "@/api/care-validate/treatments";
import { queryKeys } from "@/hooks/queryKeys";
import {
  resolveTreatmentCategory,
  UNCATEGORIZED_LABEL,
} from "@/lib/treatmentCategories";
import type {
  FetchAvailableTreatmentBundlesParams,
  FetchTreatmentBundleByIdParams,
  TreatmentBundleItem,
} from "@/types/care-validate/treatments_types";

export function useTreatments(
  params: FetchAvailableTreatmentBundlesParams = { isVisible: true }
) {
  const isVisible = params.isVisible;

  return useQuery<TreatmentBundleItem[]>({
    queryKey: queryKeys.careValidate.treatmentBundles(isVisible),
    queryFn: () =>
      fetchAvailableTreatmentBundles({
        ...(typeof isVisible === "boolean" ? { isVisible } : {}),
      }),
    staleTime: 60_000,
  });
}

export function useTreatmentBundleById(
  bundleUUID: string,
  params: FetchTreatmentBundleByIdParams = {
    includeIntakeForm: true,
    includeFollowupForm: true,
  }
) {
  const includeIntakeForm = params.includeIntakeForm;
  const includeFollowupForm = params.includeFollowupForm;

  return useQuery<TreatmentBundleItem | null>({
    queryKey: queryKeys.careValidate.treatmentBundleById(
      bundleUUID,
      includeIntakeForm,
      includeFollowupForm
    ),
    queryFn: () => fetchTreatmentBundleById(bundleUUID, params),
    enabled: Boolean(bundleUUID),
    staleTime: 60_000,
  });
}

export interface TreatmentCategoryGroup {
  category: string;
  items: TreatmentBundleItem[];
}

const CATEGORY_ORDER = [
  "Weight Loss Product",
  "Hormonal Therapy Product",
  "Wellness / Longevity Product",
  "Skincare Product",
  UNCATEGORIZED_LABEL,
];

export function useGroupedTreatments(
  params: FetchAvailableTreatmentBundlesParams = { isVisible: true }
) {
  const query = useTreatments(params);

  const groups = useMemo<TreatmentCategoryGroup[]>(() => {
    const bundles = query.data ?? [];
    const groupedMap = new Map<string, TreatmentBundleItem[]>();

    for (const bundle of bundles) {
      if (!bundle.price && !bundle.imageUrl) continue;

      const key = resolveTreatmentCategory(bundle) ?? UNCATEGORIZED_LABEL;

      if (!groupedMap.has(key)) groupedMap.set(key, []);
      groupedMap.get(key)?.push(bundle);
    }

    const result = Array.from(groupedMap.entries()).map(([category, items]) => ({
      category,
      items,
    }));

    result.sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a.category);
      const bIndex = CATEGORY_ORDER.indexOf(b.category);
      if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return result;
  }, [query.data]);

  return {
    ...query,
    groups,
  };
}
