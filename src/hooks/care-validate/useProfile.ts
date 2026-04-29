import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPatientProfileGlobalSettings,
  fetchPatientProfilePartnerIntegration,
  fetchPatientProfilePromoCode,
  fetchPatientProfileUserStatus,
  updatePatientProfileUserEmail,
  updatePatientProfileUser,
} from "@/api/care-validate/profile";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  FetchPatientProfilePartnerIntegrationParams,
  FetchPatientProfilePromoCodeParams,
  FetchPatientProfileUserStatusParams,
  PatientProfileGlobalSettingsInfo,
  PatientProfilePartnerIntegrationInfo,
  PatientProfilePromoCodeInfo,
  PatientProfileUserInfo,
  PatientProfileUserStatus,
  UpdatePatientProfileEmailBody,
  UpdatePatientProfileUserBody,
} from "@/types/care-validate/profile_types";

export function useProfileStatus(
  params: FetchPatientProfileUserStatusParams = {}
) {
  const email = params.email;

  return useQuery<PatientProfileUserStatus>({
    queryKey: queryKeys.careValidate.profileUser(email),
    queryFn: () => fetchPatientProfileUserStatus(email ? { email } : {}),
    staleTime: 60_000,
  });
}

export function useProfilePartnerIntegration(
  params: FetchPatientProfilePartnerIntegrationParams = {}
) {
  const linkName = params.linkName;

  return useQuery<PatientProfilePartnerIntegrationInfo>({
    queryKey: queryKeys.careValidate.profilePartnerIntegration(linkName),
    queryFn: () =>
      fetchPatientProfilePartnerIntegration(linkName ? { linkName } : {}),
    staleTime: 60_000,
  });
}

export function useProfileGlobalSettings() {
  return useQuery<PatientProfileGlobalSettingsInfo>({
    queryKey: queryKeys.careValidate.profileGlobalSettings(),
    queryFn: fetchPatientProfileGlobalSettings,
    staleTime: 60_000,
  });
}

export function useProfilePromoCode(
  params: FetchPatientProfilePromoCodeParams = {}
) {
  const code = params.code;
  const productBundleId = params.productBundleId;

  return useQuery<PatientProfilePromoCodeInfo>({
    queryKey: queryKeys.careValidate.profilePromoCode(code, productBundleId),
    queryFn: () =>
      fetchPatientProfilePromoCode(
        {
          ...(code ? { code } : {}),
          ...(productBundleId ? { productBundleId } : {}),
        }
      ),
    enabled: Boolean(code),
    staleTime: 60_000,
  });
}

export function useUpdateProfileUser() {
  const queryClient = useQueryClient();

  return useMutation<PatientProfileUserInfo, unknown, UpdatePatientProfileUserBody>({
    mutationFn: (body) => updatePatientProfileUser(body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.careValidate.profileUserStatus(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.careValidate.profileUser(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.auth.user(),
        }),
      ]);
    },
  });
}

export function useUpdateProfileUserEmail() {
  const queryClient = useQueryClient();

  return useMutation<PatientProfileUserInfo, unknown, UpdatePatientProfileEmailBody>({
    mutationFn: (body) => updatePatientProfileUserEmail(body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.careValidate.profileUserStatus(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.careValidate.profileUser(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.auth.user(),
        }),
      ]);
    },
  });
}

// Backward-compatible alias (old naming)
export const useProfile = useProfileStatus;
