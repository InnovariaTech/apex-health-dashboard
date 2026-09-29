/**
 * API mode: `mock` uses in-memory data; `http` will use VITE_API_BASE_URL (MERN backend).
 */
export const API_MODE = import.meta.env.VITE_API_MODE ?? "http";

/**
 * Production builds call the API on their own origin (`/api/*`), which Netlify proxies to
 * the backend (see `public/_redirects`). The backend authenticates by cookie only, and iOS
 * WebKit drops cookies set by a different site — so a cross-site API call logs iPhone users
 * straight back out. Proxied, the auth cookies are first-party and survive.
 *
 * Local dev (`vite`) calls VITE_API_BASE_URL directly. Set VITE_API_PROXY=false to make a
 * production build do the same, e.g. when it is hosted somewhere without the proxy.
 */
const USE_SAME_ORIGIN_PROXY =
  import.meta.env.PROD && import.meta.env.VITE_API_PROXY !== "false";

export const API_BASE_URL = USE_SAME_ORIGIN_PROXY
  ? ""
  : (import.meta.env.VITE_API_BASE_URL ?? "https://api-staging.innovariatech.space");
