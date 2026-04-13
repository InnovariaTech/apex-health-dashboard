import type { AxiosError } from "axios";
import { toast } from "sonner";
import { isApiError } from "../types/error";
import type { ApiError } from "../types/error";

function getPayloadMessage(payload: unknown): string | null {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return null;

  if ("message" in payload && typeof (payload as { message?: unknown }).message === "string") {
    return (payload as { message: string }).message;
  }
  if ("error" in payload && typeof (payload as { error?: unknown }).error === "string") {
    return (payload as { error: string }).error;
  }
  return null;
}

export function extractErrorMessage(error: AxiosError | ApiError | unknown): string {
  if (isApiError(error)) return error.message;
  if (error && typeof error === "object" && "response" in error) {
    const axiosLike = error as AxiosError;
    return (
      getPayloadMessage(axiosLike.response?.data) ||
      axiosLike.message ||
      "An unexpected error occurred"
    );
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export function normalizeApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (error && typeof error === "object" && "response" in error) {
    const axiosLike = error as AxiosError;
    return {
      message: extractErrorMessage(axiosLike),
      status: axiosLike.response?.status ?? 500,
      ...(axiosLike.code ? { code: axiosLike.code } : {}),
      details: axiosLike.response?.data,
    };
  }

  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }

  return { message: "Something went wrong", status: 500 };
}

function getFriendlyMessage(message: string): string {
  const m = String(message || "").toLowerCase();
  if (m.includes("unauthorized") || m.includes("forbidden")) return "Your session has expired. Please log in again.";
  if (m.includes("validation") || m.includes("invalid")) return "Please check your input and try again.";
  if (m.includes("not found")) return "Requested resource was not found.";
  if (m.includes("already exists") || m.includes("duplicate")) return "This record already exists.";
  if (m.includes("timeout")) return "The request timed out. Please try again.";
  if (m.includes("network error") || m.includes("network changed")) {
    return "Network error. Please check your connection.";
  }
  if (m.includes("past due date")) return "Can't request payment for past due date.";
  return message || "Something went wrong";
}

export function showApiErrorToast(error: ApiError): void {
  console.error("API Error:", { message: error.message, status: error.status, code: error.code });
  toast.error(getFriendlyMessage(error.message));
}

export function handleApiError(error: unknown): ApiError {
  const apiError = normalizeApiError(error);
  showApiErrorToast(apiError);
  return apiError;
}

export const handleError = handleApiError;
export const hadndleApiErrorToast = handleApiError;
