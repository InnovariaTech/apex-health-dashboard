// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Settings, Activity, LogOut, ChevronRight } from "lucide-react";
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
import AIAssistantBar from "@/components/global/AIAssistantBar";
import GymSwitcher from "@/components/env/GymSwitcher";
import { getPatientNavItems, getPatientNavGroups } from "@/views/patient/config/patientNavigation";

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
  const navGroups = getPatientNavGroups(isGymEnv);
  // The patient's name is intentionally not shown in the app chrome — the
  // sidebar identity uses a neutral label so no personal name is surfaced.
  const displayName = "Patient";
  const initials = displayName
    .split(/\s+/)
    .map((p) => p?.[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Brand name split — first word plain, remainder italic accent ("Apex MD").
  const [brandFirst, ...brandRest] = String(environment.name || "Apex").split(" ");
  const brandRemainder = brandRest.join(" ");

  // Active page label for the breadcrumb.
  const activeItem = navItems.find((item) => location.pathname === item.url);
  const pageLabel = activeItem?.title || "Overview";

  return (
    <SidebarProvider style={{ "--sidebar-width": "268px" } as React.CSSProperties}>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="px-4 pt-5 pb-2">
            <Link
              to={createPageUrl("Dashboard")}
              className="flex items-center px-2 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              aria-label="Apex MD home"
            >
              <img
                src="/images/apex-md-logo.png"
                alt="Apex MD"
                className="h-[32px] w-auto block"
              />
            </Link>
            {isGymEnv && (
              <p className="text-[10px] mt-1 px-2 text-muted-foreground tracking-wide">
                Powered by Apex MD
              </p>
            )}
          </SidebarHeader>

          <SidebarContent className="px-4">
            <SidebarGroup className="p-0">
              <div className="apex-eyebrow px-[11px] mt-[18px] mb-[9px]">Menu</div>
              <SidebarGroupContent>
                <SidebarMenu className="gap-[2px]">
                  {navGroups.md.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`h-auto rounded-[11px] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                            isActive
                              ? "bg-[var(--surface-3)] text-white hover:bg-[var(--surface-3)] hover:text-white"
                              : "text-[#33372F] hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          <Link
                            to={item.url}
                            className="flex items-center gap-3 px-[11px] py-[9px] leading-none"
                          >
                            <item.icon
                              className={`w-[19px] h-[19px] shrink-0 transition-colors duration-150 ${
                                isActive ? "text-white" : "text-[#8A908A] group-hover/menu-item:text-[#5A615A]"
                              }`}
                              strokeWidth={1.8}
                            />
                            <span className="text-[14.5px] font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {navGroups.fit.length > 0 && (
              <SidebarGroup className="p-0">
                <div className="mx-[11px] mt-[22px] mb-[14px] border-t border-border" />
                <SidebarGroupContent>
                  <SidebarMenu className="gap-[2px]">
                    {navGroups.fit.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`h-auto rounded-[11px] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                              isActive
                                ? "bg-[var(--surface-3)] text-white hover:bg-[var(--surface-3)] hover:text-white"
                                : "text-[#33372F] hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            <Link
                              to={item.url}
                              className="flex items-center gap-3 px-[11px] py-[9px] leading-none"
                            >
                              <item.icon
                                className={`w-[19px] h-[19px] shrink-0 transition-colors duration-150 ${
                                  isActive ? "text-white" : "text-[#8A908A] group-hover/menu-item:text-[#5A615A]"
                                }`}
                                strokeWidth={1.8}
                              />
                              <span className="text-[14.5px] font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {currentUser?.health_score != null && (
              <div className="mt-5 apex-card p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="apex-eyebrow">Health Score</span>
                  <Activity className="w-3.5 h-3.5" style={{ color: "var(--apex-accent)" }} />
                </div>
                <div className="flex items-baseline gap-1.5 mb-2.5">
                  <span className="text-3xl font-mono font-medium text-foreground tracking-[-0.03em]">
                    {Math.round(currentUser.health_score)}
                  </span>
                  <span className="text-sm font-mono text-muted-foreground">/100</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-secondary">
                  <div
                    className="h-full transition-all duration-500 rounded-full bg-primary"
                    style={{ width: `${currentUser.health_score}%` }}
                  />
                </div>
              </div>
            )}
          </SidebarContent>

          <div className="border-t border-border p-3.5 mx-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary text-primary-foreground grid place-items-center text-xs font-medium flex-shrink-0">
                <img
                  src="/images/patient-headshot.jpg"
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium leading-tight truncate text-foreground">
                  {displayName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {currentUser?.email}
                </p>
              </div>
              <Link to={createPageUrl("Profile")} aria-label="Settings" title="Settings">
                <Settings className="w-[18px] h-[18px] text-muted-foreground hover:text-foreground transition-colors" />
              </Link>
              <button
                type="button"
                onClick={() => void logoutMutation.mutateAsync()}
                className="hover:text-foreground transition-colors text-muted-foreground"
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border bg-card px-6 py-3 sticky top-0 z-10 flex items-center gap-4">
            <SidebarTrigger
              className="hover:opacity-70 p-2 rounded-lg transition-opacity md:hidden text-foreground"
            />
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>{environment.name}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">{pageLabel}</span>
            </div>

            <div className="flex-1" />

            <Link
              to={createPageUrl("Profile")}
              className="w-[34px] h-[34px] rounded-[8px] border border-border bg-card grid place-items-center text-muted-foreground hover:bg-secondary transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <div className="hidden">
              <GymSwitcher />
            </div>
          </header>

          <div className="flex-1 overflow-auto pb-20 bg-background">
            {children}
          </div>
        </main>
      </div>

      <AIAssistantBar />
    </SidebarProvider>
  );
}
