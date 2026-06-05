import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addUser,
  assignTrainer,
  attachUser,
  getOrgGroupId,
  lookupUsers,
} from "@/api/trainerize/onboarding";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  AddUserPayload,
  AttachUserPayload,
  LookupUsersParams,
  TrainerAssignmentPayload,
} from "@/types/trainerize/onboarding_types";

/**
 * Lookup & provisioning. Patient portal typically only needs `useOrgGroupId`
 * (gate check) and `useAssignTrainer` (if we expose trainer reassignment).
 * `addUser` / `attachUser` are primarily admin-side; included for parity.
 */

export function useOrgGroupId() {
  return useQuery({
    queryKey: queryKeys.trainerize.orgGroupId(),
    queryFn: getOrgGroupId,
    staleTime: 60 * 60 * 1000,
  });
}

export function useLookupUsers(params: LookupUsersParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.trainerize.usersLookup(
      params.email,
      params.text,
      params.start ?? 0,
      params.count ?? 10,
    ),
    queryFn: () => lookupUsers(params),
    enabled: enabled && (!!params.email || !!params.text),
    staleTime: 30 * 1000,
  });
}

function invalidateLinkage(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.trainerize.link() });
  qc.invalidateQueries({ queryKey: queryKeys.trainerize.profile() });
  qc.invalidateQueries({ queryKey: queryKeys.trainerize.settings() });
}

export function useAddUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddUserPayload) => addUser(payload),
    onSuccess: () => invalidateLinkage(queryClient),
  });
}

export function useAttachUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttachUserPayload) => attachUser(payload),
    onSuccess: () => invalidateLinkage(queryClient),
  });
}

export function useAssignTrainer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TrainerAssignmentPayload) => assignTrainer(payload),
    onSuccess: () => invalidateLinkage(queryClient),
  });
}
