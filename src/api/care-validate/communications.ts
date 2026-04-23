import { axiosService } from "@/api/http/axiosInstance";
import type {
  CreateCaseCommentBody,
  CreateCaseCommentData,
  CreateCaseCommentResponse,
  CommunicationCommentItem,
  FetchCaseCommentsParams,
  FetchCaseCommentsResponse,
  GetCaseCommentsByIDParams,
} from "@/types/care-validate/communication_types";

const COMMUNICATIONS_COMMENTS_ENDPOINT = "/api/patient/communications/comments";
const CASE_COMMUNICATIONS_COMMENTS_ENDPOINT = "/api/patient/communications/cases";

function mapCommunicationAuthor(raw: unknown): CommunicationCommentItem["author"] {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const hasAnyField =
    typeof row.id === "string" ||
    typeof row.firstName === "string" ||
    typeof row.lastName === "string" ||
    typeof row.email === "string" ||
    typeof row.role === "string";
  if (!hasAnyField) return null;

  return {
    ...(typeof row.id === "string" ? { id: row.id } : {}),
    ...(typeof row.firstName === "string" ? { firstName: row.firstName } : {}),
    ...(typeof row.lastName === "string" ? { lastName: row.lastName } : {}),
    ...(typeof row.email === "string" ? { email: row.email } : {}),
    ...(typeof row.role === "string" ? { role: row.role } : {}),
  };
}

function mapCommunicationAttachment(raw: unknown): CommunicationCommentItem["attachments"][number] {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    ...(typeof row.id === "string" ? { id: row.id } : {}),
    ...(typeof row.fileName === "string" ? { fileName: row.fileName } : {}),
    ...(typeof row.url === "string" ? { url: row.url } : {}),
    ...(typeof row.isRestricted === "boolean" ? { isRestricted: row.isRestricted } : {}),
    ...(typeof row.isPHI === "boolean" ? { isPHI: row.isPHI } : {}),
    ...(typeof row.isDeleted === "boolean" ? { isDeleted: row.isDeleted } : {}),
    ...(typeof row.createdAt === "string" ? { createdAt: row.createdAt } : {}),
  };
}

function mapCommunicationComment(raw: unknown): CommunicationCommentItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  const attachments = Array.isArray(row.attachments) ? row.attachments : [];

  return {
    id: String(row.id ?? ""),
    caseId: String(row.caseId ?? ""),
    text: String(row.text ?? ""),
    createdAt: String(row.createdAt ?? ""),
    author: mapCommunicationAuthor(row.author),
    attachments: attachments.map(mapCommunicationAttachment),
    raw: row as CommunicationCommentItem["raw"],
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

export async function createCaseComment(
  caseId: string,
  body: CreateCaseCommentBody
): Promise<CreateCaseCommentData> {
  const safeCaseId = encodeURIComponent(caseId);
  const res = await axiosService.post<CreateCaseCommentResponse>(
    `${CASE_COMMUNICATIONS_COMMENTS_ENDPOINT}/${safeCaseId}/comments`,
    body
  );

  return {
    commentId: String(res.data?.data?.commentId ?? ""),
    createdAt: String(res.data?.data?.createdAt ?? ""),
  };
}
