export type BillingCaseStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "CLOSED"
  | "ARCHIVED"
  | "ESCALATED"
  | string;

export interface BillingCaseRaw {
  id: string;
  type?: string;
  title: string;
  status: BillingCaseStatus;
  shortId: string;
  createdAt: string;
  updatedAt: string;
  payments?: unknown[];
  subscriptions?: unknown[];
  [key: string]: unknown;
}

export interface BillingCaseItem {
  id: string;
  shortId: string;
  title: string;
  status: BillingCaseStatus;
  createdAt: string;
  updatedAt: string;
  payments: unknown[];
  subscriptions: unknown[];
  raw: BillingCaseRaw;
}

export interface FetchBillingCasesResponse {
  success?: boolean;
  data: BillingCaseItem[];
}

export interface FetchBillingPaymentMethodsResponse {
  success?: boolean;
  data: unknown;
  [key: string]: unknown;
}

export interface FetchBillingPaymentsResponse {
  success?: boolean;
  data: unknown;
  [key: string]: unknown;
}
