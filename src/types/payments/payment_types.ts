/**
 * Patient payments API (doc #34–35). Both endpoints proxy directly to
 * Stripe; the response `data` is whatever Stripe returns (we keep it
 * `unknown` and let consumers narrow when they actually use it).
 */

export interface PaymentMetadata {
  email?: string;
  phone?: string;
  [key: string]: string | undefined;
}

export interface CreateSetupIntentBody {
  metadata?: PaymentMetadata;
}

export interface CreatePaymentIntentBody {
  /** Positive number — amount in the currency's major unit (e.g. dollars). */
  amount: number;
  paymentMethodTypes?: string[];
  metadata?: PaymentMetadata;
}

export interface PaymentSetupResult {
  /** Stripe SetupIntent — `client_secret`, `id`, etc. depending on backend. */
  [key: string]: unknown;
}

export interface PaymentIntentResult {
  /** Stripe PaymentIntent. */
  [key: string]: unknown;
}

export interface CreateSetupIntentResponse {
  success: boolean;
  data: PaymentSetupResult;
  message?: string | null;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  data: PaymentIntentResult;
  message?: string | null;
}
