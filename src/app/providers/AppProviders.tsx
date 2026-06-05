import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider } from "@/lib/AuthContext";
import { EnvironmentProvider } from "@/lib/EnvironmentContext";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { SessionExpiryWatcher } from "@/hooks/auth/useSessionExpiry";

/**
 * Root provider stack: auth → environment → React Query → router shell.
 *
 * `SessionExpiryWatcher` listens for the `auth:session-expired` event
 * raised by the axios interceptor when refresh fails, clears the cached
 * auth user, and bounces the user back to `/login`.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <EnvironmentProvider>
          <Router>
            <SessionExpiryWatcher />
            {children}
          </Router>
          <Toaster />
        </EnvironmentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
