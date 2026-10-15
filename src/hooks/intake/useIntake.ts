import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIntakeStep,
  getManifest,
  getPublicIntakeForm,
  goBack,
  startPublicIntake,
  submitAnswer,
  submitFacts,
} from "@/api/intake/intake";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  IntakeAnswer,
  IntakeStep,
  PublicStartPayload,
} from "@/types/intake/intake_types";

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

/**
 * The walk's manifest — read once per token for the title and the theme. A failure is harmless:
 * the form still works and wears the Apex look.
 */
export function useIntakeManifest(token: string) {
  return useQuery({
    queryKey: queryKeys.intake.manifest(token),
    queryFn: () => getManifest(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * The public details page's title and theme. The server sends `no-store`, so a newly published
 * theme shows on the next visit; within a visit it is read once. A 404 means the form isn't open.
 */
export function usePublicIntakeForm(formKey: string) {
  return useQuery({
    queryKey: queryKeys.intake.publicForm(formKey),
    queryFn: () => getPublicIntakeForm(formKey),
    enabled: Boolean(formKey),
    retry: false,
    staleTime: Infinity,
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

/** Public door — mint a token from an identity block. */
export function useStartPublicIntake() {
  return useMutation({
    mutationFn: (payload: PublicStartPayload) => startPublicIntake(payload),
  });
}
