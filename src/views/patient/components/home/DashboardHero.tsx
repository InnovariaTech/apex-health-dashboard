// @ts-nocheck
import React, { useMemo } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { motion } from "framer-motion";
import {
  Sparkles,
  Sun,
  Sunrise,
  Moon,
  Activity,
  ClipboardList,
  Brain,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { useProfile } from "@/hooks/care-validate/useProfile";
import { usePatientData } from "@/hooks/patients/usePatientData";
import { useCases } from "@/hooks/care-validate/useCases";
import { useAllPatientSummaries } from "@/hooks/ai-agent/useaiSummary";

interface Greeting {
  label: string;
  Icon: typeof Sun;
}

function getGreeting(now: Date): Greeting {
  const hour = now.getHours();
  if (hour < 5) return { label: "Good evening", Icon: Moon };
  if (hour < 12) return { label: "Good morning", Icon: Sunrise };
  if (hour < 17) return { label: "Good afternoon", Icon: Sun };
  return { label: "Good evening", Icon: Moon };
}

function deriveFirstName(profile: unknown, authUser: unknown): string {
  const p = (profile ?? {}) as Record<string, unknown>;
  const u = (authUser ?? {}) as Record<string, unknown>;

  const fromProfile = String(p.firstName ?? "").trim();
  if (fromProfile) return fromProfile;

  const fullName = String(p.full_name ?? p.fullName ?? p.name ?? u.full_name ?? "").trim();
  if (fullName) {
    const [first] = fullName.split(/\s+/);
    if (first) return first;
  }

  const email = String(u.email ?? p.email ?? "").trim();
  if (email.includes("@")) {
    const local = email.split("@")[0] ?? "";
    const segment = local.split(/[._+-]/)[0] ?? local;
    if (segment) return segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  return "there";
}

interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof Activity;
  color: string;
  loading?: boolean;
}

function StatTile({ label, value, hint, icon: Icon, color, loading }: StatTileProps) {
  return (
    <Card
      className="border shadow-sm hover:shadow-md transition-shadow"
      style={{ borderColor: `${color}33` }}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-6 w-16 mt-1" />
          ) : (
            <p className="text-xl font-bold text-foreground leading-tight truncate">
              {value}
            </p>
          )}
          {hint && !loading && (
            <p className="text-[11px] text-muted-foreground font-medium truncate">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardHero() {
  const { environment } = useEnvironment();
  const accent = environment.primaryColor;
  const profileQuery = useProfile();
  const authQuery = usePatientData();
  const casesQuery = useCases({ recordsPerPage: 100 });
  const summariesQuery = useAllPatientSummaries();

  const now = useMemo(() => new Date(), []);
  const greeting = getGreeting(now);
  const firstName = deriveFirstName(profileQuery.data, authQuery.data);

  const cases = casesQuery.data ?? [];
  const activeCases = useMemo(
    () =>
      cases.filter((c: { status?: string; raw?: { closedAt?: string | null } }) => {
        const status = String(c?.status ?? "").toUpperCase();
        const closed = c?.raw?.closedAt;
        return !closed && status !== "CLOSED" && status !== "ARCHIVED";
      }).length,
    [cases]
  );

  const summaries = summariesQuery.data?.items ?? [];
  const latestSummary = useMemo(() => {
    if (!summaries.length) return null;
    return [...summaries].sort(
      (a: { createdAt: string }, b: { createdAt: string }) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [summaries]);

  const latestScore =
    typeof latestSummary?.healthScore === "number"
      ? Math.round(latestSummary.healthScore)
      : null;
  const latestScoreHint = latestSummary?.createdAt
    ? `Updated ${formatDistanceToNowStrict(new Date(latestSummary.createdAt), {
        addSuffix: true,
      })}`
    : "Run your first scan";

  const isNameLoading = profileQuery.isLoading || authQuery.isLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mb-6"
    >
      <Card
        className="border-2 shadow-sm overflow-hidden relative"
        style={{
          borderColor: `${accent}30`,
          background: `linear-gradient(135deg, ${accent}14 0%, transparent 55%)`,
        }}
      >
        <div
          className="absolute inset-y-0 right-0 w-1/2 pointer-events-none opacity-40"
          style={{
            background: `radial-gradient(circle at 80% 30%, ${accent}26 0%, transparent 60%)`,
          }}
        />
        <CardContent className="relative p-6 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 border"
                style={{
                  borderColor: `${accent}66`,
                  color: accent,
                  backgroundColor: `${accent}14`,
                }}
              >
                <greeting.Icon className="w-3.5 h-3.5" />
                {greeting.label}
              </div>
              {isNameLoading ? (
                <Skeleton className="h-9 w-72 mb-2" />
              ) : (
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-1">
                  Welcome back, <span style={{ color: accent }}>{firstName}</span>
                </h1>
              )}
              <p className="text-sm text-muted-foreground font-medium">
                {format(now, "EEEE, MMMM d, yyyy")}
              </p>
            </div>

            <div
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{
                borderColor: `${accent}40`,
                backgroundColor: `${accent}0a`,
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: accent }} />
              <span className="text-xs font-mono font-semibold" style={{ color: accent }}>
                {latestSummary
                  ? "Insights ready below"
                  : "Run your first AI health scan"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatTile
              label="Health Score"
              value={latestScore !== null ? `${latestScore}` : "—"}
              hint={latestScoreHint}
              icon={Activity}
              color={accent}
              loading={summariesQuery.isLoading}
            />
            <StatTile
              label="Active Cases"
              value={activeCases}
              hint={
                cases.length === 0
                  ? "No cases yet"
                  : `${cases.length} total`
              }
              icon={ClipboardList}
              color="#8b5cf6"
              loading={casesQuery.isLoading}
            />
            <StatTile
              label="AI Analyses"
              value={summaries.length}
              hint={
                summaries.length === 0
                  ? "Tap analyse to start"
                  : summaries.length === 1
                  ? "1 scan completed"
                  : `${summaries.length} scans completed`
              }
              icon={Brain}
              color="#10b981"
              loading={summariesQuery.isLoading}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
