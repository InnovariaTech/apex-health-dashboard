import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bookAppointment,
  getAppointmentTypeDetail,
  listAppointments,
  listAppointmentTypes,
  listTimeslots,
  selfBookAppointment,
} from "@/api/trainerize/appointments";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  BookAppointmentPayload,
  ListTimeslotsParams,
  SelfBookPayload,
} from "@/types/trainerize/appointments_types";

/**
 * Trainerize appointments.
 * Held: cancel / reschedule (no documented endpoint — see appointment_issue
 * §3) and recurring booking (semantics ambiguous — §4).
 */

const FIVE_MIN = 5 * 60 * 1000;

export function useAppointments(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.trainerize.appointments(startDate, endDate),
    // The upstream endpoint requires both dates; never fire without them
    // (a param-less request 400s with "Required startDate, endDate").
    queryFn: () => listAppointments({ startDate: startDate!, endDate: endDate! }),
    enabled: Boolean(startDate) && Boolean(endDate),
    staleTime: 30 * 1000,
  });
}

export function useAppointmentTypes() {
  return useQuery({
    queryKey: queryKeys.trainerize.appointmentTypes(),
    queryFn: listAppointmentTypes,
    staleTime: FIVE_MIN,
  });
}

export function useAppointmentType(appointmentTypeId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.trainerize.appointmentType(appointmentTypeId ?? 0),
    queryFn: () =>
      getAppointmentTypeDetail({
        appointmentTypeId: appointmentTypeId as number,
      }),
    enabled: typeof appointmentTypeId === "number" && appointmentTypeId > 0,
    staleTime: FIVE_MIN,
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookAppointmentPayload) => bookAppointment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainerize", "appointments"] });
    },
  });
}

/**
 * `GET /me/appointments/timeslots`. The hook is disabled until the caller
 * has all four params — locations/types are user-driven inputs so we never
 * fire with placeholders.
 */
export function useTimeslots(params: Partial<ListTimeslotsParams>) {
  const { locationId, appointmentTypeId, startTime, endTime } = params;
  const ready =
    typeof locationId === "number" &&
    typeof appointmentTypeId === "number" &&
    typeof startTime === "string" &&
    startTime !== "" &&
    typeof endTime === "string" &&
    endTime !== "";
  return useQuery({
    queryKey: queryKeys.trainerize.timeslots(
      locationId ?? 0,
      appointmentTypeId ?? 0,
      startTime ?? "",
      endTime ?? "",
    ),
    queryFn: () =>
      listTimeslots({
        locationId: locationId as number,
        appointmentTypeId: appointmentTypeId as number,
        startTime: startTime as string,
        endTime: endTime as string,
      }),
    enabled: ready,
    staleTime: 30 * 1000,
  });
}

export function useSelfBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SelfBookPayload) => selfBookAppointment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainerize", "appointments"] });
      // The slot the user just took is no longer available — refresh
      // anything currently watching this location/type's timeslot grid.
      qc.invalidateQueries({ queryKey: ["trainerize", "timeslots"] });
      // Appointments page now reads from `/me/calendar` because
      // `/me/appointments` is upstream-broken — refresh that too so the
      // new booking surfaces in Upcoming without a reload.
      qc.invalidateQueries({ queryKey: ["trainerize", "calendar"] });
    },
  });
}
