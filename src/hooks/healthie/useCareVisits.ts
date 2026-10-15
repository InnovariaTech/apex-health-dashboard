import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bookVisit,
  cancelVisit,
  listAvailableDays,
  listAvailableSlots,
  listVisitTypes,
  listVisits,
  rescheduleVisit,
} from "@/api/healthie/appointments";
import { queryKeys } from "@/hooks/queryKeys";
import type { BookVisitInput, RescheduleVisitInput, VisitFilter } from "@/types/healthie/appointments_types";

/** Visit types change rarely; the backend caches them for 5 minutes too. */
export function useVisitTypes(enabled = true) {
  return useQuery({
    queryKey: queryKeys.healthie.visitTypes(),
    queryFn: listVisitTypes,
    staleTime: 5 * 60_000,
    retry: false,
    enabled,
  });
}

/** Open days in a month. Availability moves as others book, so it is never kept long. */
export function useVisitDays(typeKey: string | null, month: string, timezone: string) {
  return useQuery({
    queryKey: queryKeys.healthie.visitDays(typeKey ?? "", month, timezone),
    queryFn: () => listAvailableDays(typeKey!, month, timezone),
    enabled: Boolean(typeKey),
    staleTime: 30_000,
    retry: false,
  });
}

export function useVisitSlots(typeKey: string | null, date: string | null, timezone: string) {
  return useQuery({
    queryKey: queryKeys.healthie.visitSlots(typeKey ?? "", date ?? "", timezone),
    queryFn: () => listAvailableSlots(typeKey!, date!, timezone),
    enabled: Boolean(typeKey && date),
    staleTime: 15_000,
    retry: false,
  });
}

export function useVisits(filter: VisitFilter) {
  return useQuery({
    queryKey: queryKeys.healthie.visits(filter),
    queryFn: () => listVisits(filter),
    staleTime: 30_000,
    retry: false,
  });
}

/** After any change: the visit lists and the availability it used are out of date. */
function useInvalidateVisits() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["healthie", "visits"] });
    void qc.invalidateQueries({ queryKey: ["healthie", "visit-days"] });
    void qc.invalidateQueries({ queryKey: ["healthie", "visit-slots"] });
  };
}

export function useBookVisit() {
  const invalidate = useInvalidateVisits();
  return useMutation({ mutationFn: (input: BookVisitInput) => bookVisit(input), onSuccess: invalidate });
}

export function useCancelVisit() {
  const invalidate = useInvalidateVisits();
  return useMutation({ mutationFn: (id: string) => cancelVisit(id), onSuccess: invalidate });
}

export function useRescheduleVisit() {
  const invalidate = useInvalidateVisits();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RescheduleVisitInput }) => rescheduleVisit(id, input),
    onSuccess: invalidate,
  });
}
