import { useQuery } from "@tanstack/react-query";
import {
  fetchBillingCases,
  fetchBillingPayments,
  fetchBillingPaymentMethods,
} from "@/api/care-validate/billing";
import { queryKeys } from "@/hooks/queryKeys";
import type { BillingCaseItem } from "@/types/care-validate/billing_types";
import { CAREVALIDATE_ENABLED } from "@/constants/features";

export function useBilling() {
  return useQuery<BillingCaseItem[]>({
    enabled: CAREVALIDATE_ENABLED,
    queryKey: queryKeys.careValidate.billingCases(),
    queryFn: fetchBillingCases,
    staleTime: 60_000,
  });
}

export function useBillingPaymentMethods() {
  return useQuery<unknown>({
    enabled: CAREVALIDATE_ENABLED,
    queryKey: queryKeys.careValidate.billingPaymentMethods(),
    queryFn: fetchBillingPaymentMethods,
    staleTime: 60_000,
  });
}

export function useBillingPayments() {
  return useQuery<unknown>({
    enabled: CAREVALIDATE_ENABLED,
    queryKey: queryKeys.careValidate.billingPayments(),
    queryFn: fetchBillingPayments,
    staleTime: 60_000,
  });
}
