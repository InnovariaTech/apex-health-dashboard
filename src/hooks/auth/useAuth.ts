import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResult,
  ResetPasswordPayload,
  SignupPayload,
  VerifyOtpPayload,
  VerifyOtpResult,
} from "@/types/auth_types";
import { queryKeys } from "@/hooks/queryKeys";
import { useNavigate } from "react-router-dom";
import { getImpersonation } from "@/lib/impersonation";

export function useAuthUser() {
  return useQuery<AuthUser | null>({
    queryKey: queryKeys.auth.user(),
    // While impersonating, identity comes from the impersonation session
    // (persisted client-side) — `/auth/me` doesn't report the viewed patient,
    // so calling it would log the app out from under the read-only view.
    queryFn: () => {
      const imp = getImpersonation();
      if (imp) return imp.user;
      return api.auth.me();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation<LoginResult, unknown, LoginPayload>({
    mutationFn: (payload) => api.auth.login(payload),
    onSuccess: (result) => {
      // When OTP is required the user is technically logged in (auth cookies
      // are set) but CareValidate portal routes will 400 until the code is
      // verified. Keep `isAuthenticated` false so the Login screen stays
      // mounted to drive the OTP step — Login itself sets this query data
      // explicitly after a successful verification.
      if (!result.requiredOtp) {
        queryClient.setQueryData(queryKeys.auth.user(), result.user);
      }
    },
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();
  return useMutation<VerifyOtpResult, unknown, VerifyOtpPayload>({
    mutationFn: (payload) => api.auth.verifyPortalOtp(payload),
    onSuccess: () => {
      // Refetch `me` so any consumer relying on the user query stays in sync.
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
    },
  });
}

/**
 * Request a password-reset OTP. Per the auth handoff doc, success is
 * always returned regardless of whether the email exists — UI should
 * show a neutral "if this email is registered…" message.
 */
export function useForgotPassword() {
  return useMutation<unknown, unknown, ForgotPasswordPayload>({
    mutationFn: (payload) => api.auth.forgotPassword(payload),
  });
}

/**
 * Submit the 6-digit OTP + new password. Backend revokes active
 * sessions on success; the caller should redirect to /login.
 */
export function useResetPassword() {
  return useMutation<unknown, unknown, ResetPasswordPayload>({
    mutationFn: (payload) => api.auth.resetPassword(payload),
  });
}

/**
 * Create an account.
 *
 * Note what this deliberately does *not* do: it never writes the new user
 * into the auth query. Signup sets Apex auth cookies but issues no
 * CareValidate portal session, so marking the app "authenticated" here would
 * land the user on a dashboard whose profile/cases/documents calls all fail.
 * Only `login` establishes the portal session (see the `requiredOtp` flow),
 * so the Signup screen redirects to /login on success.
 */
export function useSignupMutation() {
  return useMutation({
    mutationFn: (payload: SignupPayload) => api.auth.signup(payload),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const clearAuthState = () => {
    queryClient.setQueryData(queryKeys.auth.user(), null);
  };

  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      clearAuthState();
      navigate("/login");
    },
    onError: () => {
      clearAuthState();
      navigate("/login");
    },
  });
}
