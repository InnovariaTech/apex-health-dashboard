import { axiosService } from "@/api/http/axiosInstance";
import type {
  FetchCheckUserParams,
  FetchPatientProfileGlobalSettingsResponse,
  FetchPatientProfilePartnerIntegrationParams,
  FetchPatientProfilePartnerIntegrationResponse,
  FetchPatientProfilePromoCodeParams,
  FetchPatientProfilePromoCodeResponse,
  FetchPatientProfileResponse,
  FetchPatientProfileUserStatusParams,
  FetchPatientProfileUserStatusResponse,
  PatientProfileGlobalSettingsInfo,
  PatientProfilePartnerIntegrationInfo,
  PatientProfilePromoCodeInfo,
  PatientProfileUserInfo,
  PatientProfileUserStatus,
  PaymentInfoShippingAddress,
  UpdatePatientProfileEmailBody,
  UpdatePatientProfileEmailResponse,
  UpdatePatientProfileUserBody,
  UpdatePatientProfileUserResponse,
  UpdatePaymentInfoBody,
  UpdatePaymentInfoData,
  UpdatePaymentInfoResponse,
} from "@/types/care-validate/profile_types";

const PATIENT_PROFILE_USER_ENDPOINT = "/api/patient/profile/user";
const PATIENT_PROFILE_USER_EMAIL_ENDPOINT = "/api/patient/profile/user/email";
const PATIENT_PROFILE_USER_PAYMENT_INFO_ENDPOINT =
  "/api/patient/profile/user/payment-info";
const PATIENT_PROFILE_CHECK_USER_ENDPOINT = "/api/patient/profile/check-user";
const PATIENT_PROFILE_PARTNER_INTEGRATION_ENDPOINT =
  "/api/patient/profile/partner-integration";
const PATIENT_PROFILE_GLOBAL_SETTINGS_ENDPOINT = "/api/patient/profile/global-settings";
const PATIENT_PROFILE_PROMO_CODE_ENDPOINT = "/api/patient/profile/promo-code";

function mapPatientProfileUserStatus(raw: unknown): PatientProfileUserStatus {
  const row = (raw ?? {}) as Record<string, unknown>;

  return {
    ...row,
    createdAt: String(row.createdAt ?? ""),
    existsInCurrentOrganization: Boolean(row.existsInCurrentOrganization),
    code: String(row.code ?? ""),
    message: String(row.message ?? ""),
    status: Number(row.status ?? 0),
    providerSuccess: Boolean(row.providerSuccess),
  };
}

function mapPatientProfileUser(raw: unknown): PatientProfileUserInfo {
  const row = (raw ?? {}) as Record<string, unknown>;

  return {
    ...row,
    email: String(row.email ?? ""),
    firstName: String(row.firstName ?? ""),
    lastName: String(row.lastName ?? ""),
    dob: String(row.dob ?? ""),
    phoneNumber: String(row.phoneNumber ?? ""),
    gender: String(row.gender ?? ""),
    address: String(row.address ?? ""),
    address2: String(row.address2 ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    country: String(row.country ?? ""),
    postalCode: String(row.postalCode ?? ""),
    allergies: String(row.allergies ?? ""),
    currentMedications: String(row.currentMedications ?? ""),
    healthConditions: String(row.healthConditions ?? ""),
    languagePreferences: Array.isArray(row.languagePreferences)
      ? row.languagePreferences.map((item) => String(item))
      : [],
  };
}

/**
 * `GET /api/patient/profile/user` (doc #23) — fetches the authenticated
 * user's full CareValidate profile. Portal-JWT protected, so requires
 * OTP verification to have completed at login.
 */
export async function fetchPatientProfile(): Promise<PatientProfileUserInfo> {
  const res = await axiosService.get<FetchPatientProfileResponse>(
    PATIENT_PROFILE_USER_ENDPOINT
  );

  return mapPatientProfileUser(res.data?.data?.profile);
}

/**
 * `GET /api/patient/profile/check-user` (doc #25) — looks up whether a
 * user (by email or phone) exists on CareValidate. Uses the `cv-api-key`
 * header, **not** the portal JWT, so it works pre-OTP.
 */
export async function fetchCheckUser(
  params: FetchCheckUserParams = {}
): Promise<PatientProfileUserStatus> {
  const { email, phoneNumber } = params;
  const res = await axiosService.get<FetchPatientProfileUserStatusResponse>(
    PATIENT_PROFILE_CHECK_USER_ENDPOINT,
    {
      params: {
        ...(email ? { email } : {}),
        ...(phoneNumber ? { phoneNumber } : {}),
      },
    }
  );

  return mapPatientProfileUserStatus(res.data?.data);
}

/**
 * @deprecated Old name that conflated `/profile/user` with `/profile/check-user`.
 * Use {@link fetchCheckUser} (status lookup) or {@link fetchPatientProfile}
 * (the real profile) depending on what you need. Kept so existing callers
 * keep working.
 */
export const fetchPatientProfileUserStatus = fetchCheckUser;

export async function updatePatientProfileUser(
  body: UpdatePatientProfileUserBody
): Promise<PatientProfileUserInfo> {
  const res = await axiosService.post<UpdatePatientProfileUserResponse>(
    PATIENT_PROFILE_USER_ENDPOINT,
    body
  );

  // Per doc #24 the response is `{ data: { profile: {...} } }`. Some
  // CareValidate environments still emit `data.user`, so we fall through.
  return mapPatientProfileUser(res.data?.data?.profile ?? res.data?.data?.user);
}

export async function updatePatientProfileUserEmail(
  body: UpdatePatientProfileEmailBody
): Promise<PatientProfileUserInfo> {
  const res = await axiosService.post<UpdatePatientProfileEmailResponse>(
    PATIENT_PROFILE_USER_EMAIL_ENDPOINT,
    body
  );

  return mapPatientProfileUser(res.data?.data?.profile ?? res.data?.data?.user);
}

/**
 * `POST /api/patient/profile/user/payment-info` (doc #27) — updates the
 * stored payment method on CareValidate. Exactly one of `stripeSetupId`
 * or `nmiPaymentToken` must be present.
 */
export async function updatePatientProfilePaymentInfo(
  body: UpdatePaymentInfoBody
): Promise<unknown> {
  const res = await axiosService.post<UpdatePaymentInfoResponse>(
    PATIENT_PROFILE_USER_PAYMENT_INFO_ENDPOINT,
    body
  );
  return res.data?.data ?? null;
}

/** Builder that asserts the "exactly one of" rule from doc #27. */
export function buildUpdatePaymentInfoPayload(args: {
  email: string;
  shippingAddress: PaymentInfoShippingAddress;
  stripeSetupId?: string;
  nmiPaymentToken?: string;
}): UpdatePaymentInfoBody {
  const { email, shippingAddress, stripeSetupId, nmiPaymentToken } = args;
  if (
    (Boolean(stripeSetupId) && Boolean(nmiPaymentToken)) ||
    (!stripeSetupId && !nmiPaymentToken)
  ) {
    throw new Error(
      "buildUpdatePaymentInfoPayload: provide exactly one of stripeSetupId or nmiPaymentToken"
    );
  }

  const data: UpdatePaymentInfoData = {
    email,
    shippingAddress,
    ...(stripeSetupId ? { stripeSetupId } : {}),
    ...(nmiPaymentToken ? { nmiPaymentToken } : {}),
  };

  return { action: "UPDATE_PAYMENT_INFO", data };
}

export function buildUpdateEmailPayload(
  currentEmail: string,
  newEmail: string
): UpdatePatientProfileEmailBody {
  return {
    action: "UPDATE_EMAIL",
    data: {
      currentEmail,
      newEmail,
    },
  };
}

function mapPatientProfilePartnerIntegration(
  raw: unknown
): PatientProfilePartnerIntegrationInfo {
  const row = (raw ?? {}) as Record<string, unknown>;

  return {
    ...row,
    available: Boolean(row.available),
    reason: String(row.reason ?? ""),
    operation: String(row.operation ?? ""),
    linkName: String(row.linkName ?? ""),
  };
}

export async function fetchPatientProfilePartnerIntegration(
  params: FetchPatientProfilePartnerIntegrationParams = {}
): Promise<PatientProfilePartnerIntegrationInfo> {
  const linkName = params.linkName;
  const res = await axiosService.get<FetchPatientProfilePartnerIntegrationResponse>(
    PATIENT_PROFILE_PARTNER_INTEGRATION_ENDPOINT,
    {
      params: {
        ...(linkName ? { linkName } : {}),
      },
    }
  );

  return mapPatientProfilePartnerIntegration(res.data?.data);
}

function mapPatientProfileGlobalSettings(raw: unknown): PatientProfileGlobalSettingsInfo {
  const row = (raw ?? {}) as Record<string, unknown>;

  return {
    ...row,
    available: Boolean(row.available),
    reason: String(row.reason ?? ""),
    operation: String(row.operation ?? ""),
  };
}

export async function fetchPatientProfileGlobalSettings(): Promise<PatientProfileGlobalSettingsInfo> {
  const res = await axiosService.get<FetchPatientProfileGlobalSettingsResponse>(
    PATIENT_PROFILE_GLOBAL_SETTINGS_ENDPOINT
  );

  return mapPatientProfileGlobalSettings(res.data?.data);
}

function mapPatientProfilePromoCode(raw: unknown): PatientProfilePromoCodeInfo {
  const row = (raw ?? {}) as Record<string, unknown>;

  return {
    ...row,
    success: Boolean(row.success),
    message: String(row.message ?? ""),
  };
}

export async function fetchPatientProfilePromoCode(
  params: FetchPatientProfilePromoCodeParams = {}
): Promise<PatientProfilePromoCodeInfo> {
  const code = params.code;
  const productBundleId = params.productBundleId;
  const res = await axiosService.get<FetchPatientProfilePromoCodeResponse>(
    PATIENT_PROFILE_PROMO_CODE_ENDPOINT,
    {
      params: {
        ...(code ? { code } : {}),
        ...(productBundleId ? { productBundleId } : {}),
      },
    }
  );

  return mapPatientProfilePromoCode(res.data);
}

/**
 * @deprecated Use {@link fetchPatientProfile} directly.
 * Previously aliased the broken `fetchPatientProfileUserStatus`; now points
 * to the real profile fetcher so legacy callers actually get the profile.
 */
export const fetchPatientProfileUser = fetchPatientProfile;
