import { axiosService } from "@/api/http/axiosInstance";
import type {
  CheckoutPayment,
  CheckoutPayPayload,
  CheckoutStartPayload,
  CheckoutStartResult,
  CheckoutStatus,
  PublicProduct,
} from "@/types/healthie/purchase_types";

/**
 * The public purchase of a form sold through Healthie: product → start → pay → status.
 * No session — the purchase token in the body is the credential, and it never goes in a URL.
 * Rate limited per IP / per token; a 429 means back off.
 */

const BASE = "/api/public";

function unwrap<T>(body: unknown): T {
  return (body as { data: T }).data;
}

export async function getPublicProduct(formKey: string): Promise<PublicProduct> {
  const res = await axiosService.get(`${BASE}/products/${encodeURIComponent(formKey)}`);
  return unwrap<PublicProduct>(res.data);
}

/**
 * Creates the patient and the purchase. Same email again for an unpaid purchase continues it;
 * once paid, a 409 ("An account already exists… Log in to continue").
 */
export async function startCheckout(payload: CheckoutStartPayload): Promise<CheckoutStartResult> {
  const res = await axiosService.post(`${BASE}/checkout/start`, payload);
  return unwrap<CheckoutStartResult>(res.data);
}

/** Charges the card. Paying twice for one purchase is safe — the existing payment comes back. */
export async function payCheckout(payload: CheckoutPayPayload): Promise<CheckoutPayment> {
  const res = await axiosService.post(`${BASE}/checkout/pay`, payload);
  return unwrap<CheckoutPayment>(res.data);
}

/** Asked after a lost or timed-out pay, before letting the visitor pay again. */
export async function getCheckoutStatus(purchaseToken: string): Promise<CheckoutStatus> {
  const res = await axiosService.post(`${BASE}/checkout/status`, { purchaseToken });
  return unwrap<CheckoutStatus>(res.data);
}
