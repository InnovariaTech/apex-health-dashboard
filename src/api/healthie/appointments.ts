import { axiosService } from "@/api/http/axiosInstance";
import type {
  BookVisitInput,
  PatientVisit,
  RescheduleVisitInput,
  VisitFilter,
  VisitSlot,
  VisitType,
} from "@/types/healthie/appointments_types";

/** Visits with our care team, read and booked live in Healthie by the backend. */

const BASE = "/api/patient/appointments";

function unwrap<T>(body: unknown): T {
  return (body as { data: T }).data;
}

export async function listVisitTypes(): Promise<VisitType[]> {
  const res = await axiosService.get(`${BASE}/types`);
  return unwrap<{ types: VisitType[] }>(res.data).types ?? [];
}

/** Days (`YYYY-MM-DD`) in `month` (`YYYY-MM`) with at least one open slot. */
export async function listAvailableDays(typeKey: string, month: string, timezone: string): Promise<string[]> {
  const res = await axiosService.get(`${BASE}/availability/days`, { params: { typeKey, month, timezone } });
  return unwrap<{ days: string[] }>(res.data).days ?? [];
}

export async function listAvailableSlots(typeKey: string, date: string, timezone: string): Promise<VisitSlot[]> {
  const res = await axiosService.get(`${BASE}/availability/slots`, { params: { typeKey, date, timezone } });
  return unwrap<{ slots: VisitSlot[] }>(res.data).slots ?? [];
}

export async function bookVisit(input: BookVisitInput): Promise<PatientVisit> {
  const res = await axiosService.post(BASE, input);
  return unwrap<PatientVisit>(res.data);
}

export async function listVisits(filter: VisitFilter): Promise<PatientVisit[]> {
  const res = await axiosService.get(BASE, { params: { filter } });
  return unwrap<{ appointments: PatientVisit[] }>(res.data).appointments ?? [];
}

export async function cancelVisit(id: string): Promise<PatientVisit> {
  const res = await axiosService.post(`${BASE}/${encodeURIComponent(id)}/cancel`, {});
  return unwrap<PatientVisit>(res.data);
}

export async function rescheduleVisit(id: string, input: RescheduleVisitInput): Promise<PatientVisit> {
  const res = await axiosService.post(`${BASE}/${encodeURIComponent(id)}/reschedule`, input);
  return unwrap<PatientVisit>(res.data);
}
