export type BiomarkerStatus = "LOW" | "NORMAL" | "HIGH" | string;

export interface BiomarkerTrendPoint {
  value: number | string | null;
  date: string;
  status: BiomarkerStatus;
  unit: string | null;
  [key: string]: unknown;
}

export interface BiomarkerSummaryItem {
  biomarkerName: string;
  canonicalName: string;
  loinc: string;
  unit: string | null;
  trend: BiomarkerTrendPoint[];
  [key: string]: unknown;
}

/**
 * Map of biomarker category -> list of biomarkers in that category.
 *
 * Examples of category keys from the API:
 * - "Blood count (CBC)"
 * - "liver"
 * - "protein"
 * - "lipid"
 * - "kidney"
 * - "bone"
 * - "metabolic"
 * - "hormones"
 * - "iron"
 * - "glucose"
 * - "inflammation"
 * - "metabolites"
 * - "pancreas"
 * - "thyroid"
 * - "vitamins"
 * - "tumor_markers"
 */
export type BiomarkerCategoryMap = Record<string, BiomarkerSummaryItem[]>;

export interface FetchBiomarkersSummaryResponse {
  success?: boolean;
  data: BiomarkerCategoryMap;
}

