/**
 * Biomarker education — patient-facing "what this measures" + "what moves it"
 * copy for a single biomarker. Loaded lazily when the drill drawer opens.
 * See `docs/biomarker-education-api (1).md`.
 */

export interface ModifiableFactor {
  label: string;
  /**
   * `"increase"` — this factor tends to **raise** the biomarker value.
   * `"decrease"` — this factor tends to **lower** the biomarker value.
   */
  direction: "increase" | "decrease";
}

export interface BiomarkerEducationView {
  /** Stable registry key. */
  canonicalName: string;
  /** Human-readable name from registry. */
  displayName: string | null;
  /** LOINC code when linked in registry. */
  loinc: string | null;
  /** Plain-language "What this measures" copy. */
  measurementSummary: string | null;
  /** Lifestyle factors; may be empty array or null. */
  modifiableFactors: ModifiableFactor[] | null;
  /** `true` when content passed QA. Staging may return `false` (draft). */
  reviewed: boolean;
  /** Provenance — `"ai" | "manual" | "import" | string`. */
  source: string;
}

/** One of `loinc` / `canonicalName` must be provided (loinc preferred). */
export interface BiomarkerEducationParams {
  loinc?: string;
  canonicalName?: string;
}

export interface FetchBiomarkerEducationResponse {
  success?: boolean;
  message?: string | null;
  data: BiomarkerEducationView | null;
}
