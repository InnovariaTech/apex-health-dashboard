import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCheckUser,
  fetchPatientProfile,
  fetchPatientProfileGlobalSettings,
  fetchPatientProfilePartnerIntegration,
  fetchPatientProfilePromoCode,
  updatePatientProfilePaymentInfo,
  updatePatientProfileUserEmail,
  updatePatientProfileUser,
} from "@/api/care-validate/profile";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  FetchCheckUserParams,
  FetchPatientProfilePartnerIntegrationParams,
  FetchPatientProfilePromoCodeParams,
  PatientProfileGlobalSettingsInfo,
  PatientProfilePartnerIntegrationInfo,
  PatientProfilePromoCodeInfo,
  PatientProfileUserInfo,
  PatientProfileUserStatus,
  UpdatePatientProfileEmailBody,
  UpdatePatientProfileUserBody,
  UpdatePaymentInfoBody,
} from "@/types/care-validate/profile_types";

/**
 * Real CareValidate profile fetch (`GET /api/patient/profile/user`, doc #23).
 * Portal-JWT protected — only resolves once the user has completed OTP at
 * login. Returns `firstName`, `lastName`, `phoneNumber`, `dob`, address,
 * health fields, etc.
 */
export function useProfile() {
  return useQuery<PatientProfileUserInfo>({
    queryKey: queryKeys.careValidate.profile(),
    queryFn: fetchPatientProfile,
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * CareValidate `check-user` lookup (`GET /api/patient/profile/check-user`,
 * doc #25). Tells you whether an email/phone exists on the CareValidate
 * side. Does **not** require the portal JWT.
 */
export function useProfileStatus(params: FetchCheckUserParams = {}) {
  const email = params.email;
  const phoneNumber = params.phoneNumber;

  return useQuery<PatientProfileUserStatus>({
    queryKey: queryKeys.careValidate.profileUserStatus(email, phoneNumber),
    queryFn: () =>
      fetchCheckUser({
        ...(email ? { email } : {}),
        ...(phoneNumber ? { phoneNumber } : {}),
      }),
    staleTime: 60_000,
  });
}

/** @deprecated Old name — use {@link useProfileStatus}. */
export const useCheckUser = useProfileStatus;

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
      fetchPatientProfilePromoCode({
        ...(code ? { code } : {}),
        ...(productBundleId ? { productBundleId } : {}),
      }),
    enabled: Boolean(code),
    staleTime: 60_000,
  });
}

function invalidateProfileQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.careValidate.profile(),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.careValidate.profileUserStatus(),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.auth.user(),
    }),
  ]);
}

export function useUpdateProfileUser() {
  const queryClient = useQueryClient();

  return useMutation<PatientProfileUserInfo, unknown, UpdatePatientProfileUserBody>({
    mutationFn: (body) => updatePatientProfileUser(body),
    onSuccess: () => invalidateProfileQueries(queryClient),
  });
}

export function useUpdateProfileUserEmail() {
  const queryClient = useQueryClient();

  return useMutation<PatientProfileUserInfo, unknown, UpdatePatientProfileEmailBody>({
    mutationFn: (body) => updatePatientProfileUserEmail(body),
    onSuccess: () => invalidateProfileQueries(queryClient),
  });
}

/** `POST /api/patient/profile/user/payment-info` (doc #27). */
export function useUpdatePaymentInfo() {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, UpdatePaymentInfoBody>({
    mutationFn: (body) => updatePatientProfilePaymentInfo(body),
    onSuccess: () =>
      Promise.all([
        invalidateProfileQueries(queryClient),
        queryClient.invalidateQueries({
          queryKey: queryKeys.careValidate.billingPaymentMethods(),
        }),
      ]),
  });
}
