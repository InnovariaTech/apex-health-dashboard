import { axiosService } from "@/api/http/axiosInstance";
import type {
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

export async function fetchPatientDocuments(): Promise<PatientDocumentItem[]> {
  const res = await axiosService.get<FetchPatientDocumentsResponse>(DOCUMENTS_ENDPOINT);
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];

  return rows.map(mapPatientDocument);
}
