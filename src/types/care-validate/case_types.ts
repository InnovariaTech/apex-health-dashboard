export type CaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "CLOSED"
  | "ARCHIVED"
  | "ESCALATED"
  | string;

export interface CaseProductBundle {
  id: string;
  name: string;
}

export interface CaseSubmitter {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
}

export interface CaseRaw {
  id: string;
  type?: string;
  title: string;
  status: CaseStatus;
  shortId: string;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  isEscalated?: boolean;
  productBundle?: CaseProductBundle | null;
  submitter?: CaseSubmitter | null;
  activity?: unknown[];
  decisions?: unknown[];
  comments?: unknown[];
  attachments?: unknown[];
  responses?: unknown[];
  payments?: unknown[];
  subscriptions?: unknown[];
  [key: string]: unknown;
}

export interface CaseItem {
  id: string;
  shortId: string;
  title: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  payments: unknown[];
  subscriptions: unknown[];
  raw: CaseRaw;
}

export interface CasesListResponse {
  success: boolean;
  data: CaseItem[];
}

export interface CaseDetailsItem {
  id: string;
  shortId: string;
  title: string;
  status: CaseStatus;
  submitterEmail: string;
  raw: CaseRaw;
}

export interface CaseDetailsResponse {
  success: boolean;
  data: CaseDetailsItem;
}

export interface CaseTreatmentsResponse {
  success: boolean;
  data: unknown[];
}

export interface CaseFormResponsesResponse {
  success: boolean;
  data: CaseFormResponseItem[];
}

export interface CaseFormPerson {
  id?: string | null;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export interface CaseFormMetadata {
  name: string;
  description?: string;
  [key: string]: unknown;
}

export interface CaseFormQuestion {
  id?: string | null;
  isPHI?: boolean;
  type?: string;
  text?: string;
  options?: unknown[];
  index?: number;
  [key: string]: unknown;
}

export interface CaseFormQuestionResponse {
  id: string;
  response: string;
  question: CaseFormQuestion;
  [key: string]: unknown;
}

export interface CaseFormResponseItem {
  id: string;
  createdAt: string;
  respondent?: CaseFormPerson | null;
  assistedBy?: CaseFormPerson | null;
  form?: CaseFormMetadata | null;
  questionResponses: CaseFormQuestionResponse[];
  externalId?: string | null;
  [key: string]: unknown;
}

export interface LatestCaseIdItem {
  caseId: string;
}

export interface LatestCaseIdResponse {
  success: boolean;
  data: LatestCaseIdItem;
}

export type CaseDocumentFormat = "base64" | "url" | string;

export type CaseSortOrder = "ASC" | "DESC";

export interface GetCaseFormResponsesParams {
  recordsPerPage?: number;
  sortBy?: string;
  sortOrder?: CaseSortOrder;
}

export interface FetchCaseDetailsParams {
  includeAttachments?: boolean;
  documentFormat?: CaseDocumentFormat;
  includeCalendarEvents?: boolean;
  includeOrders?: boolean;
  includeCaseProducts?: boolean;
  includePayments?: boolean;
}

export interface GetCasesParams {
  includePayments?: boolean;
  startTime?: string;
  endTime?: string;
  recordsPerPage?: number;
  includeAttachments?: boolean;
  includeOrders?: boolean;
  includeCalendarEvents?: boolean;
  documentFormat?: CaseDocumentFormat;
}
