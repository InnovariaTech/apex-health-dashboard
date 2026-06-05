/**
 * Follow-up form templates — picked from MyCaseDetails when a patient wants
 * to submit a structured update to an existing case. Each template defines
 * the question shapes (no UUIDs yet); {@link instantiateTemplate} mints fresh
 * `questionId`s every time so repeated submissions don't collide.
 *
 * The flow lands at `POST /api/patient/my-requests/cases/:caseId/forms`
 * (doc #7) via {@link useAddCaseForm}, encoded by
 * {@link encodeAnswerFormTitleBased}.
 */
import {
  Activity,
  ClipboardList,
  AlertTriangle,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import type { IntakeQuestion } from "./intakeFormUtils";

type QuestionShape = Omit<IntakeQuestion, "questionId">;

export interface FollowupTemplate {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Sent verbatim as `formTitle` on the request body. */
  formTitle: string;
  formDescription?: string;
  questions: QuestionShape[];
}

const ENERGY_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const SLEEP_OPTIONS = ["Poor", "Fair", "Good", "Excellent"];
const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"];
const TREND_OPTIONS = ["Getting better", "About the same", "Getting worse"];

export const FOLLOWUP_TEMPLATES: FollowupTemplate[] = [
  {
    id: "weekly-checkin",
    title: "Weekly check-in",
    description:
      "Share your weight, energy, and sleep so your care team can keep your protocol on track.",
    icon: ClipboardList,
    formTitle: "Weekly check-in",
    formDescription: "Routine self-report submitted by the patient.",
    questions: [
      {
        question: "What is your current weight?",
        type: "TEXT",
        required: true,
        phi: true,
        hint: "Pounds, lbs.",
        placeholder: "e.g. 174 lbs",
      },
      {
        question: "Energy level today (1 – 10)",
        type: "SINGLESELECT",
        required: true,
        phi: false,
        options: ENERGY_OPTIONS,
      },
      {
        question: "Sleep quality this past week",
        type: "SINGLESELECT",
        required: true,
        phi: false,
        options: SLEEP_OPTIONS,
      },
      {
        question: "Any side effects to flag?",
        type: "TEXT",
        required: false,
        phi: true,
        placeholder: "Describe anything new since your last check-in",
      },
    ],
  },
  {
    id: "side-effect-report",
    title: "Side-effect report",
    description:
      "Report a new symptom or side effect so your care team can review it before your next visit.",
    icon: AlertTriangle,
    formTitle: "Side-effect report",
    formDescription: "Patient-initiated symptom report.",
    questions: [
      {
        question: "Describe the symptom or side effect",
        type: "TEXT",
        required: true,
        phi: true,
        placeholder: "What are you noticing?",
      },
      {
        question: "When did it start?",
        type: "DATE",
        required: true,
        phi: false,
      },
      {
        question: "Severity",
        type: "SINGLESELECT",
        required: true,
        phi: false,
        options: SEVERITY_OPTIONS,
      },
      {
        question: "How has it changed since onset?",
        type: "SINGLESELECT",
        required: true,
        phi: false,
        options: TREND_OPTIONS,
      },
      {
        question: "Attach photos (optional)",
        type: "FILE",
        required: false,
        phi: true,
        hint: "Photos help your provider assess severity.",
      },
    ],
  },
  {
    id: "quick-note",
    title: "Quick note",
    description: "Send a short structured note to attach to this case.",
    icon: StickyNote,
    formTitle: "Patient note",
    questions: [
      {
        question: "Note",
        type: "TEXT",
        required: true,
        phi: false,
        placeholder: "Anything you'd like your care team to see",
      },
      {
        question: "Attach a file (optional)",
        type: "FILE",
        required: false,
        phi: true,
      },
    ],
  },
];

export function getTemplateById(id: string): FollowupTemplate | null {
  return FOLLOWUP_TEMPLATES.find((t) => t.id === id) ?? null;
}

/**
 * Mints a fresh set of `questionId`s for a template instance so two
 * concurrent submissions of the same template don't share UUIDs.
 */
export function instantiateTemplate(template: FollowupTemplate): IntakeQuestion[] {
  return template.questions.map((q) => ({
    ...q,
    questionId: generateQuestionId(),
  }));
}

function generateQuestionId(): string {
  // `crypto.randomUUID()` is widely supported in evergreen browsers and Node 16+;
  // fall back to a pseudo-UUID if unavailable so dev/test environments still work.
  if (
    typeof crypto !== "undefined" &&
    typeof (crypto as Crypto).randomUUID === "function"
  ) {
    return (crypto as Crypto).randomUUID();
  }
  return `q_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}
