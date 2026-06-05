import { axiosService } from "@/api/http/axiosInstance";
import type {
  FetchAllPatientSummariesParams,
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

/**
 * `GET /api/patient/summaries` (doc #38). The doc shows `data` as a flat
 * array, but older / paginated responses sometimes return
 * `{ items, total }` — accept both, and forward optional `take`/`skip`
 * query params.
 */
export async function fetchAllPatientSummaries(
  params: FetchAllPatientSummariesParams = {}
): Promise<PatientSummariesData> {
  const { take, skip } = params;

  const res = await axiosService.get<
    SummaryApiResponse<unknown[] | { items?: unknown[]; total?: number } | null>
  >(GET_ALL_SUMMARIES_ENDPOINT, {
    params: {
      ...(typeof take === "number" ? { take } : {}),
      ...(typeof skip === "number" ? { skip } : {}),
    },
  });

  const payload = res.data?.data;
  let rawItems: unknown[] = [];
  let total: number | null = null;

  if (Array.isArray(payload)) {
    rawItems = payload;
  } else if (payload && typeof payload === "object") {
    const obj = payload as { items?: unknown[]; total?: number };
    if (Array.isArray(obj.items)) rawItems = obj.items;
    if (typeof obj.total === "number") total = obj.total;
  }

  const items = rawItems.map(mapPatientSummary);
  return {
    items,
    total: total ?? items.length,
  };
}
