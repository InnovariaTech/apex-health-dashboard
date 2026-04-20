import { axiosService } from "@/api/http/axiosInstance";
import type {
  CommunicationCommentItem,
  FetchCaseCommentsParams,
  FetchCaseCommentsResponse,
  GetCaseCommentsByIDParams,
} from "@/types/care-validate/communication_types";

const COMMUNICATIONS_COMMENTS_ENDPOINT = "/api/patient/communications/comments";
const CASE_COMMUNICATIONS_COMMENTS_ENDPOINT = "/api/patient/communications/cases";

function mapCommunicationComment(raw: unknown): CommunicationCommentItem {
  const row = (raw ?? {}) as Record<string, unknown>;

  return {
    id: String(row.id ?? ""),
    caseId: String(row.caseId ?? ""),
    text: String(row.text ?? ""),
    createdAt: String(row.createdAt ?? ""),
    raw: (row.raw ?? {}) as CommunicationCommentItem["raw"],
  };
}

export async function fetchAllCaseComments(
  params: FetchCaseCommentsParams = { recordsPerPage: 20 }
): Promise<CommunicationCommentItem[]> {
  const recordsPerPage = params.recordsPerPage ?? 20;
  const res = await axiosService.get<FetchCaseCommentsResponse>(
    COMMUNICATIONS_COMMENTS_ENDPOINT,
    {
      params: { recordsPerPage },
    }
  );
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];

  return rows.map(mapCommunicationComment);
}

export async function getCaseCommentsByID(
  caseId: string,
  params: GetCaseCommentsByIDParams = { recordsPerPage: 20, sortOrder: "DESC" }
): Promise<CommunicationCommentItem[]> {
  const safeCaseId = encodeURIComponent(caseId);
  const recordsPerPage = params.recordsPerPage ?? 20;
  const sortOrder = params.sortOrder ?? "DESC";

  const res = await axiosService.get<FetchCaseCommentsResponse>(
    `${CASE_COMMUNICATIONS_COMMENTS_ENDPOINT}/${safeCaseId}/comments`,
    {
      params: {
        recordsPerPage,
        sortOrder,
      },
    }
  );
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];

  return rows.map(mapCommunicationComment);
}
