import { axiosService } from "./axiosInstance";
import type {
  AuthApi,
  AuthResponseBody,
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResult,
  ResetPasswordPayload,
  SignupPayload,
  VerifyOtpPayload,
  VerifyOtpResult,
} from "@/types/auth_types";

const AUTH_BASE = "/api/auth";

function mapUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;

  const user = raw as Record<string, unknown>;
  if (typeof user.email !== "string") return null;

  return {
    email: user.email,
    ...(typeof user.id === "string" || typeof user.id === "number" ? { id: user.id } : {}),
    ...(typeof user.role === "string" ? { role: user.role } : {}),
    ...(typeof user.isVerified === "boolean" ? { isVerified: user.isVerified } : {}),
    ...(typeof user.isActive === "boolean" ? { isActive: user.isActive } : {}),
    ...(typeof user.createdAt === "string" ? { createdAt: user.createdAt } : {}),
  };
}

function getUserFromResponse(data: unknown): AuthUser | null {
  if (!data || typeof data !== "object") return null;
  const body = data as AuthResponseBody;
  return mapUser(body.user);
}

function getRequiredOtpFromResponse(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const body = data as AuthResponseBody;
  return body.requiredOtp === true;
}

export function createAuthApi(): AuthApi {
  return {
    async signup({ full_name, email, phone, password, role = "patient" }: SignupPayload) {
      const res = await axiosService.post<AuthResponseBody>(`${AUTH_BASE}/signup`, {
        full_name,
        email,
        phone,
        password,
        role,
      });
      return getUserFromResponse(res.data);
    },
    async login({ email, password }: LoginPayload): Promise<LoginResult> {
      const res = await axiosService.post<AuthResponseBody>(`${AUTH_BASE}/login`, {
        email,
        password,
      });
      return {
        user: getUserFromResponse(res.data),
        requiredOtp: getRequiredOtpFromResponse(res.data),
      };
    },
    async me() {
      const res = await axiosService.get<AuthResponseBody>(`${AUTH_BASE}/me`);
      return getUserFromResponse(res.data);
    },
    async refresh() {
      const res = await axiosService.post<AuthResponseBody>(`${AUTH_BASE}/refresh`);
      return getUserFromResponse(res.data);
    },
    async logout() {
      await axiosService.post(`${AUTH_BASE}/logout`);
    },
    async forgotPassword({ email }: ForgotPasswordPayload) {
      const res = await axiosService.post(`${AUTH_BASE}/forgot-password`, { email });
      return res.data;
    },
    async resetPassword({ token, newPassword }: ResetPasswordPayload) {
      const res = await axiosService.post(`${AUTH_BASE}/reset-password`, { token, newPassword });
      return res.data;
    },
    async verifyPortalOtp({ code }: VerifyOtpPayload): Promise<VerifyOtpResult> {
      const res = await axiosService.post<{ otpVerified?: boolean }>(
        `${AUTH_BASE}/carevalidate/verify-otp`,
        { code }
      );
      return { otpVerified: res.data?.otpVerified === true };
    },
    // async updateMe(form: Partial<AuthUser>) {
    //   const current = await this.me();
    //   if (!current) return null;
    //   return { ...current, ...form };
    // },
    redirectToLogin: () => {},
  };
}
