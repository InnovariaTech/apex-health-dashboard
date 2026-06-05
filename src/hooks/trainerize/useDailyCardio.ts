import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCardio,
  getCardio,
  updateCardio,
} from "@/api/trainerize/cardio";
import { queryKeys } from "@/hooks/queryKeys";
import { useTrainerizeUnits } from "./useLinkage";
import type {
  CreateCardioPayload,
  UpdateCardioPayload,
} from "@/types/trainerize/cardio_types";

export function useCardioSession(dailyCardioId: number | undefined) {
  const { unitDistance } = useTrainerizeUnits();
  return useQuery({
    queryKey: queryKeys.trainerize.cardio(dailyCardioId ?? 0, unitDistance),
    queryFn: () =>
      getCardio({
        dailyCardioId: dailyCardioId as number,
        unitDistance,
      }),
    enabled: typeof dailyCardioId === "number" && dailyCardioId > 0,
    staleTime: 60 * 1000,
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["trainerize", "cardio"] });
  queryClient.invalidateQueries({ queryKey: ["trainerize", "calendar"] });
}

export function useCreateCardio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCardioPayload) => createCardio(payload),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useUpdateCardio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCardioPayload) => updateCardio(payload),
    onSuccess: () => invalidate(queryClient),
  });
}
