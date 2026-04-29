import { useQuery } from "@tanstack/react-query";
import { fetchPatientBiomarkersSummary } from "@/api/biomarkers/biomarkers";
import type { BiomarkerCategoryMap } from "@/types/biomarkers/biomarkers_types";

export function useBiomarkersSummary() {
  return useQuery<BiomarkerCategoryMap>({
    queryKey: ["patients", "biomarkers-summary"],
    queryFn: fetchPatientBiomarkersSummary,
    staleTime: 60_000,
  });
}

