// @ts-nocheck
import React, { useMemo } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { motion } from "framer-motion";
import { Sun, Sunrise, Moon, Activity, ClipboardList, Brain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  accent?: boolean;
  loading?: boolean;
}

function StatTile({ label, value, hint, icon: Icon, accent, loading }: StatTileProps) {
  return (
    <div className="apex-card relative overflow-hidden px-5 py-[18px]">
      <div
        className="absolute top-0 left-0 h-0.5 w-2/5"
        style={{ background: accent ? "var(--apex-accent)" : "var(--opt)" }}
      />
      <div className="flex items-center justify-between mb-2.5">
        <span className="apex-eyebrow">{label}</span>
        <Icon className="w-3.5 h-3.5 text-ink-3" />
      </div>
      {loading ? (
        <Skeleton className="h-9 w-20" />
      ) : (
        <div className="text-[34px] font-mono font-medium leading-none tracking-[-0.035em] text-foreground">
          {value}
        </div>
      )}
      {hint && !loading && (
        <p className="text-xs text-muted-foreground mt-2">{hint}</p>
      )}
    </div>
  );
}

export default function DashboardHero() {
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
      {/* Page head — date eyebrow, editorial title, live sync strip */}
      <div className="pb-5 mb-5 border-b border-border">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="apex-pulse-dot" />
              <span className="apex-eyebrow">
                {format(now, "EEEE · MMM d, yyyy").toUpperCase()}
              </span>
            </div>
            {isNameLoading ? (
              <Skeleton className="h-11 w-80" />
            ) : (
              <h1 className="apex-page-title">
                {greeting.label}, <em>{firstName}</em>
              </h1>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-full border border-border bg-card text-[11px] text-ink-2 font-mono">
            <span className="apex-pulse-dot" style={{ width: 7, height: 7 }} />
            <span>
              {latestSummary
                ? "AI insights ready below"
                : "Run your first AI health scan"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile
          label="Health Score"
          value={latestScore !== null ? `${latestScore}` : "—"}
          hint={latestScoreHint}
          icon={Activity}
          accent
          loading={summariesQuery.isLoading}
        />
        <StatTile
          label="Active Cases"
          value={activeCases}
          hint={cases.length === 0 ? "No cases yet" : `${cases.length} total`}
          icon={ClipboardList}
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
          loading={summariesQuery.isLoading}
        />
      </div>
    </motion.div>
  );
}
