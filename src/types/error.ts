export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export function isApiError(error: unknown): error is ApiError {
  if (!error || typeof error !== "object") return false;
  return "message" in error && "status" in error;
}
