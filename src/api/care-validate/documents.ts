import { axiosService } from "@/api/http/axiosInstance";
import type {
  AnalyzeDocumentResponse,
  AnalyzeDocumentResult,
  FetchPatientDocumentsResponse,
  PatientDocumentItem,
} from "@/types/care-validate/document_types";

const DOCUMENTS_ENDPOINT = "/api/patient/my-documents";

function mapPatientDocument(raw: unknown): PatientDocumentItem {
  const row = (raw ?? {}) as Record<string, unknown>;

  return {
    id: String(row.id ?? ""),
    fileName: String(row.fileName ?? ""),
    createdAt: String(row.createdAt ?? ""),
    caseId: String(row.caseId ?? ""),
    raw: (row.raw ?? {}) as PatientDocumentItem["raw"],
  };
}

function mapAnalyzeDocument(raw: unknown): AnalyzeDocumentResult {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    sessionId: String(row.sessionId ?? ""),
    triggerMessage: String(row.triggerMessage ?? ""),
  };
}

/** `GET /api/patient/my-documents` (doc #8). Portal JWT required. */
export async function fetchPatientDocuments(): Promise<PatientDocumentItem[]> {
  const res = await axiosService.get<FetchPatientDocumentsResponse>(DOCUMENTS_ENDPOINT);
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];

  return rows.map(mapPatientDocument);
}

/**
 * `POST /api/patient/my-documents/:docId/analyze` (doc #10). Opens an AI
 * chat session against the document and returns the session id plus the
 * seed message the assistant should consume first.
 */
export async function analyzeDocument(
  docId: string
): Promise<AnalyzeDocumentResult> {
  const safeDocId = encodeURIComponent(docId);
  const res = await axiosService.post<AnalyzeDocumentResponse>(
    `${DOCUMENTS_ENDPOINT}/${safeDocId}/analyze`,
    {}
  );
  return mapAnalyzeDocument(res.data?.data);
}
