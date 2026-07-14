export type BiomarkerStatus = "LOW" | "NORMAL" | "HIGH" | string;

export interface BiomarkerTrendPoint {
  value: number | string | null;
  date: string;
  status: BiomarkerStatus;
  unit: string | null;
  /**
   * Lab reference range at the time of the draw, shipped as a free-form
   * string. Common shapes: `"37.5-51.0"`, `"<1"`, `">39"`, `"0.0-1.2"`,
   * or `null` when the lab didn't include one.
   */
  referenceRange?: string | null;
  [key: string]: unknown;
}

/**
 * How the "good" direction runs for a biomarker, from the registry:
 *   - `in_range`         — a two-sided window (low + high both bad)
 *   - `lower_is_better`  — only an upper bound matters (e.g. LDL, CRP)
 *   - `higher_is_better` — only a lower bound matters (e.g. HDL, Folate)
 */
export type BiomarkerDirection =
  | "in_range"
  | "lower_is_better"
  | "higher_is_better"
  | string;

/** Resolved zone the patient's value falls in. */
export type BiomarkerTier = "LOW" | "NORMAL" | "OPTIMAL" | "HIGH" | string;

/**
 * Registry reference range for a biomarker (one per gender). Thresholds may
 * be `null` for the side that doesn't apply to `direction` — e.g.
 * `lower_is_better` leaves `lowThreshold` / `normalMin` / `optimalMin` null.
 *
 * Zone model (in_range): below `normalMin` = out-of-range low, `normalMin→
 * optimalMin` = normal, `optimalMin→optimalMax` = optimal, `optimalMax→
 * normalMax` = normal, above `normalMax` = out-of-range high.
 */
export interface BiomarkerReferenceRange {
  gender: "both" | "male" | "female" | string;
  unit: string | null;
  unitSource?: string;
  direction: BiomarkerDirection;
  lowThreshold: number | null;
  normalMin: number | null;
  optimalMin: number | null;
  optimalMax: number | null;
  normalMax: number | null;
  highThreshold: number | null;
}

/** The gender-resolved tier for this patient's latest value. */
export interface BiomarkerReferenceStatus {
  tier: BiomarkerTier;
  value: number | null;
  gender: string;
  unit: string | null;
  direction: BiomarkerDirection;
}

export interface BiomarkerSummaryItem {
  biomarkerName: string;
  canonicalName: string;
  loinc: string;
  unit: string | null;
  /**
   * The reference range from the most recent panel — convenience denorm
   * so the tile doesn't need to scan `trend[]` for a non-null range.
   * Same string format as `BiomarkerTrendPoint.referenceRange`.
   */
  latestReferenceRange?: string | null;
  /**
   * Registry-backed reference ranges (gender-specific optimal/normal zones).
   * Present only for markers linked in the registry. Prefer these over the
   * free-form lab `latestReferenceRange` string when available.
   */
  referenceRanges?: BiomarkerReferenceRange[] | null;
  /** Resolved tier for the patient's latest value against the registry. */
  referenceStatus?: BiomarkerReferenceStatus | null;
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

