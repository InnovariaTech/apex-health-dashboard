/**
 * API mode: `mock` uses in-memory data; `http` will use VITE_API_BASE_URL (MERN backend).
 */
export const API_MODE = import.meta.env.VITE_API_MODE ?? "http";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://api-staging.innovariatech.space";
