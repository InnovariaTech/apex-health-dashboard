import { axiosService } from "@/api/http/axiosInstance";
import type { ChartDocument } from "@/types/healthie/documents_types";

/** Documents on the patient's care-team record, served from Healthie by the backend. */

export async function listChartDocuments(): Promise<ChartDocument[]> {
  const res = await axiosService.get("/api/patient/my-documents");
  const rows = ((res.data as { data?: { files?: unknown[] } | unknown[] })?.data ?? []) as unknown;
  const list = Array.isArray(rows) ? rows : ((rows as { files?: unknown[] }).files ?? []);
  return (list as Record<string, unknown>[]).map((row) => {
    const by = row.uploadedBy as Record<string, unknown> | null | undefined;
    return {
      id: String(row.id ?? ""),
      fileName: String(row.fileName ?? "Document"),
      createdAt: String(row.createdAt ?? ""),
      uploadedBy: by
        ? {
            id: String(by.id ?? ""),
            firstName: (by.firstName as string | null) ?? null,
            lastName: (by.lastName as string | null) ?? null,
          }
        : null,
    };
  });
}

/**
 * Opens a chart document in a new tab. Fetched as bytes with the session (download links are
 * short-lived, so a fresh read every time), shown from a temporary blob URL.
 */
export async function openChartDocument(id: string): Promise<void> {
  const win = window.open("", "_blank");
  const res = await axiosService.get(`/api/patient/files/${encodeURIComponent(id)}/content`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data as Blob);
  if (win) win.location.href = url;
  else window.location.assign(url);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
