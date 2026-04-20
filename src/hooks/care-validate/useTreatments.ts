import { useQuery } from "@tanstack/react-query";
import { fetchAvailableTreatmentBundles } from "@/api/care-validate/treatments";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  FetchAvailableTreatmentBundlesParams,
  TreatmentBundleItem,
} from "@/types/care-validate/treatments_types";

export function useTreatments(params: FetchAvailableTreatmentBundlesParams = {}) {
  const isVisible = params.isVisible;
  const bundleId = params.bundleId;
  const includeIntakeForm = params.includeIntakeForm;
  const includeFollowupForm = params.includeFollowupForm;

  return useQuery<TreatmentBundleItem[]>({
    queryKey: queryKeys.careValidate.treatmentBundles(
      isVisible,
      bundleId,
      includeIntakeForm,
      includeFollowupForm
    ),
    queryFn: () =>
      fetchAvailableTreatmentBundles(
        {
          ...(typeof isVisible === "boolean" ? { isVisible } : {}),
          ...(bundleId ? { bundleId } : {}),
          ...(typeof includeIntakeForm === "boolean" ? { includeIntakeForm } : {}),
          ...(typeof includeFollowupForm === "boolean" ? { includeFollowupForm } : {}),
        }
      ),
    staleTime: 60_000,
  });
}
