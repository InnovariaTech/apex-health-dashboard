import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllPatientSummaries,
  fetchLatestPatientSummary,
  generatePatientSummary,
} from "@/api/ai-agent/ai_summary";

const AI_SUMMARY_QUERY_KEYS = {
  latest: ["ai-agent", "patient-summary", "latest"] as const,
  all: ["ai-agent", "patient-summary", "all"] as const,
};

export function useLatestPatientSummary(enabled = true) {
  return useQuery({
    queryKey: AI_SUMMARY_QUERY_KEYS.latest,
    queryFn: fetchLatestPatientSummary,
    enabled,
    staleTime: 60_000,
  });
}

export function useAllPatientSummaries(enabled = true) {
  return useQuery({
    queryKey: AI_SUMMARY_QUERY_KEYS.all,
    queryFn: fetchAllPatientSummaries,
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
      void queryClient.invalidateQueries({ queryKey: AI_SUMMARY_QUERY_KEYS.all });
    },
  });
}
