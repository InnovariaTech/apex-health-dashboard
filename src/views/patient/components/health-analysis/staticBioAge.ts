import type { BiologicalAge } from "@/types/ai-agent/ai_summary_types";

/**
 * Fixed biological-age figures shown on the dashboard and Health Analysis
 * cards, in place of `report.biologicalAge` from the summaries API.
 *
 * Both `BioAgeCard` (dashboard) and `AnalysisBioAgeCard` (Health Analysis)
 * render from this single object so the two cards can never disagree.
 *
 * To go back to live API values: drop the `STATIC_BIO_AGE` import in those two
 * components and restore their `useAllPatientSummaries()` lookup.
 */
export const STATIC_BIO_AGE: BiologicalAge = {
  available: true,
  reason: null,
  biologicalYears: 24,
  chronologicalYears: 26,
  deltaYears: -2,
  method: "PhenoAge",
  biomarkerCount: null,
  history: [],
};
