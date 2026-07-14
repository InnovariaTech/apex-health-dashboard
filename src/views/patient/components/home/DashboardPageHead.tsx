import { format } from "date-fns";
import { useProfile } from "@/hooks/care-validate/useProfile";
import { useAllPatientSummaries } from "@/hooks/ai-agent/useaiSummary";

/** Shown in place of the patient's name in the identity chip. */
const IDENTITY_LABEL = "Patient";

/**
 * Editorial page head matching the New Ui Dashboard mockup —
 * Inter 800 title with italic-red emphasis, last-synced subtitle,
 * patient identity chip on the right.
 *
 * Last-sync timestamp comes from the most recent AI summary `createdAt`;
 * we fall back to "—" rather than `new Date()` so the chip doesn't lie
 * about freshness.
 */
export default function DashboardPageHead() {
  const profileQuery = useProfile();
  const summariesQuery = useAllPatientSummaries();

  const profile = (profileQuery.data ?? {}) as Record<string, unknown>;

  const latest = summariesQuery.data?.items?.[0];
  const lastSync = latest?.createdAt
    ? format(new Date(latest.createdAt), "MMM d, yyyy · h:mm a")
    : null;

  const age = pickStringField(profile, ["age", "patientAge"]);
  const planLabel = pickStringField(profile, ["plan", "subscriptionPlan", "tier"]);

  return (
    <div className="flex flex-wrap items-end justify-between gap-6 mb-7">
      <div className="min-w-0">
        <h1 className="apex-page-title">
          Health <em>Dashboard</em>
        </h1>
        <p className="text-[14.5px] text-ink-2 mt-1.5">
          Your longitudinal health profile
          {lastSync ? ` · last synced ${lastSync}` : " · no AI analysis yet"}
        </p>
      </div>

      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="w-9 h-9 rounded-[10px] overflow-hidden grid place-items-center font-semibold text-[13px]">
          <img
            src="/images/patient-headshot.jpg"
            alt={IDENTITY_LABEL}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-foreground leading-tight truncate max-w-[180px]">
            {IDENTITY_LABEL}
          </p>
          <p className="text-[11.5px] font-mono text-mute tracking-wide truncate max-w-[180px]">
            {[planLabel, age ? `${age} yrs` : null]
              .filter(Boolean)
              .join(" · ") || "Patient"}
          </p>
        </div>
      </div>
    </div>
  );
}

function pickStringField(
  obj: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}
