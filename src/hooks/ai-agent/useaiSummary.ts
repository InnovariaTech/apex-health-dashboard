import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllPatientSummaries,
  fetchLatestPatientSummary,
  generatePatientSummary,
} from "@/api/ai-agent/ai_summary";
import type { FetchAllPatientSummariesParams } from "@/types/ai-agent/ai_summary_types";

const AI_SUMMARY_QUERY_KEYS = {
  latest: ["ai-agent", "patient-summary", "latest"] as const,
  allRoot: ["ai-agent", "patient-summary", "all"] as const,
  all: (params?: FetchAllPatientSummariesParams) =>
    [
      "ai-agent",
      "patient-summary",
      "all",
      {
        take: params?.take ?? "all",
        skip: params?.skip ?? 0,
      },
    ] as const,
};

export function useLatestPatientSummary(enabled = true) {
  return useQuery({
    queryKey: AI_SUMMARY_QUERY_KEYS.latest,
    queryFn: fetchLatestPatientSummary,
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Backwards-compatible overload: existing call sites pass either nothing or
 * a single boolean `enabled`. New callers can pass `(params, enabled?)` to
 * paginate via `take`/`skip` (doc #38).
 */
export function useAllPatientSummaries(
  paramsOrEnabled: FetchAllPatientSummariesParams | boolean = true,
  maybeEnabled?: boolean
) {
  const params: FetchAllPatientSummariesParams =
    typeof paramsOrEnabled === "boolean" ? {} : paramsOrEnabled;
  const enabled =
    typeof paramsOrEnabled === "boolean"
      ? paramsOrEnabled
      : maybeEnabled ?? true;

  return useQuery({
    queryKey: AI_SUMMARY_QUERY_KEYS.all(params),
    queryFn: () => fetchAllPatientSummaries(params),
    enabled,
    staleTime: 60_000,
  });
}

export function useGeneratePatientSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generatePatientSummary,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AI_SUMMARY_QUERY_KEYS.latest });
      // Invalidate every paginated variant of the all-summaries query.
      void queryClient.invalidateQueries({ queryKey: AI_SUMMARY_QUERY_KEYS.allRoot });
    },
  });
}
