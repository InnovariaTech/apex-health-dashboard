/**
 * Result of `GET /api/patient/profile/check-user` (doc #25).
 * NOT to be confused with the actual patient profile (`/profile/user`, doc #23).
 */
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

/** Params for `GET /api/patient/profile/check-user` (doc #25). */
export interface FetchCheckUserParams {
  email?: string;
  phoneNumber?: string;
}

/** Legacy alias preserved for backward compatibility. */
export type FetchPatientProfileUserStatusParams = FetchCheckUserParams;

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

/**
 * Response of `GET /api/patient/profile/user` (doc #23) — the real,
 * portal-JWT-protected patient profile.
 */
export interface FetchPatientProfileResponse {
  success?: boolean;
  data?: {
    profile?: unknown;
    [key: string]: unknown;
  };
}

/**
 * The doc shows `data.profile`; older CareValidate responses sometimes used
 * `data.user`. Accept both — the mapper picks whichever is present.
 */
export interface UpdatePatientProfileUserResponse {
  success?: boolean;
  message?: string;
  data?: {
    profile?: unknown;
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
    profile?: unknown;
    user?: unknown;
    [key: string]: unknown;
  };
}

// ─── Payment info (doc #27) ────────────────────────────────────────────────

export interface PaymentInfoShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export type UpdatePaymentInfoAction = "UPDATE_PAYMENT_INFO";

export interface UpdatePaymentInfoData {
  email: string;
  /** Provide exactly one of `stripeSetupId` or `nmiPaymentToken`. */
  stripeSetupId?: string;
  /** Provide exactly one of `stripeSetupId` or `nmiPaymentToken`. */
  nmiPaymentToken?: string;
  shippingAddress: PaymentInfoShippingAddress;
}

export interface UpdatePaymentInfoBody {
  action: UpdatePaymentInfoAction;
  data: UpdatePaymentInfoData;
}

export interface UpdatePaymentInfoResponse {
  success: boolean;
  data?: unknown;
  message?: string | null;
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
