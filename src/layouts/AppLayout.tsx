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

/**
 * One menu row, sized like the design's sidebar (.nav a / .nav a.on). Rendered as a plain link
 * rather than SidebarMenuButton, whose own padding/height/text utilities would override these.
 */
function RailItem({ item, active }) {
  return (
    <SidebarMenuItem>
      <Link
        to={item.url}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-[13px] rounded-[10px] px-[11px] py-[10px] text-[15px] leading-[16px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--rail-active-text)] ${
          active ? "font-medium" : "font-normal"
        }`}
        style={{
          background: active ? "var(--rail-active-bg)" : undefined,
          color: active ? "var(--rail-active-text)" : "var(--rail-text)",
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = "var(--rail-active-bg)";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = "";
        }}
      >
        <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.7} />
        <span className="truncate">{item.title}</span>
      </Link>
    </SidebarMenuItem>
  );
}

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
        <Sidebar className="apex-rail">
          <SidebarHeader className="px-4 pt-[18px] pb-1">
            <Link
              to={createPageUrl("Dashboard")}
              className="flex min-h-[40px] items-center px-[11px] pt-0.5 pb-1 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Apex MD home"
            >
              <img
                src={isGymEnv ? "/images/apex-md-logo.png" : "/images/apexmd-side-white.png"}
                alt="Apex MD"
                className="h-[34px] w-auto block"
              />
            </Link>
            {isGymEnv && (
              <p className="px-[11px] text-[10.5px]" style={{ color: "var(--rail-label)" }}>
                Powered by Apex MD
              </p>
            )}
          </SidebarHeader>

          <SidebarContent className="px-4">
            <SidebarGroup className="p-0">
              <div className="apex-rail-label px-[11px] mt-[26px] mb-[8px]">Menu</div>
              <SidebarGroupContent>
                <SidebarMenu className="gap-[2px]">
                  {navGroups.md.map((item) => (
                    <RailItem key={item.title} item={item} active={location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {navGroups.fit.length > 0 && (
              <SidebarGroup className="p-0">
                <div className="apex-rail-line mx-[11px] mt-[16px] mb-[10px] border-t" />
                <SidebarGroupContent>
                  <SidebarMenu className="gap-[2px]">
                    {navGroups.fit.map((item) => (
                      <RailItem key={item.title} item={item} active={location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {currentUser?.health_score != null && (
              <div className="mt-5 rounded-[14px] p-4" style={{ background: "var(--rail-active-bg)" }}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="apex-rail-label">Health Score</span>
                  <Activity className="w-3.5 h-3.5" style={{ color: "var(--rail-active-text)" }} />
                </div>
                <div className="flex items-baseline gap-1.5 mb-2.5">
                  <span className="text-3xl font-extrabold tracking-[-0.03em]" style={{ color: "var(--rail-text)" }}>
                    {Math.round(currentUser.health_score)}
                  </span>
                  <span className="text-sm font-mono" style={{ color: "var(--rail-label)" }}>/100</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--rail-line)" }}>
                  <div
                    className="h-full transition-all duration-500 rounded-full bg-primary"
                    style={{ width: `${currentUser.health_score}%` }}
                  />
                </div>
              </div>
            )}
          </SidebarContent>

          <div className="apex-rail-line mx-4 mt-2.5 border-t px-1.5 pt-3.5 pb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-[34px] h-[34px] rounded-full overflow-hidden grid place-items-center text-[12.5px] font-semibold flex-shrink-0"
                style={{ background: "var(--rail-active-bg)", color: "var(--rail-active-text)" }}
              >
                <img src="/images/patient-headshot.jpg" alt={displayName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium leading-tight truncate" style={{ color: "var(--rail-active-text)" }}>
                  {displayName}
                </p>
                <p className="mt-0.5 text-[11.5px] truncate" style={{ color: "var(--rail-label)" }}>
                  {currentUser?.email}
                </p>
              </div>
              <Link
                to={createPageUrl("Profile")}
                aria-label="Settings"
                title="Settings"
                className="transition-opacity hover:opacity-80"
                style={{ color: "var(--rail-label)" }}
              >
                <Settings className="w-[17px] h-[17px]" strokeWidth={1.7} />
              </Link>
              <button
                type="button"
                onClick={() => void logoutMutation.mutateAsync()}
                className="transition-opacity hover:opacity-80"
                style={{ color: "var(--rail-label)" }}
                aria-label="Logout"
                title="Logout"
              >
                <LogOut className="w-[17px] h-[17px]" strokeWidth={1.7} />
              </button>
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-[52px] border-b border-border bg-background px-4 md:px-9 sticky top-0 z-10 flex items-center gap-3 text-[12px]">
            <SidebarTrigger className="hover:opacity-70 p-2 rounded-lg transition-opacity md:hidden text-foreground" />
            <div className="hidden sm:flex items-center gap-2.5" style={{ color: "var(--mute)" }}>
              <span>{environment.name}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">{pageLabel}</span>
            </div>

            <div className="flex-1" />

            <Link
              to={createPageUrl("Profile")}
              className="w-8 h-8 rounded-[8px] border border-border bg-card grid place-items-center text-ink-2 hover:border-[var(--mute)] transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-[17px] h-[17px]" strokeWidth={1.7} />
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
