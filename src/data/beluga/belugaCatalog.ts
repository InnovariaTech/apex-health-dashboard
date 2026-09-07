import type { PatientPreference } from "@/types/beluga/beluga_types";

/**
 * Offered telehealth visit types and their medication options / intake
 * questions.
 *
 * ⚠️ There is NO Beluga catalog API — `beluga-api.md` exposes no endpoint for
 * visit types, medication ids, or intake questions. These values are Beluga's
 * internal catalog (`visitType`, `medId`, …) and must be curated by the product
 * team to match what Beluga has enabled for our company. When/if a catalog
 * endpoint appears, replace `BELUGA_VISIT_TYPES` with a fetched source and keep
 * the same shape.
 *
 * The seed below uses the sample values from `beluga-api.md` so the flow is
 * wired and testable end-to-end. Do NOT ship these to patients as real
 * offerings without confirming the ids with Beluga.
 */

export interface IntakeQuestion {
  /** Beluga question key — must match `^Q\d+$`; its answer is sent as `A{n}`. */
  id: string;
  prompt: string;
  kind: "text" | "boolean";
  required?: boolean;
}

export interface MedicationOption {
  /** Local UI key for selection (not sent). */
  id: string;
  label: string;
  /** The exact `patientPreference` item sent to Beluga. */
  preference: PatientPreference;
}

export interface VisitTypeOption {
  /** Beluga's catalog value, sent as `visitType`. */
  visitType: string;
  label: string;
  description: string;
  medications: MedicationOption[];
  questions: IntakeQuestion[];
  /**
   * Fixed pharmacy for this visit type (company-designated / mail-order, or a
   * staging test value). When set, the intake skips the pharmacy-search step and
   * sends this `pharmacyId` as-is. Absent ⇒ the patient searches and picks one.
   */
  pharmacyId?: string;
}

export const BELUGA_VISIT_TYPES: VisitTypeOption[] = [
  {
    visitType: "testVisitType",
    label: "Sample Visit (staging)",
    description:
      "Placeholder offering seeded from the API reference. Replace with real, Beluga-enabled visit types before launch.",
    // Beluga staging's proven test payload uses this fixed pharmacyId, so the
    // intake skips pharmacy search and reproduces the run-log payload exactly.
    pharmacyId: "12345",
    medications: [
      {
        id: "sample-med",
        label: "Sample Medication 5mg",
        preference: {
          name: "SAMPLE MedID testVisitType",
          medId: "UFaCy3lCwIpqxZtBLACGTNQjZjpMi8JA",
          strength: "5",
          quantity: "1",
          refills: "5",
          daysSupply: "30",
        },
      },
    ],
    questions: [
      {
        id: "Q1",
        prompt: "Do you have any known allergies?",
        kind: "text",
        required: true,
      },
      {
        id: "Q2",
        prompt: "Are you currently taking any other medications?",
        kind: "text",
      },
    ],
  },
];

export function findVisitType(visitType: string): VisitTypeOption | undefined {
  return BELUGA_VISIT_TYPES.find((v) => v.visitType === visitType);
}
