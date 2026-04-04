import React, { createContext, useContext, useState, useEffect } from "react";
import { defaultEnvironment, getEnvironmentById } from "./environments";
import { hexToHsl, isLightColor } from "./colorUtils";

const EnvironmentContext = createContext(null);
const SESSION_KEY = "apex_portal_env";

/**
 * Apply the environment's color tokens to both:
 * 1. Custom --env-* variables (used by Layout, AIBar, etc.)
 * 2. shadcn's standard CSS variables (--background, --primary, --card, --border, etc.)
 *    so ALL shadcn components (Button, Card, Input, Badge, etc.) automatically re-theme.
 */
function applyEnvironmentTokens(env) {
  const root = document.documentElement;
  const light = env.themeMode === "light";

  // ── Custom env vars (used in Layout, AI bar, GymSwitcher) ─────────────────
  root.style.setProperty("--env-primary",      env.primaryColor);
  root.style.setProperty("--env-secondary",    env.secondaryColor);
  root.style.setProperty("--env-accent",       env.accentColor);
  root.style.setProperty("--env-bg",           env.backgroundColor);
  root.style.setProperty("--env-surface",      env.surfaceColor);
  root.style.setProperty("--env-text",         env.textColor);
  root.style.setProperty("--env-muted",        env.mutedTextColor);
  root.style.setProperty("--env-border",       env.borderColor);
  root.style.setProperty("--env-sidebar-bg",   env.sidebarBg);
  root.style.setProperty("--env-sidebar-text", env.sidebarText);

  // ── shadcn CSS variable overrides (HSL format) ────────────────────────────
  const primaryHsl      = hexToHsl(env.primaryColor);
  const bgHsl           = hexToHsl(env.backgroundColor);
  const surfaceHsl      = hexToHsl(env.surfaceColor);
  const borderHsl       = hexToHsl(env.borderColor);
  const textHsl         = hexToHsl(env.textColor);
  const mutedHsl        = hexToHsl(env.mutedTextColor);
  const accentHsl       = hexToHsl(env.accentColor);
  const secondaryHsl    = hexToHsl(env.secondaryColor);
  const sidebarBgHsl    = hexToHsl(env.sidebarBg);

  // Foreground on primary (button text, badge text on primary bg)
  const primaryFg = isLightColor(env.primaryColor) ? "0 0% 5%" : "0 0% 98%";
  // Foreground on background
  const fgHsl = textHsl;
  // Muted backgrounds
  const mutedBgHsl = light
    ? hexToHsl(env.surfaceColor)
    : hexToHsl(env.backgroundColor);

  root.style.setProperty("--background",             bgHsl);
  root.style.setProperty("--foreground",             fgHsl);
  root.style.setProperty("--card",                   surfaceHsl);
  root.style.setProperty("--card-foreground",        fgHsl);
  root.style.setProperty("--popover",                surfaceHsl);
  root.style.setProperty("--popover-foreground",     fgHsl);
  root.style.setProperty("--primary",                primaryHsl);
  root.style.setProperty("--primary-foreground",     primaryFg);
  root.style.setProperty("--secondary",              mutedBgHsl);
  root.style.setProperty("--secondary-foreground",   fgHsl);
  root.style.setProperty("--muted",                  mutedBgHsl);
  root.style.setProperty("--muted-foreground",       mutedHsl);
  root.style.setProperty("--accent",                 accentHsl);
  root.style.setProperty("--accent-foreground",      isLightColor(env.accentColor) ? "0 0% 5%" : "0 0% 98%");
  root.style.setProperty("--border",                 borderHsl);
  root.style.setProperty("--input",                  borderHsl);
  root.style.setProperty("--ring",                   primaryHsl);

  // Sidebar tokens used by shadcn sidebar component
  root.style.setProperty("--sidebar-background",              sidebarBgHsl);
  root.style.setProperty("--sidebar-foreground",              hexToHsl(env.sidebarText));
  root.style.setProperty("--sidebar-primary",                 primaryHsl);
  root.style.setProperty("--sidebar-primary-foreground",      primaryFg);
  root.style.setProperty("--sidebar-accent",                  hexToHsl(env.sidebarBg));
  root.style.setProperty("--sidebar-accent-foreground",       hexToHsl(env.sidebarText));
  root.style.setProperty("--sidebar-border",                  borderHsl);
  root.style.setProperty("--sidebar-ring",                    primaryHsl);
}

export function EnvironmentProvider({ children }) {
  const [environment, setEnvironmentState] = useState(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? getEnvironmentById(saved) : defaultEnvironment;
  });

  // Apply tokens on mount and whenever env changes
  useEffect(() => {
    applyEnvironmentTokens(environment);
  }, [environment]);

  const setEnvironment = (envId) => {
    const env = getEnvironmentById(envId);
    setEnvironmentState(env);
    sessionStorage.setItem(SESSION_KEY, envId);
  };

  return (
    <EnvironmentContext.Provider value={{ environment, setEnvironment }}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const ctx = useContext(EnvironmentContext);
  if (!ctx) throw new Error("useEnvironment must be used within EnvironmentProvider");
  return ctx;
}