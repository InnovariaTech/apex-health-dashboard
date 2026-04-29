import { axiosService } from "@/api/http/axiosInstance";
import type {
  BiomarkerCategoryMap,
  BiomarkerSummaryItem,
  BiomarkerTrendPoint,
  FetchBiomarkersSummaryResponse,
} from "@/types/biomarkers/biomarkers_types";

const PATIENT_BIOMARKERS_SUMMARY_ENDPOINT = "/api/patient/biomarkers/summary";

function mapBiomarkerTrendPoint(raw: unknown): BiomarkerTrendPoint {
  const row = (raw ?? {}) as Record<string, unknown>;

  return {
    ...row,
    value:
      typeof row.value === "number" || typeof row.value === "string"
        ? row.value
        : row.value == null
          ? null
          : String(row.value),
    date: String(row.date ?? ""),
    status: String(row.status ?? "") || "NORMAL",
    unit:
      typeof row.unit === "string" || row.unit === null
        ? (row.unit as string | null)
        : String(row.unit ?? ""),
  };
}

function mapBiomarkerSummaryItem(raw: unknown): BiomarkerSummaryItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  const trend = Array.isArray(row.trend) ? row.trend.map(mapBiomarkerTrendPoint) : [];

  return {
    ...row,
    biomarkerName: String(row.biomarkerName ?? ""),
    canonicalName: String(row.canonicalName ?? ""),
    loinc: String(row.loinc ?? ""),
    unit:
      typeof row.unit === "string" || row.unit === null
        ? (row.unit as string | null)
        : String(row.unit ?? ""),
    trend,
  };
}

function mapBiomarkersSummary(raw: unknown): BiomarkerCategoryMap {
  const source = (raw ?? {}) as Record<string, unknown>;
  const result: BiomarkerCategoryMap = {};

  Object.entries(source).forEach(([category, value]) => {
    if (Array.isArray(value)) {
      result[category] = value.map(mapBiomarkerSummaryItem);
    } else {
      result[category] = [];
    }
  });

  return result;
}

export async function fetchPatientBiomarkersSummary(): Promise<BiomarkerCategoryMap> {
  const res = await axiosService.get<FetchBiomarkersSummaryResponse>(
    PATIENT_BIOMARKERS_SUMMARY_ENDPOINT
  );

  return mapBiomarkersSummary(res.data?.data);
}

