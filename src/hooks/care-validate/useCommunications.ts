import { useQuery } from "@tanstack/react-query";
import {
  fetchAllCaseComments,
  getCaseCommentsByID,
} from "@/api/care-validate/communications";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  CommunicationCommentItem,
  FetchCaseCommentsParams,
  GetCaseCommentsByIDParams,
} from "@/types/care-validate/communication_types";

export function useCommunications(
  params: FetchCaseCommentsParams = { recordsPerPage: 20 }
) {
  const recordsPerPage = params.recordsPerPage ?? 20;

  return useQuery<CommunicationCommentItem[]>({
    queryKey: queryKeys.careValidate.caseComments(recordsPerPage),
    queryFn: () => fetchAllCaseComments({ recordsPerPage }),
    staleTime: 60_000,
  });
}

export function useCaseCommentsByID(
  caseId?: string,
  params: GetCaseCommentsByIDParams = { recordsPerPage: 20, sortOrder: "DESC" }
) {
  const recordsPerPage = params.recordsPerPage ?? 20;
  const sortOrder = params.sortOrder ?? "DESC";

  return useQuery<CommunicationCommentItem[]>({
    queryKey: queryKeys.careValidate.caseCommentsById(
      caseId ?? "",
      recordsPerPage,
      sortOrder
    ),
    queryFn: () =>
      getCaseCommentsByID(caseId ?? "", {
        recordsPerPage,
        sortOrder,
      }),
    enabled: Boolean(caseId),
    staleTime: 60_000,
  });
}
