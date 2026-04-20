import type { CaseDetailsItem } from "@/types/care-validate/case_types";
import type { PatientDocumentItem } from "@/types/care-validate/document_types";

export interface NormalizedDocumentItem {
  id: string;
  fileName: string;
  extension: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
  isPHI: boolean;
  isRestricted: boolean;
  category: string | null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

function normalizeDocument(raw: unknown): NormalizedDocumentItem | null {
  const row = toRecord(raw);
  const uploadedByObj = toRecord(row.uploadedBy);

  const fileName = String(row.fileName ?? row.name ?? "").trim();
  const id = String(row.id ?? "").trim();
  const createdAt = String(row.createdAt ?? "").trim();
  const url = String(row.url ?? row.fileUrl ?? "").trim();

  if (!id || !fileName) return null;
  if (Boolean(row.isDeleted)) return null;

  const uploaderName = [uploadedByObj.firstName, uploadedByObj.lastName]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return {
    id,
    fileName,
    extension: getExtension(fileName),
    url,
    uploadedBy: uploaderName || "Unknown",
    createdAt,
    isPHI: Boolean(row.isPHI),
    isRestricted: Boolean(row.isRestricted),
    category: row.category ? String(row.category) : null,
  };
}

export function normalizeCaseDocuments(caseDetails: CaseDetailsItem): NormalizedDocumentItem[] {
  const rawAttachments = Array.isArray(caseDetails.raw?.attachments)
    ? caseDetails.raw.attachments
    : [];

  return rawAttachments
    .map(normalizeDocument)
    .filter((doc): doc is NormalizedDocumentItem => doc !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function normalizeUserDocuments(
  userDocs: PatientDocumentItem[]
): NormalizedDocumentItem[] {
  return userDocs
    .map((doc) => {
      const nestedRaw = toRecord(doc.raw?.raw);
      return normalizeDocument({
        id: doc.id,
        fileName: doc.fileName || doc.raw?.fileName || nestedRaw.fileName,
        url: nestedRaw.url || doc.raw?.url,
        createdAt: doc.createdAt || doc.raw?.createdAt || nestedRaw.createdAt,
        uploadedBy: nestedRaw.uploadedBy,
        isPHI: nestedRaw.isPHI,
        isRestricted: nestedRaw.isRestricted,
        category: doc.raw?.type || "GENERAL",
        isDeleted: nestedRaw.isDeleted,
      });
    })
    .filter((doc): doc is NormalizedDocumentItem => doc !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function formatDocumentDate(isoDate: string): string {
  if (!isoDate) return "Unknown date";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

