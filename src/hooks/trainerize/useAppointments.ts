import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bookAppointment,
  getAppointmentTypeDetail,
  listAppointments,
  listAppointmentTypes,
} from "@/api/trainerize/appointments";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  BookAppointmentPayload,
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
    queryFn: () =>
      listAppointments(
        startDate && endDate ? { startDate, endDate } : {},
      ),
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
