import { useQuery } from "@tanstack/react-query";
import { listCalendar } from "@/api/trainerize/calendar";
import { queryKeys } from "@/hooks/queryKeys";
import { useTrainerizeUnits } from "./useLinkage";

/**
 * `GET /me/calendar` for the given date range. Reads units from settings —
 * the hook is disabled until units are ready so we don't fire with defaults
 * that may differ from the user's real preferences.
 */
export function useTrainerizeCalendar(startDate: string, endDate: string) {
  const { unitWeight, unitDistance, isReady } = useTrainerizeUnits();
  return useQuery({
    queryKey: queryKeys.trainerize.calendar(
      startDate,
      endDate,
      unitWeight,
      unitDistance,
    ),
    queryFn: () =>
      listCalendar({ startDate, endDate, unitDistance, unitWeight }),
    enabled: isReady && !!startDate && !!endDate,
    staleTime: 60 * 1000,
  });
}
