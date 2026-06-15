import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  Appointment,
  AppointmentType,
  BookAppointmentPayload,
  BookAppointmentResult,
  DailyTimeslotsMap,
  GetAppointmentTypeDetailParams,
  ListAppointmentsParams,
  ListAppointmentsResult,
  ListAppointmentTypesResult,
  ListTimeslotsParams,
  ListTimeslotsResult,
  SelfBookPayload,
  SelfBookResult,
} from "@/types/trainerize/appointments_types";

/**
 * Trainerize appointments — list / types / type detail / book.
 * See `docs/trainerize/nutrition-photos-appointments-apis.md` §Appointments
 * and `docs/trainerize/appointment_issue.md` for tracked doc gaps.
 *
 * Notes:
 *  - Cancel / reschedule (PUT / DELETE) are not documented — see issue §3.
 *  - List responses defensively handle both `{appointments[]}` and bare-array
 *    upstream shapes, since the doc only describes purpose, not response body.
 *  - The booking body carries the doc's `attendents` typo intentionally
 *    (§6) — preserved as the wire key until backend confirms otherwise.
 */

const BASE = "/api/trainerize/me/appointments";
const TIMESLOTS = `${BASE}/timeslots`;
const SELF_BOOK = `${BASE}/self-book`;
const TYPES = "/api/trainerize/me/appointment-types";
const TYPE_DETAIL = `${TYPES}/detail`;

export async function listAppointments(
  params: ListAppointmentsParams = {},
): Promise<ListAppointmentsResult> {
  const res = await axiosService.get<Envelope<ListAppointmentsResult>>(BASE, {
    params,
  });
  return normalizeAppointmentsList(unwrap(res.data));
}

export async function listAppointmentTypes(): Promise<ListAppointmentTypesResult> {
  const res = await axiosService.get<Envelope<ListAppointmentTypesResult>>(TYPES);
  return normalizeAppointmentTypesList(unwrap(res.data));
}

export async function getAppointmentTypeDetail(
  params: GetAppointmentTypeDetailParams,
): Promise<AppointmentType> {
  const res = await axiosService.get<Envelope<AppointmentType>>(TYPE_DETAIL, {
    params,
  });
  return unwrap<AppointmentType>(res.data);
}

export async function bookAppointment(
  payload: BookAppointmentPayload,
): Promise<BookAppointmentResult> {
  const res = await axiosService.post<Envelope<BookAppointmentResult>>(
    BASE,
    payload,
  );
  return unwrap<BookAppointmentResult>(res.data);
}

// ─── Self-book flow ────────────────────────────────────────────────────────

export async function listTimeslots(
  params: ListTimeslotsParams,
): Promise<DailyTimeslotsMap> {
  const res = await axiosService.get<Envelope<ListTimeslotsResult>>(TIMESLOTS, {
    params,
  });
  const data = unwrap<ListTimeslotsResult | null>(res.data);
  return extractDailyTimeslots(data);
}

/**
 * Defensive shape walk for the timeslots payload. The doc puts the map at
 * `data.dailyTimeslots` (object keyed by `"YYYY-MM-DD 00:00:00"` strings),
 * but observed responses occasionally hand back either a bare map or wrap
 * inside a `timeslots` / `data` key. We probe in priority order and only
 * accept a value whose key shape looks like a midnight datetime string
 * (`YYYY-MM-DD HH:MM:SS`) so we don't mistakenly pick up an unrelated
 * sibling object.
 */
function extractDailyTimeslots(data: unknown): DailyTimeslotsMap {
  if (!data || typeof data !== "object") return {};
  const obj = data as Record<string, unknown>;
  const candidates: unknown[] = [
    obj.dailyTimeslots,
    obj.timeslots,
    obj.data,
    obj, // bare map at the top level
  ];
  for (const c of candidates) {
    if (looksLikeDailyTimeslots(c)) {
      return c as DailyTimeslotsMap;
    }
  }
  return {};
}

function looksLikeDailyTimeslots(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value as object);
  if (keys.length === 0) return false;
  // Day keys are `YYYY-MM-DD …` strings — checking the first key is enough
  // to distinguish the timeslots map from other shapes.
  return /^\d{4}-\d{2}-\d{2}/.test(keys[0] ?? "");
}

export async function selfBookAppointment(
  payload: SelfBookPayload,
): Promise<SelfBookResult> {
  const res = await axiosService.post<Envelope<SelfBookResult>>(
    SELF_BOOK,
    payload,
  );
  return unwrap<SelfBookResult>(res.data) ?? {};
}

// ─── Defensive normalizers ────────────────────────────────────────────────

function normalizeAppointmentsList(data: unknown): ListAppointmentsResult {
  if (!data) return { total: 0, appointments: [] };
  if (Array.isArray(data)) {
    return { total: data.length, appointments: data as Appointment[] };
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const arr =
      (obj.appointments as Appointment[] | undefined) ??
      (obj.results as Appointment[] | undefined) ??
      (obj.items as Appointment[] | undefined) ??
      [];
    return {
      total: typeof obj.total === "number" ? obj.total : arr.length,
      appointments: Array.isArray(arr) ? arr : [],
    };
  }
  return { total: 0, appointments: [] };
}

function normalizeAppointmentTypesList(
  data: unknown,
): ListAppointmentTypesResult {
  if (!data) return { total: 0, appointmentTypes: [] };
  if (Array.isArray(data)) {
    return {
      total: data.length,
      appointmentTypes: data as AppointmentType[],
    };
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const arr =
      (obj.appointmentTypes as AppointmentType[] | undefined) ??
      (obj.types as AppointmentType[] | undefined) ??
      (obj.results as AppointmentType[] | undefined) ??
      (obj.items as AppointmentType[] | undefined) ??
      [];
    return {
      total: typeof obj.total === "number" ? obj.total : arr.length,
      appointmentTypes: Array.isArray(arr) ? arr : [],
    };
  }
  return { total: 0, appointmentTypes: [] };
}
