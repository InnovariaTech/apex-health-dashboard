import { useQuery } from "@tanstack/react-query";
import {
  fetchPatientProfileGlobalSettings,
  fetchPatientProfilePartnerIntegration,
  fetchPatientProfilePromoCode,
  fetchPatientProfileUserStatus,
} from "@/api/care-validate/profile";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  FetchPatientProfilePartnerIntegrationParams,
  FetchPatientProfilePromoCodeParams,
  FetchPatientProfileUserStatusParams,
  PatientProfileGlobalSettingsInfo,
  PatientProfilePartnerIntegrationInfo,
  PatientProfilePromoCodeInfo,
  PatientProfileUserStatus,
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

// Backward-compatible alias (old naming)
export const useProfile = useProfileStatus;
