import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  cancelVisit,
  createLabAuthorization,
  createLabVisit,
  createVisit,
  getIntakeRequirements,
  getVisit,
  getVisitChat,
  listVisits,
  refreshVisit,
  searchPharmacies,
  sendVisitChat,
  updatePrescription,
  uploadVisitPhoto,
} from "@/api/http/beluga";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  CancelResult,
  ChatMessage,
  CreateVisitPayload,
  CreateVisitResult,
  IntakeRequirements,
  LabAuthorizationPayload,
  LabVisitPayload,
  Pharmacy,
  PharmacySearchParams,
  PrescriptionPayload,
  PrescriptionResult,
  Visit,
  VisitRefresh,
  VisitStatus,
} from "@/types/beluga/beluga_types";

/**
 * Beluga hooks. Reads are cached; mutations invalidate the affected keys.
 * See `Documents/beluga/beluga-api.md` and `beluga-frontend-plan.md`.
 */

// --- Queries ----------------------------------------------------------------

/** Gate the intake flow on this. Not stale-cached hard — profile edits change it. */
export function useIntakeRequirements(enabled = true) {
  return useQuery<IntakeRequirements>({
    queryKey: queryKeys.beluga.intakeRequirements(),
    queryFn: getIntakeRequirements,
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Pharmacy search. Disabled until at least one non-blank param is present, so
 * we never fire the "at least one required" 400 on an empty form.
 */
export function usePharmacySearch(params: PharmacySearchParams) {
  const hasParam = Object.values(params).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
  return useQuery<Pharmacy[]>({
    queryKey: queryKeys.beluga.pharmacies(params),
    queryFn: () => searchPharmacies(params),
    enabled: hasParam,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVisits(statuses?: VisitStatus[]) {
  return useQuery<Visit[]>({
    queryKey: queryKeys.beluga.visits(statuses),
    queryFn: () => listVisits(statuses),
    staleTime: 30_000,
  });
}

export function useVisit(masterId?: string) {
  return useQuery<Visit>({
    queryKey: queryKeys.beluga.visit(masterId ?? ""),
    queryFn: () => getVisit(masterId as string),
    enabled: Boolean(masterId),
    staleTime: 30_000,
  });
}

export function useVisitChat(masterId?: string) {
  return useQuery<ChatMessage[]>({
    queryKey: queryKeys.beluga.chat(masterId ?? ""),
    queryFn: () => getVisitChat(masterId as string),
    enabled: Boolean(masterId),
    staleTime: 15_000,
  });
}

// --- Mutations --------------------------------------------------------------

function useInvalidateVisits() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["beluga", "visits"] });
}

export function useCreateVisit() {
  const invalidate = useInvalidateVisits();
  return useMutation<CreateVisitResult, unknown, CreateVisitPayload>({
    mutationFn: createVisit,
    onSuccess: () => invalidate(),
  });
}

export function useCreateLabAuthorization() {
  const invalidate = useInvalidateVisits();
  return useMutation<CreateVisitResult, unknown, LabAuthorizationPayload>({
    mutationFn: createLabAuthorization,
    onSuccess: () => invalidate(),
  });
}

export function useCreateLabVisit() {
  const invalidate = useInvalidateVisits();
  return useMutation<CreateVisitResult, unknown, LabVisitPayload>({
    mutationFn: createLabVisit,
    onSuccess: () => invalidate(),
  });
}

/** Uploads the ID photo, moving the visit `awaiting_photos → active`. */
export function useUploadVisitPhoto(masterId: string) {
  const qc = useQueryClient();
  return useMutation<null, unknown, File>({
    mutationFn: (file) => uploadVisitPhoto(masterId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.beluga.visit(masterId) });
      qc.invalidateQueries({ queryKey: ["beluga", "visits"] });
    },
  });
}

export function useSendVisitChat(masterId: string) {
  const qc = useQueryClient();
  return useMutation<null, unknown, string>({
    mutationFn: (content) => sendVisitChat(masterId, content),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.beluga.chat(masterId) }),
  });
}

/** POST /refresh reconciles our row; refresh the detail + list on success. */
export function useRefreshVisit(masterId: string) {
  const qc = useQueryClient();
  return useMutation<VisitRefresh, unknown, void>({
    mutationFn: () => refreshVisit(masterId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.beluga.visit(masterId) });
      qc.invalidateQueries({ queryKey: ["beluga", "visits"] });
    },
  });
}

/**
 * Resend/change a prescription. NOTE: most non-success statuses come back as
 * HTTP 200 — callers MUST branch on the returned `status` (see
 * `PRESCRIPTION_FAULTS`), not just the promise resolving.
 */
export function useUpdatePrescription(masterId: string) {
  const qc = useQueryClient();
  return useMutation<PrescriptionResult, unknown, PrescriptionPayload>({
    mutationFn: (payload) => updatePrescription(masterId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.beluga.visit(masterId) });
      qc.invalidateQueries({ queryKey: ["beluga", "visits"] });
    },
  });
}

export function useCancelVisit(masterId: string) {
  const qc = useQueryClient();
  return useMutation<CancelResult, unknown, void>({
    mutationFn: () => cancelVisit(masterId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.beluga.visit(masterId) });
      qc.invalidateQueries({ queryKey: ["beluga", "visits"] });
    },
  });
}
