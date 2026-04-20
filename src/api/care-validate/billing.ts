import { axiosService } from "@/api/http/axiosInstance";
import type {
  BillingCaseItem,
  FetchBillingCasesResponse,
  FetchBillingPaymentsResponse,
  FetchBillingPaymentMethodsResponse,
} from "@/types/care-validate/billing_types";

const BILLING_CASES_ENDPOINT = "/api/patient/billing/cases";
const BILLING_PAYMENT_METHODS_ENDPOINT = "/api/patient/billing/payment-methods";
const BILLING_PAYMENTS_ENDPOINT = "/api/patient/billing/payments";

function mapBillingCase(raw: unknown): BillingCaseItem {
  const row = (raw ?? {}) as Record<string, unknown>;

  return {
    id: String(row.id ?? ""),
    shortId: String(row.shortId ?? ""),
    title: String(row.title ?? ""),
    status: String(row.status ?? "OPEN"),
    createdAt: String(row.createdAt ?? ""),
    updatedAt: String(row.updatedAt ?? ""),
    payments: Array.isArray(row.payments) ? row.payments : [],
    subscriptions: Array.isArray(row.subscriptions) ? row.subscriptions : [],
    raw: (row.raw ?? {}) as BillingCaseItem["raw"],
  };
}

export async function fetchBillingCases(): Promise<BillingCaseItem[]> {
  const res = await axiosService.get<FetchBillingCasesResponse>(BILLING_CASES_ENDPOINT);
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];

  return rows.map(mapBillingCase);
}

export async function fetchBillingPaymentMethods(): Promise<unknown> {
  const res = await axiosService.get<FetchBillingPaymentMethodsResponse>(
    BILLING_PAYMENT_METHODS_ENDPOINT
  );

  return res.data?.data;
}

export async function fetchBillingPayments(): Promise<unknown> {
  const res = await axiosService.get<FetchBillingPaymentsResponse>(
    BILLING_PAYMENTS_ENDPOINT
  );

  return res.data?.data;
}
