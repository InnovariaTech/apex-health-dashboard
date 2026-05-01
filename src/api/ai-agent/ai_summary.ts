import { axiosService } from "@/api/http/axiosInstance";
import type {
  PatientSummariesData,
  PatientSummary,
  SummaryApiResponse,
} from "@/types/ai-agent/ai_summary_types";

const GENERATE_SUMMARY_ENDPOINT = "/api/patient/summary";
const GET_LATEST_SUMMARY_ENDPOINT = "/api/patient/summary";
const GET_ALL_SUMMARIES_ENDPOINT = "/api/patient/summaries";

function mapPatientSummary(raw: unknown): PatientSummary {
  const row = (raw ?? {}) as Record<string, unknown>;

  return {
    id: String(row.id ?? ""),
    patientId: String(row.patientId ?? ""),
    summaryText: String(row.summaryText ?? ""),
    healthScore: typeof row.healthScore === "number" ? row.healthScore : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as PatientSummary["metadata"])
        : null,
    createdAt: String(row.createdAt ?? ""),
    updatedAt: String(row.updatedAt ?? ""),
  };
}

export async function generatePatientSummary(): Promise<PatientSummary> {
  const res = await axiosService.post<SummaryApiResponse<unknown>>(
    GENERATE_SUMMARY_ENDPOINT,
    {}
  );
  return mapPatientSummary(res.data?.data);
}

export async function fetchLatestPatientSummary(): Promise<PatientSummary> {
  const res = await axiosService.get<SummaryApiResponse<unknown>>(
    GET_LATEST_SUMMARY_ENDPOINT
  );
  return mapPatientSummary(res.data?.data);
}

export async function fetchAllPatientSummaries(): Promise<PatientSummariesData> {
  const res = await axiosService.get<SummaryApiResponse<{
    items?: unknown[];
    total?: number;
  }>>(GET_ALL_SUMMARIES_ENDPOINT);

  const rows = Array.isArray(res.data?.data?.items) ? res.data.data.items : [];

  return {
    items: rows.map(mapPatientSummary),
    total:
      typeof res.data?.data?.total === "number"
        ? res.data.data.total
        : rows.length,
  };
}
