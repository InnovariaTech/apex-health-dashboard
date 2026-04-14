import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider } from "@/lib/AuthContext";
import { EnvironmentProvider } from "@/lib/EnvironmentContext";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

/**
 * Root provider stack: auth → environment → React Query → router shell.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <EnvironmentProvider>
          <Router>{children}</Router>
          <Toaster />
        </EnvironmentProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
