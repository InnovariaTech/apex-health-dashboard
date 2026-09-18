/**
 * Client-side persistence of the intake token, for the one case where the URL
 * doesn't carry it: the Stripe **return** page (`/intake/return`).
 *
 * The return URL deliberately has no token (it would end up in Stripe's records
 * and the referrer chain), so we stash the token in sessionStorage during the
 * walk and recover it on return to finish the walk. Session-scoped, per-tab,
 * survives the Stripe round-trip; never sent anywhere.
 */

const KEY = "apex_intake_token";

export function saveIntakeToken(token: string): void {
  if (!token) return;
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    /* private mode / blocked storage — the walk still works from the URL */
  }
}

export function loadIntakeToken(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
