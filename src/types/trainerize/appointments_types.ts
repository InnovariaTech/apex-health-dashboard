/**
 * Trainerize appointments — backs `src/api/trainerize/appointments.ts`.
 * See `docs/trainerize/nutrition-photos-appointments-apis.md` §Appointments.
 *
 * Doc gaps tracked in `docs/trainerize/appointment_issue.md`:
 *   §1  userId headline rule contradicts the booking body — top-level userId
 *       is the trainer; attendents[] is the client. We send both.
 *   §2  GET response shapes are one-liners. Every field below except `id` and
 *       the documented payload fields is best-effort — UI degrades gracefully.
 *   §3  No cancel/reschedule documented — UI surfaces a "Trainerize app" note
 *       instead of broken affordances.
 *   §4  Recurrence semantics ambiguous — UI exposes single bookings only.
 *   §5  startDate / endDate timezone — doc says "UTC datetime" but the
 *       example shows no `Z`. We append `Z` defensively when serializing.
 *   §6  `attendents` typo — preserved as wire format until backend confirms.
 *   §7  Multi-attendee group sessions undocumented — UI books for self only.
 */

// ─── Status ───────────────────────────────────────────────────────────────

/** Best-effort enumeration; the doc doesn't enumerate. UI tolerates unknowns. */
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show"
  | string;

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

// ─── Action info (booking options) ────────────────────────────────────────

export interface RecurrenceWeekly {
  every?: number;
  weekDays?: string[];
}

export interface RecurrencePattern {
  /** Doc shows "weekly"; §4 — other values unknown. */
  frequency?: string;
  /** Doc shows `duration` and `totalCount` both as 4 — relationship unclear. */
  duration?: number;
  totalCount?: number;
  repeatWeekly?: RecurrenceWeekly;
  [key: string]: unknown;
}

export interface ActionInfo {
  isVideoCall?: boolean;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  /** §8 — doc says "etc."; backend may add fields. */
  [key: string]: unknown;
}

// ─── Attendee (preserves doc's `attendents` typo for the wire) ────────────

export interface AppointmentAttendee {
  userId: number;
}

// ─── Appointment (read shape, defensive) ──────────────────────────────────

export interface Appointment {
  id: number;
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
  appointmentTypeId?: number;
  appointmentType?: AppointmentType | null;
  /** Trainer's Trainerize ID per the booking-body convention. */
  userId?: number;
  /** Preserves the doc's typo. */
  attendents?: AppointmentAttendee[];
  notes?: string;
  actionInfo?: ActionInfo;
  createdAt?: string;
  /** Unknown wire fields are preserved so the UI can show them in a JSON drawer. */
  [key: string]: unknown;
}

// ─── Appointment type ─────────────────────────────────────────────────────

/** Best-effort shape; §2 — list/detail responses aren't documented. */
export interface AppointmentType {
  id: number;
  name?: string;
  description?: string;
  /** Duration in minutes (typical Trainerize convention). */
  duration?: number;
  colorHex?: string;
  isBookable?: boolean;
  trainerID?: number;
  [key: string]: unknown;
}

// ─── Query params ─────────────────────────────────────────────────────────

export interface ListAppointmentsParams {
  startDate?: string;
  endDate?: string;
}

export interface ListAppointmentsResult {
  total: number;
  appointments: Appointment[];
}

export interface ListAppointmentTypesResult {
  total: number;
  appointmentTypes: AppointmentType[];
}

export interface GetAppointmentTypeDetailParams {
  appointmentTypeId: number;
}

// ─── Booking payload (§1: userId = trainer, attendents = client) ──────────

export interface BookAppointmentPayload {
  /** Trainer's Trainerize ID — from `/me/settings.trainerID`. */
  userId: number;
  /** UTC datetime — `YYYY-MM-DDTHH:MM:SSZ`. */
  startDate: string;
  endDate: string;
  appointmentTypeId: number;
  notes?: string;
  /** Preserves the doc's `attendents` typo on the wire. */
  attendents?: AppointmentAttendee[];
  actionInfo?: ActionInfo;
}

export interface BookAppointmentResult {
  id: number;
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * §5 — doc says "UTC datetime" but the example shows no `Z`. We tolerate
 * both on read and append `Z` on write so the server never has to guess.
 */
export function toUtcDateTime(input: string): string {
  if (!input) return input;
  if (input.endsWith("Z") || /[+-]\d\d:?\d\d$/.test(input)) return input;
  return `${input}Z`;
}

/** Formats datetime-local input (`YYYY-MM-DDTHH:MM`) → full ISO UTC. */
export function localDateTimeInputToUtc(input: string): string {
  if (!input) return input;
  // Browser datetime-local omits seconds; pad to keep Trainerize happy.
  const withSeconds = input.length === 16 ? `${input}:00` : input;
  return toUtcDateTime(withSeconds);
}

/**
 * Returns the duration in minutes between two ISO datetimes, or null if
 * either is missing/unparseable.
 */
export function appointmentDurationMinutes(
  appointment: Appointment | null | undefined,
): number | null {
  if (!appointment?.startDate || !appointment.endDate) return null;
  const s = Date.parse(appointment.startDate);
  const e = Date.parse(appointment.endDate);
  if (Number.isNaN(s) || Number.isNaN(e)) return null;
  return Math.max(0, Math.round((e - s) / 60000));
}
