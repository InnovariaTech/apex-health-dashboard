import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useAuthUser } from "@/hooks/auth/useAuth";
import type { AuthUser } from "@/types/auth_types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const authQuery = useAuthUser();
  const value: AuthContextValue = {
    user: authQuery.data ?? null,
    isAuthenticated: !!authQuery.data,
    isLoadingAuth: authQuery.isLoading,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
