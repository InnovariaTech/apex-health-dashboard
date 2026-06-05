import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLink, getProfile, getSettings } from "@/api/trainerize/linkage";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  TrainerizeSettings,
  TrainerizeUnits,
} from "@/types/trainerize/linkage_types";

/**
 * Linkage / profile / settings hooks. `useTrainerizeUnits` is the single
 * source of truth other Trainerize hooks consume — every endpoint that
 * accepts unit params reads from here (see CLIENT_DASHBOARD_INTEGRATION.md
 * "Unit Display Rules"). Settings are cached for 5 minutes since they rarely
 * change within a session.
 */

const FIVE_MIN = 5 * 60 * 1000;

export function useTrainerizeLink() {
  return useQuery({
    queryKey: queryKeys.trainerize.link(),
    queryFn: getLink,
    staleTime: FIVE_MIN,
    retry: false,
  });
}

export function useTrainerizeProfile() {
  return useQuery({
    queryKey: queryKeys.trainerize.profile(),
    queryFn: getProfile,
    staleTime: FIVE_MIN,
  });
}

export function useTrainerizeSettings() {
  return useQuery({
    queryKey: queryKeys.trainerize.settings(),
    queryFn: getSettings,
    staleTime: FIVE_MIN,
  });
}

/**
 * Default units when settings haven't loaded yet — Trainerize's defaults are
 * imperial-leaning per their docs' example payloads. Real values overwrite
 * once `/me/settings` resolves.
 */
const DEFAULT_UNITS: TrainerizeUnits = {
  unitWeight: "lbs",
  unitDistance: "miles",
  unitBodystat: "inches",
};

export function pickUnits(settings: TrainerizeSettings | undefined): TrainerizeUnits {
  if (!settings) return DEFAULT_UNITS;
  return {
    unitWeight: settings.unitWeight ?? DEFAULT_UNITS.unitWeight,
    unitDistance: settings.unitDistance ?? DEFAULT_UNITS.unitDistance,
    unitBodystat: settings.unitBodystat ?? DEFAULT_UNITS.unitBodystat,
  };
}

/**
 * Subscribe to current Trainerize units. Returns defaults until
 * `/me/settings` resolves — callers should also check `isReady` if they
 * want to defer network calls that depend on unit accuracy.
 */
export function useTrainerizeUnits() {
  const { data, isSuccess } = useTrainerizeSettings();
  const units = useMemo(() => pickUnits(data), [data]);
  return { ...units, isReady: isSuccess };
}

/** Read units from the query cache without subscribing. */
export function useReadTrainerizeUnits(): TrainerizeUnits {
  const queryClient = useQueryClient();
  const data = queryClient.getQueryData<TrainerizeSettings>(
    queryKeys.trainerize.settings(),
  );
  return pickUnits(data);
}
