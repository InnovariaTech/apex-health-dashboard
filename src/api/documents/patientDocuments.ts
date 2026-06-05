import { axiosService } from "@/api/http/axiosInstance";
import type {
  PatientDocument,
  UploadDocumentPayload,
} from "@/types/documents/document_types";

/**
 * Patient documents — `/api/patient/documents/*`.
 * See `docs/documents/document-apis (1).md`.
 *
 * Envelope is `{ success: true, data: ... }` for list/upload/delete, and raw
 * binary for download (no envelope — the response IS the file).
 */

const BASE = "/api/patient/documents";

interface Envelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const env = payload as Envelope<T>;
    if (env.success === false) {
      throw new Error(env.message || "Request failed");
    }
    return env.data as T;
  }
  return payload as T;
}

export async function listDocuments(): Promise<PatientDocument[]> {
  const res = await axiosService.get<Envelope<PatientDocument[]>>(BASE);
  return unwrap<PatientDocument[]>(res.data) ?? [];
}

export async function uploadDocument(
  payload: UploadDocumentPayload,
): Promise<PatientDocument> {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("category", payload.category);

  const res = await axiosService.post<Envelope<PatientDocument>>(BASE, form, {
    // Let the browser set the multipart boundary — overriding the default
    // application/json header that the axios singleton injects.
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap<PatientDocument>(res.data);
}

export async function deleteDocument(id: string): Promise<void> {
  await axiosService.delete<Envelope<null>>(`${BASE}/${id}`);
}

/**
 * Downloads the file binary, builds an object URL, and triggers a browser
 * download. Doc note: `Content-Disposition` is set server-side, but we still
 * pass `filename` so the anchor's `download` attribute wins if disposition is
 * missing on the wire.
 */
export async function downloadDocument(id: string, filename: string): Promise<void> {
  const res = await axiosService.get<Blob>(`${BASE}/${id}/download`, {
    responseType: "blob",
  });
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data as BlobPart]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
