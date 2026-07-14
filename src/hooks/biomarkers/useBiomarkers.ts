import { useQuery } from "@tanstack/react-query";
import {
  fetchBiomarkerEducation,
  fetchPatientBiomarkersSummary,
} from "@/api/biomarkers/biomarkers";
import type { BiomarkerCategoryMap } from "@/types/biomarkers/biomarkers_types";
import type {
  BiomarkerEducationParams,
  BiomarkerEducationView,
} from "@/types/biomarkers/education_types";

export function useBiomarkersSummary() {
  return useQuery<BiomarkerCategoryMap>({
    queryKey: ["patients", "biomarkers-summary"],
    queryFn: fetchPatientBiomarkersSummary,
    staleTime: 60_000,
  });
}

/**
 * Lazy education content for one biomarker — fires when the drill drawer is
 * open and the marker has a lookup key. Prefers `loinc`, falls back to
 * `canonicalName`. See `docs/biomarker-education-api (1).md`.
 *
 * Education is reference content (not patient-specific), so it's cached
 * aggressively per session. A `404` resolves to `null` inside the API layer,
 * so the query "succeeds" with `data === null` — the drawer then hides the
 * education sections rather than showing an error. `retry: false` keeps a
 * genuinely-missing marker from thrashing.
 */
export function useBiomarkerEducation(
  loinc: string | null | undefined,
  canonicalName: string | null | undefined,
  enabled = true
) {
  const params: BiomarkerEducationParams | null = loinc
    ? { loinc }
    : canonicalName
      ? { canonicalName }
      : null;

  return useQuery<BiomarkerEducationView | null>({
    queryKey: [
      "patients",
      "biomarker-education",
      params?.loinc ?? params?.canonicalName ?? "none",
    ],
    queryFn: () => fetchBiomarkerEducation(params as BiomarkerEducationParams),
    enabled: enabled && params !== null,
    staleTime: 30 * 60_000, // 30 min — reference content, safe to hold
    retry: false,
  });
}
