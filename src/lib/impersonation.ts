/**
 * Admin "view as user" impersonation — client state.
 *
 * The impersonation cookie is httpOnly (JS can't read it) and `/auth/me` does
 * not report the impersonated patient, so we persist the session's identity +
 * read-only flag in sessionStorage. It survives reloads within the tab and is
 * cleared on exit / tab close. `useAuthUser` reads this to drive the app's
 * identity while impersonating instead of calling `/auth/me`.
 */
import type { AuthUser } from "@/types/auth_types";

const KEY = "apex_impersonation";

export interface ImpersonationState {
  user: AuthUser;
  readOnly: boolean;
}

export function getImpersonation(): ImpersonationState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ImpersonationState) : null;
  } catch {
    return null;
  }
}

export function setImpersonation(state: ImpersonationState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — impersonation still works for this page load */
  }
}

export function clearImpersonation(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function isImpersonating(): boolean {
  return getImpersonation() !== null;
}

/** True when the current session is a read-only impersonation. */
export function isReadOnly(): boolean {
  const s = getImpersonation();
  return !!s && s.readOnly;
}
