import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIntakeStep,
  goBack,
  submitAnswer,
  submitFacts,
} from "@/api/intake/intake";
import { queryKeys } from "@/hooks/queryKeys";
import type { IntakeAnswer, IntakeStep } from "@/types/intake/intake_types";

/**
 * Intake runtime hooks. The current step lives in the query cache keyed by
 * token; each POST returns the next step, which we write straight back — so the
 * whole flow is one cache entry advancing forward.
 */

export function useIntakeStep(token: string) {
  return useQuery({
    queryKey: queryKeys.intake.step(token),
    queryFn: () => getIntakeStep(token),
    enabled: Boolean(token),
    // 404/410 are terminal; don't hammer a dead/expired link.
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

function useAdvance(token: string) {
  const qc = useQueryClient();
  return (step: IntakeStep) =>
    qc.setQueryData(queryKeys.intake.step(token), step);
}

export function useSubmitFacts(token: string) {
  const advance = useAdvance(token);
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => submitFacts(token, values),
    onSuccess: advance,
  });
}

export function useSubmitAnswer(token: string) {
  const advance = useAdvance(token);
  return useMutation({
    mutationFn: ({ key, answer }: { key: string; answer: IntakeAnswer }) =>
      submitAnswer(token, key, answer),
    onSuccess: advance,
  });
}

export function useBack(token: string) {
  const advance = useAdvance(token);
  return useMutation({
    mutationFn: () => goBack(token),
    onSuccess: advance,
  });
}
