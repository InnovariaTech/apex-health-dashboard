export interface PatientProfileUserStatus {
  createdAt: string;
  existsInCurrentOrganization: boolean;
  code: string;
  message: string;
  status: number;
  providerSuccess: boolean;
  [key: string]: unknown;
}

export interface FetchPatientProfileUserStatusResponse {
  success?: boolean;
  data: PatientProfileUserStatus;
}

export interface FetchPatientProfileUserStatusParams {
  email?: string;
}

export interface PatientProfilePartnerIntegrationInfo {
  available: boolean;
  reason: string;
  operation: string;
  linkName: string;
  [key: string]: unknown;
}

export interface FetchPatientProfilePartnerIntegrationResponse {
  success?: boolean;
  data: PatientProfilePartnerIntegrationInfo;
}

export interface FetchPatientProfilePartnerIntegrationParams {
  linkName?: string;
}

export interface PatientProfileGlobalSettingsInfo {
  available: boolean;
  reason: string;
  operation: string;
  [key: string]: unknown;
}

export interface FetchPatientProfileGlobalSettingsResponse {
  success?: boolean;
  data: PatientProfileGlobalSettingsInfo;
}

export interface PatientProfilePromoCodeInfo {
  success: boolean;
  message: string;
  [key: string]: unknown;
}

export interface FetchPatientProfilePromoCodeResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface FetchPatientProfilePromoCodeParams {
  code?: string;
  productBundleId?: string;
}

// Backward-compatible aliases (old naming)
export type PatientProfileUserItem = PatientProfileUserStatus;
export type FetchPatientProfileUserResponse = FetchPatientProfileUserStatusResponse;
