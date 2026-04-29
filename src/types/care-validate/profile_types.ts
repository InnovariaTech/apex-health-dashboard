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

export type PatientProfileGender = "MALE" | "FEMALE" | "OTHER" | string;

export interface UpdatePatientProfileUserBody {
  firstName: string;
  lastName: string;
  dob: string;
  gender: PatientProfileGender;
  phoneNumber: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  allergies?: string;
  currentMedications?: string;
  healthConditions?: string;
  languagePreferences?: string[];
}

export interface PatientProfileUserInfo {
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  phoneNumber: string;
  gender: PatientProfileGender;
  address: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  allergies: string;
  currentMedications: string;
  healthConditions: string;
  languagePreferences: string[];
  [key: string]: unknown;
}

export interface UpdatePatientProfileUserResponse {
  success?: boolean;
  message?: string;
  data?: {
    user?: unknown;
    [key: string]: unknown;
  };
}

export type UpdatePatientProfileEmailAction = "UPDATE_EMAIL";

export interface UpdatePatientProfileEmailBody {
  action: UpdatePatientProfileEmailAction;
  data: {
    newEmail: string;
    currentEmail: string;
  };
}

export interface UpdatePatientProfileEmailResponse {
  success?: boolean;
  message?: string;
  data?: {
    user?: unknown;
    [key: string]: unknown;
  };
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
