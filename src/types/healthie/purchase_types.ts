/**
 * The public "buy a form" flow, sold through Healthie — `/api/public/*`. No login.
 * See `Documents/healthie-ai-form-builder-docs/healthie/public-purchase-api.md`.
 */

/** `GET /api/public/products/:formKey`. */
export interface PublicProduct {
  formKey: string;
  name: string;
  description: string | null;
  /** In currency units — 25 means $25.00. Exactly what the charge takes. */
  price: number;
  currency: string;
  /** True when the product bills on a schedule: this charge is the first payment, Healthie runs the rest. */
  recurring: boolean;
  /** Healthie's wording: `One-Time`, `Monthly`, `Yearly`, `Weekly`, `Bi-Weekly`, `Quarterly`… */
  billingFrequency: string | null;
  /** How many payments a recurring product takes in all. Null means until cancelled. */
  repeatTimes: number | null;
  /** Healthie's Stripe key (not ours). Null means payments are off: show "not available". */
  publishableKey: string | null;
}

/** `POST /api/public/checkout/start` — strict body. */
export interface CheckoutStartPayload {
  formKey: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface CheckoutStartResult {
  /** The purchase's credential for the next calls. Expires after 30 minutes. */
  purchaseToken: string;
  expiresAt: string;
  amount: number;
  currency: string;
}

/** `POST /api/public/checkout/pay` — strict body. */
export interface CheckoutPayPayload {
  purchaseToken: string;
  /** A Stripe card token (`tok_…`) made with the product's `publishableKey`. Works once. */
  cardToken: string;
}

export interface CheckoutPayment {
  id: string;
  status: "paid" | "failed" | "pending";
  amount: number;
  currency: string;
  description: string | null;
  card: { brand: string; last4: string } | null;
  failureReason: string | null;
  refundedAmount: number | null;
  reference: string | null;
  createdAt?: string;
}

/** `POST /api/public/checkout/status`. */
export interface CheckoutStatus {
  paid: boolean;
  paymentId: string | null;
  paidAt: string | null;
}

/** Kept in sessionStorage so a reload mid-purchase carries on rather than starting over. */
export interface SavedPurchase {
  formKey: string;
  purchaseToken: string;
  expiresAt: string;
  amount: number;
  currency: string;
  email: string;
}
