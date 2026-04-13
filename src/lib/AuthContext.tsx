import { createContext, useState, useContext, useEffect } from "react";
import type { Context } from "react";
import type { ReactNode } from "react";
import { api } from "@/api/client";
import type { AuthUser } from "@/types/auth_types";
import type { ApiError } from "@/types/error";
import { isApiError } from "@/types/error";

type AuthErrorType = "auth_required" | "user_not_registered" | "unknown";

interface AuthErrorState {
  type: AuthErrorType;
  message: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: AuthErrorState | null;
  appPublicSettings: { id: string; public_settings: Record<string, unknown> };
  logout: (shouldRedirect?: boolean) => void;
  login: (payload: { email: string; password: string }) => Promise<AuthUser | null>;
  signup: (payload: {
    full_name?: string;
    email: string;
    phone?: string;
    password: string;
  }) => Promise<AuthUser | null>;
  navigateToLogin: () => void;
  checkAppState: () => Promise<void>;
}

const globalAuthStore = globalThis as typeof globalThis & {
  __APEX_AUTH_CONTEXT__?: Context<AuthContextValue | undefined>;
};

const AuthContext =
  globalAuthStore.__APEX_AUTH_CONTEXT__ ?? createContext<AuthContextValue | undefined>(undefined);

if (!globalAuthStore.__APEX_AUTH_CONTEXT__) {
  globalAuthStore.__APEX_AUTH_CONTEXT__ = AuthContext;
}

function isUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as Partial<ApiError> & { message?: string; code?: string };
  return (
    maybeError.status === 401 ||
    maybeError.status === 403 ||
    maybeError.message === "auth_required" ||
    maybeError.code === "auth_required"
  );
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState<AuthErrorState | null>(null);
  const appPublicSettings = { id: "mock", public_settings: {} };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setAuthError(null);
        const currentUser = await api.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch (error) {
        const unauthorized = isUnauthorizedError(error);
        if (unauthorized && typeof api.auth.refresh === "function") {
          try {
            await api.auth.refresh();
            const refreshedUser = await api.auth.me();
            setUser(refreshedUser);
            setIsAuthenticated(true);
            setAuthError(null);
            return;
          } catch {
            // falls through to auth_required below
          }
        }

        if (unauthorized) {
          setAuthError({ type: "auth_required", message: "Please login to continue" });
        } else {
          const fallbackMessage = isApiError(error)
            ? error.message
            : error instanceof Error
              ? error.message
              : "Failed to load";
          console.error("Auth bootstrap failed:", error);
          setAuthError({ type: "unknown", message: fallbackMessage });
        }
      } finally {
        setIsLoadingAuth(false);
      }
    };
    bootstrap();
  }, []);

  const logout = (shouldRedirect = true) => {
    void shouldRedirect;
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: "auth_required", message: "Please login to continue" });
    void api.auth.logout();
  };

  const navigateToLogin = () => {
    api.auth.redirectToLogin();
  };

  const login = async ({ email, password }: { email: string; password: string }) => {
    const currentUser = await api.auth.login({ email, password });
    setUser(currentUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return currentUser;
  };

  const signup = async ({
    full_name,
    email,
    phone,
    password,
  }: {
    full_name?: string;
    email: string;
    phone?: string;
    password: string;
  }) => {
    const payload = {
      email,
      password,
      ...(full_name ? { full_name } : {}),
      ...(phone ? { phone } : {}),
    };
    const currentUser = await api.auth.signup(payload);
    setUser(currentUser);
    setIsAuthenticated(true);
    setAuthError(null);
    return currentUser;
  };

  const checkAppState = async () => {
    try {
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      console.error('App state check failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        login,
        signup,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
