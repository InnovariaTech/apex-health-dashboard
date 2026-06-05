import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { queryKeys } from "@/hooks/queryKeys";

/**
 * Listens for the `auth:session-expired` event dispatched by
 * `axiosService` when a refresh attempt fails (refresh token missing /
 * expired / revoked). Clears the cached auth user and redirects to `/login`.
 *
 * Mount this once, inside the Router and QueryClientProvider, via the
 * <SessionExpiryWatcher /> wrapper below.
 */
export function useSessionExpiry() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => {
      queryClient.setQueryData(queryKeys.auth.user(), null);
      // Avoid bouncing while already on the auth screens.
      if (
        location.pathname !== "/login" &&
        location.pathname !== "/signup"
      ) {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, [queryClient, navigate, location.pathname]);
}

/** Headless component that activates the hook in the provider tree. */
export function SessionExpiryWatcher() {
  useSessionExpiry();
  return null;
}
