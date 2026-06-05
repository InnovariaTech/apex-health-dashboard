/**
 * Patient payments — Stripe-backed endpoints under `/api/patient/payments/*`
 * (doc #34–35). All routes require a valid `apex_access_token` cookie; they
 * do **not** need the CareValidate portal JWT.
 */
import { axiosService } from "@/api/http/axiosInstance";
import type {
  CreatePaymentIntentBody,
  CreatePaymentIntentResponse,
  CreateSetupIntentBody,
  CreateSetupIntentResponse,
  PaymentIntentResult,
  PaymentSetupResult,
} from "@/types/payments/payment_types";

const PAYMENTS_SETUP_ENDPOINT = "/api/patient/payments/setup";
const PAYMENTS_INTENT_ENDPOINT = "/api/patient/payments/intent";

/** `POST /api/patient/payments/setup` (doc #34). */
export async function createSetupIntent(
  body: CreateSetupIntentBody = {}
): Promise<PaymentSetupResult> {
  const res = await axiosService.post<CreateSetupIntentResponse>(
    PAYMENTS_SETUP_ENDPOINT,
    body
  );
  const data = res.data?.data;
  return (data && typeof data === "object" ? data : {}) as PaymentSetupResult;
}

/** `POST /api/patient/payments/intent` (doc #35). */
export async function createPaymentIntent(
  body: CreatePaymentIntentBody
): Promise<PaymentIntentResult> {
  if (!Number.isFinite(body.amount) || body.amount <= 0) {
    throw new Error("createPaymentIntent: amount must be a positive number");
  }
  const res = await axiosService.post<CreatePaymentIntentResponse>(
    PAYMENTS_INTENT_ENDPOINT,
    body
  );
  const data = res.data?.data;
  return (data && typeof data === "object" ? data : {}) as PaymentIntentResult;
}
