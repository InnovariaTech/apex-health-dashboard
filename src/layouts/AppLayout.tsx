// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Settings, Activity, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { api } from "@/api/client";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { useLogout } from "@/hooks/auth/useAuth";
import AIAssistantBar from "@/components/env/AIAssistantBar";
import GymSwitcher from "@/components/env/GymSwitcher";
import { getPatientNavItems } from "@/views/patient/config/patientNavigation";

export default function Layout({ children }) {
  const location = useLocation();
  const { environment } = useEnvironment();
  const logoutMutation = useLogout();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await api.auth.me();
    setCurrentUser(user);
  };

  const isGymEnv = environment.id !== "apex-md";
  const navItems = getPatientNavItems(isGymEnv);

  const isDark = environment.themeMode === "dark" || environment.id === "apex-md";
  const activeItemBg = environment.primaryColor;
  const activeItemTextColor =
    environment.id === "planet-fitness" || environment.id === "golds-gym"
      ? "#000000"
      : "#FFFFFF";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={{ backgroundColor: environment.backgroundColor }}>
        <Sidebar
          className="border-r"
          style={{
            backgroundColor: environment.sidebarBg,
            borderColor: environment.borderColor,
          }}
        >
          <SidebarHeader
            className="border-b p-4"
            style={{ borderColor: environment.borderColor }}
          >
            <Link to={createPageUrl("Dashboard")} className="block">
              <div className="bg-white rounded-sm px-3 py-2 inline-block">
                <img
                  src={environment.logoUrl}
                  alt={environment.name}
                  className="h-20 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <span
                  className="hidden text-sm font-bold"
                  style={{ color: environment.primaryColor }}
                >
                  {environment.name}
                </span>
              </div>
              {isGymEnv && (
                <p className="text-xs mt-1 font-semibold text-center" style={{ color: environment.mutedTextColor }}>
                  Powered by Apex MD
                </p>
              )}
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className="mb-1 transition-all duration-200"
                          style={
                            isActive
                              ? { backgroundColor: activeItemBg, color: activeItemTextColor }
                              : { color: environment.sidebarText, opacity: 0.75 }
                          }
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-semibold">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {currentUser?.health_score != null && (
              <div
                className="mt-6 mx-3 p-4 rounded-lg border"
                style={{
                  backgroundColor: isDark ? "#1a1a2e" : environment.surfaceColor,
                  borderColor: environment.borderColor,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-sm font-bold uppercase tracking-wide"
                    style={{ color: environment.sidebarText }}
                  >
                    Health Score
                  </span>
                  <Activity className="w-4 h-4" style={{ color: environment.primaryColor }} />
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-bold" style={{ color: environment.sidebarText }}>
                    {Math.round(currentUser.health_score)}
                  </span>
                  <span className="text-lg font-semibold" style={{ color: environment.mutedTextColor }}>
                    /100
                  </span>
                </div>
                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{ backgroundColor: environment.borderColor }}
                >
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${currentUser.health_score}%`,
                      backgroundColor: environment.primaryColor,
                    }}
                  />
                </div>
                <p className="text-xs mt-2 font-semibold" style={{ color: environment.mutedTextColor }}>
                  Powered by {environment.name}
                </p>
              </div>
            )}
          </SidebarContent>

          <div className="border-t p-4" style={{ borderColor: environment.borderColor }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center border-2"
                style={{
                  backgroundColor: isDark ? "#333" : environment.surfaceColor,
                  borderColor: environment.primaryColor,
                }}
              >
                <span
                  className="font-bold text-sm"
                  style={{ color: environment.primaryColor }}
                >
                  {currentUser?.full_name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: environment.sidebarText }}>
                  {currentUser?.full_name || "User"}
                </p>
                <p className="text-xs truncate" style={{ color: environment.mutedTextColor }}>
                  {currentUser?.email}
                </p>
              </div>
              <Link to={createPageUrl("Profile")}>
                <Settings
                  className="w-5 h-5 transition-colors"
                  style={{ color: environment.mutedTextColor }}
                />
              </Link>
              <button
                type="button"
                onClick={() => void logoutMutation.mutateAsync()}
                className="hover:opacity-80 transition-opacity"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-5 h-5" style={{ color: environment.mutedTextColor }} />
              </button>
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header
            className="border-b px-6 py-3 sticky top-0 z-10 flex items-center justify-between"
            style={{
              backgroundColor: environment.sidebarBg,
              borderColor: environment.borderColor,
            }}
          >
            <div className="flex items-center gap-3">
              <SidebarTrigger
                className="hover:opacity-70 p-2 rounded-lg transition-opacity md:hidden"
                style={{ color: environment.sidebarText }}
              />
              <div
                className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  borderColor: environment.primaryColor,
                  color: environment.primaryColor,
                  backgroundColor: "transparent",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: environment.primaryColor }}
                />
                {environment.name}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <GymSwitcher />
            </div>
          </header>

          <div
            className="flex-1 overflow-auto pb-20"
            style={{ backgroundColor: environment.backgroundColor }}
          >
            {children}
          </div>
        </main>
      </div>

      <AIAssistantBar />
    </SidebarProvider>
  );
}
