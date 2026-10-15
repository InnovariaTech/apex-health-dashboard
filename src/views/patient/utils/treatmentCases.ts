import type { PatientIntake, PendingIntake } from "@/types/intake/intake_types";

/**
 * The patient's treatments, shaped for the "My cases" design: one case per paid form — still to
 * fill in, or submitted and with the care team. Built only from what the APIs give today
 * (`/patient/intakes`, `/patient/intakes/pending`); there is no case model behind it yet, so the
 * steps are the fixed journey every treatment goes through, not ones the care team sets.
 */

export type CaseStatus = "action_needed" | "in_review" | "completed";

export interface TreatmentCase {
  id: string;
  /** Short human reference, from our submission id. */
  ref: string;
  title: string;
  status: CaseStatus;
  openedAt: string | null;
  submittedAt: string | null;
  sentToCareTeamAt: string | null;
  updatedAt: string | null;
  steps: string[];
  /** Index of the step in progress; `steps.length` when every step is done. */
  step: number;
  /** For a form still to fill in: the link token to open it with. */
  token?: string;
}

export const CASE_STEPS = ["Purchased", "Form submitted", "Care team review", "Your plan"];

export const STATUS_META: Record<CaseStatus, { label: string; tone: "brand" | "warn" | "ok" }> = {
  action_needed: { label: "Action needed", tone: "brand" },
  in_review: { label: "In review", tone: "warn" },
  completed: { label: "Completed", tone: "ok" },
};

export const caseRef = (id: string) => `#${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

export function buildCases(pending: PendingIntake[], mine: PatientIntake[]): TreatmentCase[] {
  const byId = new Map(mine.map((m) => [m.submissionId, m]));
  const fromPending: TreatmentCase[] = pending.map((p) => {
    const m = byId.get(p.submissionId);
    return {
      id: p.submissionId,
      ref: caseRef(p.submissionId),
      title: p.title,
      status: "action_needed",
      openedAt: m?.startedAt ?? null,
      submittedAt: null,
      sentToCareTeamAt: null,
      updatedAt: m?.startedAt ?? null,
      steps: CASE_STEPS,
      step: 1,
      token: p.token,
    };
  });
  const pendingIds = new Set(pending.map((p) => p.submissionId));
  const submitted: TreatmentCase[] = mine
    .filter((m) => m.status === "submitted" && !pendingIds.has(m.submissionId))
    .map((m) => ({
      id: m.submissionId,
      ref: caseRef(m.submissionId),
      title: m.title,
      status: "in_review",
      openedAt: m.startedAt,
      submittedAt: m.submittedAt,
      sentToCareTeamAt: m.sentToCareTeamAt,
      updatedAt: m.sentToCareTeamAt ?? m.submittedAt ?? m.startedAt,
      steps: CASE_STEPS,
      step: 2,
    }));
  return [...fromPending, ...submitted].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export function fmtCaseDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
