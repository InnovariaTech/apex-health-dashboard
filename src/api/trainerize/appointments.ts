import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  Appointment,
  AppointmentType,
  BookAppointmentPayload,
  BookAppointmentResult,
  GetAppointmentTypeDetailParams,
  ListAppointmentsParams,
  ListAppointmentsResult,
  ListAppointmentTypesResult,
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
