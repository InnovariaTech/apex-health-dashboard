/**
 * Pages that run before (or without) a login session: the intake runtime and
 * public door (`/intake/…`, the token is the credential) and the admin
 * "view as user" exchange (`/impersonate`, arrives with only a one-time code).
 *
 * On these paths the app must not ask `/auth/me` and must not bounce to
 * `/login` when there is no session — a logged-out visitor is expected here.
 */
export function isPreAuthPath(pathname?: string): boolean {
  const path =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return path.startsWith("/intake/") || path === "/impersonate";
}
