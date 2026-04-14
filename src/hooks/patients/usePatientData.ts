import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { AuthUser } from "@/types/auth_types";
import { queryKeys } from "@/hooks/queryKeys";

export function usePatientData(enabled = true) {
  return useQuery<AuthUser | null>({
    queryKey: queryKeys.patients.me,
    queryFn: () => api.auth.me(),
    staleTime: 60_000,
    enabled,
  });
}
