import { axiosService } from "@/api/http/axiosInstance";
import type {
  BiomarkerCategoryMap,
  BiomarkerReferenceRange,
  BiomarkerReferenceStatus,
  BiomarkerSummaryItem,
  BiomarkerTrendPoint,
  FetchBiomarkersSummaryResponse,
} from "@/types/biomarkers/biomarkers_types";
import type {
  BiomarkerEducationParams,
  BiomarkerEducationView,
  FetchBiomarkerEducationResponse,
} from "@/types/biomarkers/education_types";

const PATIENT_BIOMARKERS_SUMMARY_ENDPOINT = "/api/patient/biomarkers/summary";
const PATIENT_BIOMARKERS_EDUCATION_ENDPOINT =
  "/api/patient/biomarkers/education";

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
    referenceRange:
      typeof row.referenceRange === "string" || row.referenceRange === null
        ? (row.referenceRange as string | null)
        : row.referenceRange === undefined
          ? null
          : String(row.referenceRange ?? ""),
  };
}

function toNullableNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function mapReferenceRange(raw: unknown): BiomarkerReferenceRange {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    gender: String(row.gender ?? "both"),
    unit:
      typeof row.unit === "string" || row.unit === null
        ? (row.unit as string | null)
        : null,
    ...(typeof row.unitSource === "string"
      ? { unitSource: row.unitSource }
      : {}),
    direction: String(row.direction ?? "in_range"),
    lowThreshold: toNullableNumber(row.lowThreshold),
    normalMin: toNullableNumber(row.normalMin),
    optimalMin: toNullableNumber(row.optimalMin),
    optimalMax: toNullableNumber(row.optimalMax),
    normalMax: toNullableNumber(row.normalMax),
    highThreshold: toNullableNumber(row.highThreshold),
  };
}

function mapReferenceStatus(raw: unknown): BiomarkerReferenceStatus {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    tier: String(row.tier ?? ""),
    value: toNullableNumber(row.value),
    gender: String(row.gender ?? "both"),
    unit:
      typeof row.unit === "string" || row.unit === null
        ? (row.unit as string | null)
        : null,
    direction: String(row.direction ?? "in_range"),
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
    latestReferenceRange:
      typeof row.latestReferenceRange === "string" ||
      row.latestReferenceRange === null
        ? (row.latestReferenceRange as string | null)
        : row.latestReferenceRange === undefined
          ? null
          : String(row.latestReferenceRange ?? ""),
    referenceRanges: Array.isArray(row.referenceRanges)
      ? row.referenceRanges.map(mapReferenceRange)
      : null,
    referenceStatus:
      row.referenceStatus && typeof row.referenceStatus === "object"
        ? mapReferenceStatus(row.referenceStatus)
        : null,
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

/**
 * Fetch education copy for one biomarker (lazy — on drawer open).
 * See `docs/biomarker-education-api (1).md`.
 *
 * Pass exactly one of `loinc` / `canonicalName` (loinc preferred). A `404`
 * (unknown LOINC, no row, or unreviewed content in production) is a normal
 * "no education available" outcome, not an error — we translate it to `null`
 * so the drawer simply hides the education sections. Other non-2xx statuses
 * propagate so React Query can surface a real failure.
 */
export async function fetchBiomarkerEducation(
  params: BiomarkerEducationParams
): Promise<BiomarkerEducationView | null> {
  try {
    const res = await axiosService.get<FetchBiomarkerEducationResponse>(
      PATIENT_BIOMARKERS_EDUCATION_ENDPOINT,
      { params }
    );
    return res.data?.data ?? null;
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw err;
  }
}

