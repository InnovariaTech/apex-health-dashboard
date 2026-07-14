/**
 * Patient AI summary — `/api/patient/summaries`.
 *
 * The backend now ships a structured `report` object containing the full
 * analysis: overall score (with delta + subsystem breakdown + biomarker
 * status + scoreExplanation), biological age, per-system narrative
 * sections (chips + paragraph + plain-terms explainer), and recent
 * trends (positive / monitor).
 *
 * Only the LATEST summary in the list response carries `report`; older
 * items have `report: null` (stub records with id + score + timestamps).
 * Until the backend exposes a per-id fetch endpoint, the UI renders the
 * latest report and treats the history drawer as a timeline view only.
 */

export type SeverityTone = "opt" | "bord" | "att";

// ─── Overall score ──────────────────────────────────────────────────────

export interface SubsystemScore {
  name: string;
  score: number;
  tone: SeverityTone;
}

export interface BiomarkerIssue {
  name: string;
  value: string;
  unit: string;
  statusLabel: string;
  severity: SeverityTone;
}

export interface BiomarkerStatusBlock {
  optimalCount: number;
  totalCount: number;
  issues: BiomarkerIssue[];
}

export interface OverallScoreMeta {
  biomarkerCount: number;
  analysisCount: number;
}

export interface OverallScore {
  score: number;
  status: string;
  /** Points delta vs the previous analysis; null when this is the first. */
  delta: number | null;
  /** ISO date of the prior analysis the delta is computed against. */
  deltaVsDate: string | null;
  /** Optional cohort percentile label, e.g. "86th %ile age cohort". */
  percentileLabel: string | null;
  scoreExplanation: string;
  methodologyVersion: string;
  subsystemScores: SubsystemScore[];
  biomarkerStatus: BiomarkerStatusBlock;
  meta: OverallScoreMeta;
}

// ─── Biological age ─────────────────────────────────────────────────────

export interface BiologicalAgeHistoryPoint {
  date: string;
  biologicalYears: number;
}

export interface BiologicalAge {
  /** False until enough longevity biomarkers are present. */
  available: boolean;
  /** Free-form reason when `available: false`. */
  reason: string | null;
  biologicalYears: number | null;
  chronologicalYears: number | null;
  /** Negative = younger than chronological. */
  deltaYears: number | null;
  method: string | null;
  biomarkerCount: number | null;
  history: BiologicalAgeHistoryPoint[];
}

// ─── Narrative ──────────────────────────────────────────────────────────

export interface NarrativeChip {
  label: string;
  value: string;
  unit: string;
  tone: SeverityTone;
}

export interface NarrativeExplainItem {
  name: string;
  /** Lab reference range as a free-form string. */
  referenceRange: string | null;
  explanation: string;
}

export interface NarrativeSectionStatus {
  label: string;
  tone: SeverityTone;
}

export interface NarrativeSection {
  /** Stable slug — e.g. `"overall" | "metabolic" | "cardiovascular" | …`. */
  id: string;
  title: string;
  status: NarrativeSectionStatus;
  chips: NarrativeChip[];
  paragraph: string;
  explainItems: NarrativeExplainItem[];
}

export interface NarrativeTrends {
  positive: string[];
  monitor: string[];
}

export interface Narrative {
  sections: NarrativeSection[];
  trends: NarrativeTrends;
}

// ─── Report root ────────────────────────────────────────────────────────

export interface ReportHistoryEntry {
  summaryId: string;
  generatedAt: string;
  healthScore: number;
}

export interface AnalysisReport {
  reportSchemaVersion: string;
  overallScore: OverallScore;
  biologicalAge: BiologicalAge;
  narrative: Narrative;
  history: ReportHistoryEntry[];
}

// ─── Summary envelope ───────────────────────────────────────────────────

export interface PatientSummary {
  id: string;
  /** Backend ships `userId`, not `patientId`. */
  userId: string;
  healthScore: number | null;
  createdAt: string;
  updatedAt: string;
  /** Null on older entries; only the latest summary carries the full report. */
  report: AnalysisReport | null;
}

export interface SummaryApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PatientSummariesData {
  items: PatientSummary[];
  total: number;
}

export interface FetchAllPatientSummariesParams {
  /** Default 10 per doc #38. */
  take?: number;
  /** Default 0 per doc #38. */
  skip?: number;
}
