import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCaseForm,
  createCase,
  fetchCaseDetails,
  getLatestCaseId,
  getMyCases,
} from "@/api/care-validate/cases";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  AddCaseFormBody,
  CaseDetailsItem,
  CaseItem,
  CreateCaseBody,
  FetchCaseDetailsParams,
  GetCasesParams,
} from "@/types/care-validate/case_types";

export function useCases(params: GetCasesParams): ReturnType<typeof useQuery<CaseItem[]>>;
export function useCases(includePayments?: boolean): ReturnType<typeof useQuery<CaseItem[]>>;
export function useCases(
  paramsOrIncludePayments: GetCasesParams | boolean = false
) {
  const params: GetCasesParams =
    typeof paramsOrIncludePayments === "boolean"
      ? { includePayments: paramsOrIncludePayments }
      : paramsOrIncludePayments;

  const includePayments = params.includePayments ?? false;
  const recordsPerPage = params.recordsPerPage ?? 100;
  const includeAttachments = params.includeAttachments ?? true;
  const includeOrders = params.includeOrders ?? true;
  const includeCalendarEvents = params.includeCalendarEvents ?? false;
  const documentFormat = params.documentFormat ?? "url";
  const startTime = params.startTime;
  const endTime = params.endTime;

  return useQuery<CaseItem[]>({
    queryKey: queryKeys.careValidate.cases(
      includePayments,
      startTime,
      endTime,
      recordsPerPage,
      includeAttachments,
      includeOrders,
      includeCalendarEvents,
      documentFormat
    ),
    queryFn: () =>
      getMyCases({
        includePayments,
        ...(startTime ? { startTime } : {}),
        ...(endTime ? { endTime } : {}),
        recordsPerPage,
        includeAttachments,
        includeOrders,
        includeCalendarEvents,
        documentFormat,
      }),
    staleTime: 60_000,
  });
}

export function useCaseDetails(
  caseId?: string,
  params: FetchCaseDetailsParams = {
    includeAttachments: true,
    documentFormat: "base64",
    includeCalendarEvents: false,
    includeOrders: false,
    includeCaseProducts: false,
    includePayments: false,
  },
  options: { enablePolling?: boolean } = {}
) {
  const includeAttachments = params.includeAttachments ?? true;
  const documentFormat = params.documentFormat ?? "base64";
  const includeCalendarEvents = params.includeCalendarEvents ?? false;
  const includeOrders = params.includeOrders ?? false;
  const includeCaseProducts = params.includeCaseProducts ?? false;
  const includePayments = params.includePayments ?? false;
  const enablePolling = options.enablePolling ?? false;

  return useQuery<CaseDetailsItem>({
    queryKey: queryKeys.careValidate.caseDetails(
      caseId ?? "",
      includeAttachments,
      documentFormat,
      includeCalendarEvents,
      includeOrders,
      includeCaseProducts,
      includePayments
    ),
    queryFn: () =>
      fetchCaseDetails(caseId ?? "", {
        includeAttachments,
        documentFormat,
        includeCalendarEvents,
        includeOrders,
        includeCaseProducts,
        includePayments,
      }),
    enabled: Boolean(caseId),
    staleTime: enablePolling ? 10_000 : 60_000,
    refetchInterval: enablePolling ? 15_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useLatestCaseId() {
  return useQuery<string>({
    queryKey: queryKeys.careValidate.latestCaseId(),
    queryFn: getLatestCaseId,
    staleTime: 60_000,
  });
}

function useInvalidateCases() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["care-validate", "cases"],
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.careValidate.latestCaseId(),
      }),
    ]);
}

/** `POST /api/patient/my-requests/cases` (doc #2). */
export function useCreateCase() {
  const invalidate = useInvalidateCases();
  return useMutation<CaseItem, unknown, CreateCaseBody>({
    mutationFn: (body) => createCase(body),
    onSuccess: () => invalidate(),
  });
}

/** `POST /api/patient/my-requests/cases/:caseId/forms` (doc #7). */
export function useAddCaseForm(caseId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateCases();
  return useMutation<unknown, unknown, AddCaseFormBody>({
    mutationFn: (body) => addCaseForm(caseId, body),
    onSuccess: async () => {
      await invalidate();
      // Case-detail GET embeds form responses under `responses[]`, and the
      // case-details page derives its forms list from there via
      // `normalizeCaseForms(caseDetails)`. Invalidating the per-case detail
      // key triggers an immediate refetch so the new follow-up appears
      // without waiting on the 15 s poll cycle.
      await queryClient.invalidateQueries({
        queryKey: ["care-validate", "case-details", caseId],
      });
      // NOTE: When a dedicated `useCaseFormResponses` hook gets added (doc #6),
      // also invalidate ["care-validate", "case-form-responses", caseId] here.
    },
  });
}
