export interface CommunicationAuthor {
  id?: string;
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
