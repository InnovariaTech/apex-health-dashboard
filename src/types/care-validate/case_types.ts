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
  /**
   * Comma-separated status filter. CareValidate accepts:
   *   OPEN, ASSIGNED, IN_PROGRESS, APPROVED,
   *   REJECTED, NO_DECISION, ABANDONED
   * Omit to fetch every status; pass `ELIGIBLE_CASE_STATUSES` to limit
   * to the four "active" states the user can chat against or upload to.
   */
  status?: string;
}

/**
 * Cases that the user can actively chat against and attach documents to.
 * Anything else (`REJECTED`, `NO_DECISION`, `ABANDONED`) still shows on
 * the My Cases listing but is read-only.
 */
export const ELIGIBLE_CASE_STATUSES = "OPEN,ASSIGNED,IN_PROGRESS,APPROVED";

// ─── Create case (doc #2) ───────────────────────────────────────────────────

/**
 * Question-type enum from the CareValidate doc — covers both built-in
 * inputs and "widget" form questions.
 */
export type CaseQuestionType =
  | "TEXT"
  | "BOOLEAN"
  | "DATE"
  | "DATERANGE"
  | "SINGLESELECT"
  | "MULTISELECT"
  | "FILE"
  | "WIDGET_USER_ID_DOCUMENT"
  | "WIDGET_BMI"
  | "WIDGET_STATE_PICKER"
  | "WIDGET_VISIT_TYPE"
  | "STATEMENT"
  | string;

export type CaseQuestionGender = "MALE" | "FEMALE";

/**
 * Answer payload shape on case creation. Either an existing question
 * (`{ questionId, answer }`) or a new dynamic question
 * (`{ question, type, required, answer? }`).
 */
export type CreateCaseQuestionAnswer =
  | { questionId: string; answer: string }
  | {
      question: string;
      type: CaseQuestionType;
      required: boolean;
      answer?: string;
    };

export interface CaseShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface CreateCaseBody {
  firstName: string;
  lastName: string;
  email: string;
  dob?: string;
  gender?: CaseQuestionGender;
  phoneNumber?: string;
  password?: string;
  status?: CaseStatus;
  /** Required when `formId` is absent. */
  formTitle?: string;
  formDescription?: string;
  /** Required when `formTitle` is absent. */
  formId?: string;
  shippingAddress?: CaseShippingAddress;
  languagePreferences?: string[];
  /** Min 1 item — see {@link CreateCaseQuestionAnswer}. */
  questions: CreateCaseQuestionAnswer[];
  paymentDescription?: string;
  paymentAmount?: number;
  stripeSetupId?: string;
  stripePaymentId?: string;
  nmiPaymentToken?: string;
  productBundleId?: string;
}

export interface CreateCaseResponse {
  success: boolean;
  data: CaseItem;
  message?: string | null;
}

// ─── Add dynamic form to existing case (doc #7) ─────────────────────────────

export interface AddCaseFormQuestion {
  /** UUID of an existing question, or a new one to create. */
  questionId: string;
  question: string;
  type: CaseQuestionType;
  required: boolean;
  /**
   * Answer payload — shape depends on the question type per CareValidate's
   * Form-Title-based encoding rules. Strings for most types, a JSON-stringified
   * array for MULTISELECT, a JSON-stringified object for WIDGET_BMI, and an
   * array of `{ name, data, contentType }` for FILE / WIDGET_USER_ID_DOCUMENT.
   */
  answer?: unknown;
  /** Required for SINGLESELECT / MULTISELECT. */
  options?: string[];
  phi?: boolean;
  hint?: string;
  placeholder?: string;
}

export interface AddCaseFormBody {
  formTitle: string;
  formDescription?: string;
  questions: AddCaseFormQuestion[];
}

export interface AddCaseFormResponse {
  success: boolean;
  data?: unknown;
  message?: string | null;
}
