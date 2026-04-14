import type { AxiosError } from "axios";
import { toast } from "sonner";
import { isApiError } from "@/api/types";
import type { ApiError } from "@/api/types";

export interface ApiErrorDetails {
  message: string;
  status: number;
  code?: string;
  responseData?: unknown;
}

function getPayloadMessage(payload: unknown): string | null {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;

  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  if (typeof record.detail === "string") return record.detail;

  if (record.error && typeof record.error === "object") {
    const nestedErrorMessage = getPayloadMessage(record.error);
    if (nestedErrorMessage) return nestedErrorMessage;
  }

  if (record.data && typeof record.data === "object") {
    const nestedDataMessage = getPayloadMessage(record.data);
    if (nestedDataMessage) return nestedDataMessage;
  }

  if (Array.isArray(record.errors) && record.errors.length > 0) {
    const firstError = record.errors[0];
    if (typeof firstError === "string") return firstError;
    const nestedArrayMessage = getPayloadMessage(firstError);
    if (nestedArrayMessage) return nestedArrayMessage;
  }

  return null;
}

function isAxiosLikeError(error: unknown): error is AxiosError {
  return Boolean(error && typeof error === "object" && "response" in error);
}

export function extractErrorMessage(error: AxiosError | ApiError | unknown): string {
  if (isAxiosLikeError(error)) {
    return (
      getPayloadMessage(error.response?.data) ||
      error.message ||
      "An unexpected error occurred"
    );
  }
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export function extractApiErrorDetails(error: unknown): ApiErrorDetails {
  if (isAxiosLikeError(error)) {
    return {
      message: extractErrorMessage(error),
      status: error.response?.status ?? 500,
      ...(error.code ? { code: error.code } : {}),
      ...(error.response?.data !== undefined ? { responseData: error.response.data } : {}),
    };
  }

  if (isApiError(error)) {
    return {
      message: error.message,
      status: error.status,
      ...(error.code ? { code: error.code } : {}),
      ...(error.details !== undefined ? { responseData: error.details } : {}),
    };
  }

  if (error instanceof Error) {
    return { message: error.message, status: 500 };
  }

  return { message: "Something went wrong", status: 500 };
}

export function extractDisplayErrorMessage(error: unknown): string {
  const details = extractApiErrorDetails(error);
  const payloadMessage = getPayloadMessage(details.responseData);
  return payloadMessage || details.message || "Something went wrong";
}

export function normalizeApiError(error: unknown): ApiError {
  const details = extractApiErrorDetails(error);
  return {
    message: details.message,
    status: details.status,
    ...(details.code ? { code: details.code } : {}),
    ...(details.responseData !== undefined ? { details: details.responseData } : {}),
  };
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
