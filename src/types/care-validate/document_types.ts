export interface DocumentUploader {
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export interface DocumentInnerRaw {
  id?: string;
  isRestricted?: boolean;
  isPHI?: boolean;
  fileName?: string;
  isDeleted?: boolean;
  createdAt?: string;
  uploadedBy?: DocumentUploader;
  url?: string;
  [key: string]: unknown;
}

export interface DocumentRaw {
  id?: string;
  fileName?: string;
  createdAt?: string;
  type?: string | null;
  caseId?: string;
  source?: string;
  raw?: DocumentInnerRaw;
  [key: string]: unknown;
}

export interface PatientDocumentItem {
  id: string;
  fileName: string;
  createdAt: string;
  caseId: string;
  raw: DocumentRaw;
}

export interface FetchPatientDocumentsResponse {
  success: boolean;
  data: PatientDocumentItem[];
}

// ─── Files (Portal JWT) ─────────────────────────────────────────────────────
// All `/api/patient/files/*` endpoints (doc #11–15) share a single per-file
// metadata shape returned by every operation that touches a file.

/** MIME types accepted by `POST /api/patient/files/upload` (doc #13). */
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/tiff",
  "image/webp",
] as const;

export type AllowedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

export interface FileUploadedBy {
  id?: string;
  firstName?: string;
  lastName?: string;
}

export interface FileMetadata {
  id: string;
  fileName: string;
  isPHI: boolean;
  isRestricted: boolean;
  caseId: string;
  uploadedBy: FileUploadedBy | null;
  createdAt: string;
}

export interface UploadFileBody {
  /** 1–255 chars. */
  name: string;
  /** Base64-encoded file content (no `data:` URI prefix). */
  data: string;
  /** Active case UUID — portal rejects uploads to closed cases. */
  caseId: string;
  /** Must be one of the allowed MIME types above. */
  mimeType: string;
}

export interface RenameFileBody {
  fileName: string;
}

export interface FileDownloadUrl {
  downloadUrl: string;
  fileName: string;
  /** Seconds the URL stays valid for. */
  expiresIn: number;
}

export interface FileMetadataResponse {
  success: boolean;
  data: FileMetadata;
}

export interface FileDownloadUrlResponse {
  success: boolean;
  data: FileDownloadUrl;
}

export interface DeleteFileResponse {
  success: boolean;
  message?: string;
}

// ─── Document analysis ──────────────────────────────────────────────────────

export interface AnalyzeDocumentResult {
  sessionId: string;
  /**
   * Seed message the AI assistant should consume to kick off analysis.
   * Returned verbatim by the backend (doc #10).
   */
  triggerMessage: string;
}

export interface AnalyzeDocumentResponse {
  success: boolean;
  data: AnalyzeDocumentResult;
}
