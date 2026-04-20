import { axiosService } from "@/api/http/axiosInstance";
import type {
  FetchPatientProfileGlobalSettingsResponse,
  FetchPatientProfilePartnerIntegrationParams,
  FetchPatientProfilePartnerIntegrationResponse,
  FetchPatientProfilePromoCodeParams,
  FetchPatientProfilePromoCodeResponse,
  FetchPatientProfileUserStatusParams,
  FetchPatientProfileUserStatusResponse,
  PatientProfileGlobalSettingsInfo,
  PatientProfilePartnerIntegrationInfo,
  PatientProfilePromoCodeInfo,
  PatientProfileUserStatus,
} from "@/types/care-validate/profile_types";

const PATIENT_PROFILE_USER_ENDPOINT = "/api/patient/profile/user";
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

export async function fetchPatientProfileUserStatus(
  params: FetchPatientProfileUserStatusParams = {}
): Promise<PatientProfileUserStatus> {
  const email = params.email;
  const res = await axiosService.get<FetchPatientProfileUserStatusResponse>(
    PATIENT_PROFILE_USER_ENDPOINT,
    {
      params: {
        ...(email ? { email } : {}),
      },
    }
  );

  return mapPatientProfileUserStatus(res.data?.data);
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

// Backward-compatible alias (old naming)
export const fetchPatientProfileUser = fetchPatientProfileUserStatus;
