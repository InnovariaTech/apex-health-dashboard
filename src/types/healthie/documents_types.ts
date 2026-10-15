/**
 * The patient's documents on their care-team record (Healthie chart) — `GET /api/patient/my-documents`.
 * Ids are numeric strings. See `Documents/healthie-ai-form-builder-docs/healthie/chart-documents-api.md`.
 */
export interface ChartDocument {
  id: string;
  fileName: string;
  createdAt: string;
  /** Who filed it. Their own upload when `uploadedBy.id` is the patient's user id; else the care team's. */
  uploadedBy: { id: string; firstName: string | null; lastName: string | null } | null;
}
