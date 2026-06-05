import { useMutation } from "@tanstack/react-query";
import {
  createPaymentIntent,
  createSetupIntent,
} from "@/api/payments/payments";
import type {
  CreatePaymentIntentBody,
  CreateSetupIntentBody,
  PaymentIntentResult,
  PaymentSetupResult,
} from "@/types/payments/payment_types";

/** `POST /api/patient/payments/setup` (doc #34). */
export function useCreateSetupIntent() {
  return useMutation<PaymentSetupResult, unknown, CreateSetupIntentBody | void>({
    mutationFn: (body) => createSetupIntent(body ?? {}),
  });
}

/** `POST /api/patient/payments/intent` (doc #35). */
export function useCreatePaymentIntent() {
  return useMutation<PaymentIntentResult, unknown, CreatePaymentIntentBody>({
    mutationFn: (body) => createPaymentIntent(body),
  });
}
