export interface CommunicationAuthor {
  id?: string;
  email?: string;
  role?: string | null;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export interface CommunicationAttachmentUploader {
  id?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export interface CommunicationAttachment {
  id?: string;
  isRestricted?: boolean;
  isPHI?: boolean;
  fileName?: string;
  isDeleted?: boolean;
  createdAt?: string;
  uploadedBy?: CommunicationAttachmentUploader;
  url?: string;
  [key: string]: unknown;
}

export interface CommunicationCommentRaw {
  id?: string;
  text?: string;
  isRestricted?: boolean;
  forms?: unknown[];
  createdAt?: string;
  author?: CommunicationAuthor;
  attachments?: CommunicationAttachment[];
  caseId?: string;
  caseShortId?: string;
  caseTitle?: string;
  [key: string]: unknown;
}

export interface CommunicationCommentItem {
  id: string;
  caseId: string;
  text: string;
  createdAt: string;
  author: CommunicationAuthor | null;
  attachments: CommunicationAttachment[];
  raw: CommunicationCommentRaw;
}

export interface FetchCaseCommentsParams {
  recordsPerPage?: number;
}

export type CommunicationSortOrder = "ASC" | "DESC";

export interface GetCaseCommentsByIDParams {
  recordsPerPage?: number;
  sortOrder?: CommunicationSortOrder;
}

export interface FetchCaseCommentsResponse {
  success: boolean;
  data: CommunicationCommentItem[];
}

export interface CreateCaseCommentBodyLegacy {
  text: string;
}

export interface CreateCaseCommentAuthorInput {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateCaseCommentAttachmentInput {
  isRestricted?: boolean;
  isPHI?: boolean;
  fileName?: string;
  content?: string;
}

export interface CreateCaseCommentCommunicationInput {
  text: string;
  isRestricted?: boolean;
  author?: CreateCaseCommentAuthorInput;
  webhookNotify?: boolean;
  attachments?: CreateCaseCommentAttachmentInput[];
}

export interface CreateCaseCommentBodyAdvanced {
  action?: "ADD_COMMUNICATION" | string;
  communication: CreateCaseCommentCommunicationInput;
}

export type CreateCaseCommentBody =
  | CreateCaseCommentBodyLegacy
  | CreateCaseCommentBodyAdvanced;

export interface CreateCaseCommentData {
  commentId: string;
  createdAt: string;
}

export interface CreateCaseCommentResponse {
  success: boolean;
  message?: string;
  data: CreateCaseCommentData;
}
