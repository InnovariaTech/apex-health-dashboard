import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { AuthProvider } from "@/lib/AuthContext";
import { EnvironmentProvider } from "@/lib/EnvironmentContext";
import { ViewModeProvider } from "@/lib/ViewModeContext";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

/**
 * Root provider stack: auth → environment → view mode → React Query → router shell.
 * Route definitions stay in `App.jsx` so `pages.config` remains easy to find.
 */
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <EnvironmentProvider>
        <ViewModeProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>{children}</Router>
            <Toaster />
          </QueryClientProvider>
        </ViewModeProvider>
      </EnvironmentProvider>
    </AuthProvider>
  );
}
