import { useQuery } from "@tanstack/react-query";
import { listLocations } from "@/api/trainerize/locations";
import { queryKeys } from "@/hooks/queryKeys";

/**
 * `GET /me/locations` — active studio locations. Backs the self-book flow's
 * location picker. Cache lasts 5 minutes; locations rarely change.
 */
export function useTrainerizeLocations() {
  return useQuery({
    queryKey: queryKeys.trainerize.locations(),
    queryFn: listLocations,
    staleTime: 5 * 60 * 1000,
  });
}
