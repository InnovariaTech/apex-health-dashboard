export interface AuthUser {
  id?: string | number;
  email: string;
  role?: string;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Body accepted by `POST /api/auth/signup`.
 *
 * Deliberately narrow: the endpoint takes only these three keys. It has no
 * name or phone field, so those are not collected at signup.
 *
 * `role` is accepted by the request schema but ignored by the service —
 * signup always creates a `patient`.
 */
export interface SignupPayload {
  email: string;
  /** Minimum 8 characters (backend rule). */
  password: string;
  role?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

/**
 * Backend contract (see `docs/auth/frontend-carevalidate-auth-admin-handoff.md`
 * §"Step 2: Submit Reset OTP + New Password"). The old `{ token, newPassword }`
 * shape is deprecated — `POST /api/auth/forgot-password` no longer issues a
 * token; users receive a 6-digit OTP by email.
 */
export interface ResetPasswordPayload {
  email: string;
  /** Exactly 6 digits — matches the backend `^\d{6}$` schema. */
  code: string;
  /** Minimum 8 characters. */
  newPassword: string;
}

export interface VerifyOtpPayload {
  /** Exactly 6 digits — matches the backend `^\d{6}$` schema. */
  code: string;
}

export interface AuthResponseBody {
  user?: AuthUser;
  /**
   * Returned only by `POST /api/auth/login`.
   *
   * `true`  → a one-time code has just been emailed; the client must call
   *           `verifyPortalOtp({ code })` before hitting any CareValidate
   *           portal-JWT-protected route (profile, documents, files).
   * `false` → the user's existing portal refresh token was still valid;
   *           portal routes are ready to use immediately.
   */
  requiredOtp?: boolean;
  message?: string;
}

/** Shape returned by `AuthApi.login()` — surfaces `requiredOtp` to the UI. */
export interface LoginResult {
  user: AuthUser | null;
  requiredOtp: boolean;
}

export interface VerifyOtpResult {
  otpVerified: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  issues?: Array<{ code: string; path: string[]; message: string }>; // Zod errors
}

export interface AuthApi {
  signup(payload: SignupPayload): Promise<AuthUser | null>;
  login(payload: LoginPayload): Promise<LoginResult>;
  me(): Promise<AuthUser | null>;
  refresh(): Promise<AuthUser | null>;
  logout(): Promise<void>;
  forgotPassword(payload: ForgotPasswordPayload): Promise<unknown>;
  resetPassword(payload: ResetPasswordPayload): Promise<unknown>;
  /**
   * Exchanges the 6-digit OTP delivered after login for a CareValidate portal
   * session. Auth-cookie protected — the user must already be logged in.
   */
  verifyPortalOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResult>;
  // updateMe(form: Partial<AuthUser>): Promise<AuthUser | null>;
  redirectToLogin(): void;
}
