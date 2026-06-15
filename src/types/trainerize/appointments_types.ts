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
 *   §5  Range-query format confirmed: `YYYY-MM-DD HH:MM:SS` (space, seconds).
 *       Booking body still uses ISO `T` separator per the original doc example.
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
  /**
   * Self-book fields (per
   * `docs/trainerize/appointments/availableslot-self-book-apis.md` §Verify).
   */
  isSelfBooked?: boolean;
  organizer?: unknown;
  /** `unrequested` | `requested` | `denied` — read-only from upstream. */
  cancellationStatus?: "unrequested" | "requested" | "denied" | string;
  /** Cancel deadline (UTC) or `null` if not cancellable. */
  allowCancelBeforeDate?: string | null;
  /** Unknown wire fields are preserved so the UI can show them in a JSON drawer. */
  [key: string]: unknown;
}

// ─── Appointment type ─────────────────────────────────────────────────────

/**
 * Best-effort shape; §2 — list/detail responses aren't documented. Field
 * naming varies in the wild: some Trainerize responses ship the canonical
 * `id`, others use `appointmentTypeId` / `appointmentTypeID` (same names
 * used for the query/body params). The `readAppointmentTypeId` helper
 * below covers all three.
 */
export interface AppointmentType {
  id?: number;
  appointmentTypeId?: number;
  appointmentTypeID?: number;
  name?: string;
  description?: string;
  /** Duration in minutes (typical Trainerize convention). */
  duration?: number;
  colorHex?: string;
  isBookable?: boolean;
  trainerID?: number;
  [key: string]: unknown;
}

/**
 * Resolve the appointment type's numeric id across the field-name variants
 * Trainerize uses (`id`, `appointmentTypeId`, `appointmentTypeID`). Returns
 * `undefined` when none of them are a finite number — the caller's job to
 * gate any request that needs the id.
 */
export function readAppointmentTypeId(
  t: AppointmentType | null | undefined,
): number | undefined {
  if (!t) return undefined;
  for (const v of [t.id, t.appointmentTypeId, t.appointmentTypeID]) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
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

// ─── Timeslots (self-book flow) ───────────────────────────────────────────

/**
 * `availabilityStatus` values per
 * `docs/trainerize/appointments/availableslot-self-book-apis.md`. Any other
 * `unavailable_*` is treated as not bookable.
 */
export type TimeslotAvailability =
  | "available"
  | "unavailable_BookingWindow"
  | string;

export interface Timeslot {
  /** Slot start — pass verbatim to `selfBook` as `appointmentTime`. */
  timeslot: string;
  availabilityStatus: TimeslotAvailability;
  [key: string]: unknown;
}

export interface DailyTimeslot {
  availableCount: number;
  timeslots: Timeslot[];
}

/** Map of day key (e.g. `"2026-06-08 00:00:00"`) → day's slot bucket. */
export type DailyTimeslotsMap = Record<string, DailyTimeslot>;

export interface ListTimeslotsResult {
  dailyTimeslots: DailyTimeslotsMap;
}

export interface ListTimeslotsParams {
  locationId: number;
  appointmentTypeId: number;
  /** `YYYY-MM-DD HH:MM:SS` — start of range (typically midnight). */
  startTime: string;
  /** `YYYY-MM-DD HH:MM:SS` — end of range. */
  endTime: string;
}

// ─── Self-book payload ────────────────────────────────────────────────────

export interface SelfBookPayload {
  locationId: number;
  appointmentTypeId: number;
  /** Exact slot string echoed back from the timeslots response. */
  appointmentTime: string;
}

export interface SelfBookResult {
  /** Trainerize envelope code — `0` on success. */
  code?: number;
  message?: string;
  [key: string]: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Range-query format for `GET /me/appointments?startDate&endDate`.
 *
 * Confirmed format: `YYYY-MM-DD HH:MM:SS` (space-separated, down to seconds).
 * Example accepted by upstream: `2026-06-17 14:00:00`.
 *
 * The boundary value depends on which side of the range we're emitting:
 *   - startDate (default)  → `YYYY-MM-DD 00:00:00`  (inclusive day start)
 *   - endDate (endOfDay=true) → `YYYY-MM-DD 23:59:59`  (inclusive day end)
 */
export function toAppointmentRangeDateTime(
  date: Date | string,
  endOfDay = false,
): string {
  const d = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const time = endOfDay ? "23:59:59" : "00:00:00";
  return `${yyyy}-${mm}-${dd} ${time}`;
}

/**
 * `POST /me/appointments` body — booking startDate / endDate.
 * Original doc example uses `YYYY-MM-DDTHH:MM:SS` (ISO `T` separator, no `Z`).
 */
export function localDateTimeInputToWire(input: string): string {
  if (!input) return input;
  // Browser datetime-local omits seconds; pad to keep Trainerize happy.
  return input.length === 16 ? `${input}:00` : input;
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
