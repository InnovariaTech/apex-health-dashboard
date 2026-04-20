import { useQuery } from "@tanstack/react-query";
import {
  fetchCaseDetails,
  getLatestCaseId,
  getMyCases,
} from "@/api/care-validate/cases";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  CaseDetailsItem,
  CaseItem,
  FetchCaseDetailsParams,
  GetCasesParams,
} from "@/types/care-validate/case_types";

export function getRecentCasesDateRange(referenceDate = new Date()) {
  const endDate = new Date(referenceDate);
  const startDate = new Date(referenceDate);
  startDate.setMonth(startDate.getMonth() - 2);

  return {
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
  };
}

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
  }
) {
  const includeAttachments = params.includeAttachments ?? true;
  const documentFormat = params.documentFormat ?? "base64";
  const includeCalendarEvents = params.includeCalendarEvents ?? false;
  const includeOrders = params.includeOrders ?? false;
  const includeCaseProducts = params.includeCaseProducts ?? false;
  const includePayments = params.includePayments ?? false;

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
    staleTime: 60_000,
  });
}

export function useLatestCaseId() {
  return useQuery<string>({
    queryKey: queryKeys.careValidate.latestCaseId(),
    queryFn: getLatestCaseId,
    staleTime: 60_000,
  });
}
