/**
 * Patient document types — backs `src/api/documents/patientDocuments.ts`.
 * See `docs/documents/document-apis (1).md`.
 *
 * Distinct from the care-validate documents stack — this is the simple
 * `/patient/documents` upload bucket (file + category), no case linkage,
 * no AI analysis.
 */

export const DOCUMENT_CATEGORIES = [
  "lab_report",
  "prescription",
  "imaging",
  "insurance",
  "other",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/** The five enum values are the only ones the server accepts (POST returns 400 otherwise). */
export interface DocumentCategoryMeta {
  value: DocumentCategory;
  label: string;
}

export const DOCUMENT_CATEGORY_META: DocumentCategoryMeta[] = [
  { value: "lab_report", label: "Lab Report" },
  { value: "prescription", label: "Prescription" },
  { value: "imaging", label: "Imaging" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
];

export interface PatientDocument {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentPayload {
  file: File;
  category: DocumentCategory;
}

/**
 * Client-side accepted file types per the user's spec. The server may accept
 * more (the doc says "wrong type" returns 400 but doesn't enumerate), but we
 * restrict to these three to match product intent.
 */
export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const ALLOWED_UPLOAD_ACCEPT = ALLOWED_UPLOAD_MIME_TYPES.join(",");

export function isAllowedUploadMimeType(mime: string): boolean {
  return (ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(mime);
}
