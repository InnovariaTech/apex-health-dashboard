/**
 * API mode: `mock` uses in-memory data; `http` will use VITE_API_BASE_URL (MERN backend).
 */
export const API_MODE = import.meta.env.VITE_API_MODE ?? "http";

/**
 * Which backend this app talks to: `VITE_BACKEND=local` (your own API on this machine) or `live`
 * (the hosted API). Set it in `.env.local`, or start with `npm run dev:local` / `npm run dev:live`.
 * Unset — as on Netlify, where `.env.local` never goes — `VITE_API_BASE_URL` decides, as before.
 */
export type BackendMode = "local" | "live";
const mode = import.meta.env.VITE_BACKEND;
export const BACKEND_MODE: BackendMode | null = mode === "local" || mode === "live" ? mode : null;

const BACKEND_URLS: Record<BackendMode, string> = {
  local: import.meta.env.VITE_API_URL_LOCAL ?? "http://localhost:5000",
  live: import.meta.env.VITE_API_URL_LIVE ?? "https://apexmd-test.duckdns.org",
};

export const API_BASE_URL = BACKEND_MODE
  ? BACKEND_URLS[BACKEND_MODE]
  : import.meta.env.VITE_API_BASE_URL ?? "https://api-staging.innovariatech.space";

if (import.meta.env.DEV) console.info(`[api] ${BACKEND_MODE ?? "env"} backend: ${API_BASE_URL}`);
