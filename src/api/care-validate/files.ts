/**
 * Patient files — Portal-JWT-protected endpoints under `/api/patient/files/*`
 * (doc #11–15). The user must have completed CareValidate OTP verification
 * after login or these routes return `400 "CareValidate portal session is
 * missing"`.
 */
import { axiosService } from "@/api/http/axiosInstance";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  type AllowedUploadMimeType,
  type DeleteFileResponse,
  type FileDownloadUrl,
  type FileDownloadUrlResponse,
  type FileMetadata,
  type FileMetadataResponse,
  type FileUploadedBy,
  type RenameFileBody,
  type UploadFileBody,
} from "@/types/care-validate/document_types";

const FILES_ENDPOINT = "/api/patient/files";
const FILES_UPLOAD_ENDPOINT = `${FILES_ENDPOINT}/upload`;

const buildFileEndpoint = (id: string) =>
  `${FILES_ENDPOINT}/${encodeURIComponent(id)}`;

function mapUploadedBy(raw: unknown): FileUploadedBy | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const out: FileUploadedBy = {};
  if (typeof row.id === "string") out.id = row.id;
  if (typeof row.firstName === "string") out.firstName = row.firstName;
  if (typeof row.lastName === "string") out.lastName = row.lastName;
  return Object.keys(out).length > 0 ? out : null;
}

function mapFileMetadata(raw: unknown): FileMetadata {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    fileName: String(row.fileName ?? ""),
    isPHI: Boolean(row.isPHI),
    isRestricted: Boolean(row.isRestricted),
    caseId: String(row.caseId ?? ""),
    uploadedBy: mapUploadedBy(row.uploadedBy),
    createdAt: String(row.createdAt ?? ""),
  };
}

function mapFileDownloadUrl(raw: unknown): FileDownloadUrl {
  const row = (raw ?? {}) as Record<string, unknown>;
  const expiresInRaw = Number(row.expiresIn ?? 0);
  return {
    downloadUrl: String(row.downloadUrl ?? ""),
    fileName: String(row.fileName ?? ""),
    expiresIn: Number.isFinite(expiresInRaw) ? expiresInRaw : 0,
  };
}

/** Returns true if the MIME type is one CareValidate will accept. */
export function isAllowedUploadMimeType(
  mimeType: string
): mimeType is AllowedUploadMimeType {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Reads a `File` and returns its raw bytes as base64 (no `data:` URI prefix),
 * ready for `uploadFile`.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to read file"));
        return;
      }
      // `result` looks like `data:application/pdf;base64,JVBERi0xLjQK…`.
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

/** `GET /api/patient/files/:id/metadata` (doc #11). */
export async function getFileMetadata(id: string): Promise<FileMetadata> {
  const res = await axiosService.get<FileMetadataResponse>(
    `${buildFileEndpoint(id)}/metadata`
  );
  return mapFileMetadata(res.data?.data);
}

/** `GET /api/patient/files/:id/download` (doc #12). */
export async function getFileDownloadUrl(id: string): Promise<FileDownloadUrl> {
  const res = await axiosService.get<FileDownloadUrlResponse>(
    `${buildFileEndpoint(id)}/download`
  );
  return mapFileDownloadUrl(res.data?.data);
}

/** `POST /api/patient/files/upload` (doc #13). */
export async function uploadFile(body: UploadFileBody): Promise<FileMetadata> {
  const res = await axiosService.post<FileMetadataResponse>(
    FILES_UPLOAD_ENDPOINT,
    body
  );
  return mapFileMetadata(res.data?.data);
}

/** `PATCH /api/patient/files/:id/metadata` (doc #14). */
export async function renameFile(
  id: string,
  fileName: string
): Promise<FileMetadata> {
  const body: RenameFileBody = { fileName };
  const res = await axiosService.patch<FileMetadataResponse>(
    `${buildFileEndpoint(id)}/metadata`,
    body
  );
  return mapFileMetadata(res.data?.data);
}

/** `DELETE /api/patient/files/:id` (doc #15). */
export async function deleteFile(id: string): Promise<DeleteFileResponse> {
  const res = await axiosService.delete<DeleteFileResponse>(buildFileEndpoint(id));
  const message = res.data?.message;
  return {
    success: Boolean(res.data?.success),
    ...(typeof message === "string" ? { message } : {}),
  };
}
