export interface SummaryUsage {
  input_tokens?: number;
  output_tokens?: number;
}

export interface SummaryMetadata {
  model?: string;
  usage?: SummaryUsage;
  scoreExplanation?: string;
}

export interface PatientSummary {
  id: string;
  patientId: string;
  summaryText: string;
  healthScore: number | null;
  metadata: SummaryMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface SummaryApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PatientSummariesData {
  items: PatientSummary[];
  total: number;
}
