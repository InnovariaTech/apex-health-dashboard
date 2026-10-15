/** Visits with our own clinicians, booked in our Healthie account (`/api/patient/appointments*`). */

export interface VisitType {
  /** Healthie's appointment type id; pass back as `typeKey`. */
  typeKey: string;
  displayName: string;
  lengthMinutes: number;
  contactType: string;
}

export interface VisitSlot {
  /** e.g. `2026-11-04 08:30:00 -0500`. Send back exactly as received: it carries the offset. */
  slot: string;
  providerId: string;
}

export type VisitFilter = "upcoming" | "past" | "all";

export interface PatientVisit {
  id: string;
  /** Same `YYYY-MM-DD HH:mm:ss ±hhmm` form as a slot. */
  start: string;
  lengthMinutes: number | null;
  contactType: string | null;
  /** Can be null until shortly before the visit. */
  videoUrl: string | null;
  /** Healthie's status: null (booked), `Cancelled`, `Occurred`, `No-Show`, `Re-Scheduled`. */
  status: string | null;
  appointmentType: { id: string; name: string | null } | null;
  provider: { id: string; name: string | null } | null;
  /** Still to come and not cancelled — can be rescheduled or cancelled. */
  isEditable: boolean;
}

export interface BookVisitInput {
  typeKey: string;
  slot: string;
  providerId: string;
  timezone: string;
}

export interface RescheduleVisitInput {
  slot: string;
  providerId?: string;
  timezone?: string;
}
