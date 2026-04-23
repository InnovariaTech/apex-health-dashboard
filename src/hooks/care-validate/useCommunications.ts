import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCaseComment,
  fetchAllCaseComments,
  getCaseCommentsByID,
} from "@/api/care-validate/communications";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  CreateCaseCommentBody,
  CreateCaseCommentData,
  CommunicationAuthor,
  CommunicationCommentItem,
  CommunicationCommentRaw,
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
  params: GetCaseCommentsByIDParams = { recordsPerPage: 200, sortOrder: "ASC" }
) {
  const recordsPerPage = params.recordsPerPage ?? 200;
  const sortOrder = params.sortOrder ?? "ASC";

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
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

interface CreateCaseCommentMutationInput {
  caseId: string;
  text?: string;
  body?: CreateCaseCommentBody;
  optimisticAuthor?: CommunicationAuthor;
  recordsPerPage?: number;
  sortOrder?: "ASC" | "DESC";
}

export function useCreateCaseComment() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateCaseCommentData,
    unknown,
    CreateCaseCommentMutationInput,
    {
      previous?: CommunicationCommentItem[];
      queryKey: ReturnType<typeof queryKeys.careValidate.caseCommentsById>;
    }
  >({
    mutationFn: ({ caseId, text, body }) =>
      createCaseComment(caseId, body ?? { text: text ?? "" }),
    onMutate: async (variables) => {
      const recordsPerPage = variables.recordsPerPage ?? 200;
      const sortOrder = variables.sortOrder ?? "ASC";
      const queryKey = queryKeys.careValidate.caseCommentsById(
        variables.caseId,
        recordsPerPage,
        sortOrder
      );

      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CommunicationCommentItem[]>(queryKey);

      const optimisticText =
        variables.text ??
        (typeof variables.body === "object" && variables.body && "communication" in variables.body
          ? String(variables.body.communication?.text ?? "")
          : "");

      const optimisticComment: CommunicationCommentItem = {
        id: `optimistic-${Date.now()}`,
        caseId: variables.caseId,
        text: optimisticText,
        createdAt: new Date().toISOString(),
        author: variables.optimisticAuthor ?? null,
        attachments: [],
        raw: {
          caseId: variables.caseId,
          text: optimisticText,
          createdAt: new Date().toISOString(),
          author: variables.optimisticAuthor ?? undefined,
        } as CommunicationCommentRaw,
      };

      const existing = previous ?? [];
      const next =
        sortOrder === "ASC"
          ? [...existing, optimisticComment]
          : [optimisticComment, ...existing];

      queryClient.setQueryData(queryKey, next);
      return {
        ...(previous ? { previous } : {}),
        queryKey,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: async (_data, _error, variables, context) => {
      if (context?.queryKey) {
        await queryClient.invalidateQueries({ queryKey: context.queryKey });
      } else {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.careValidate.caseCommentsById(variables.caseId),
        });
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.careValidate.caseComments(),
      });
    },
  });
}
