import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { AuthUser, LoginPayload, SignupPayload } from "@/types/auth_types";
import { queryKeys } from "@/hooks/queryKeys";
import { useNavigate } from "react-router-dom";

export function useAuthUser() {
  return useQuery<AuthUser | null>({
    queryKey: queryKeys.auth.user(),
    queryFn: () => api.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginPayload) => api.auth.login(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.user(), user);
    },
  });
}

export function useSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SignupPayload) => api.auth.signup(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.user(), user);
    },
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
