import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAllPatientSummaries } from "@/hooks/ai-agent/useaiSummary";
import type { BiologicalAge } from "@/types/ai-agent/ai_summary_types";
import { createPageUrl } from "@/utils";
import { BodyModel3D } from "@/components/hologram";
import BioAgeScale from "@/views/patient/components/health-analysis/BioAgeScale";

/**
 * Dashboard hero — Biological age card.
 *
 * Reads `report.biologicalAge` from the latest summary. When the field is
 * available, shows the headline number + delta pill + scale row. When
 * unavailable, shows a structured empty state pointing at Health Analysis.
 */
export default function BioAgeCard() {
  const summariesQuery = useAllPatientSummaries();

  const bioAge = useMemo<BiologicalAge | null>(() => {
    const items = summariesQuery.data?.items ?? [];
    return items.find((s) => s.report)?.report?.biologicalAge ?? null;
  }, [summariesQuery.data]);

  const hasAnalysis = (summariesQuery.data?.items?.length ?? 0) > 0;
  const available = bioAge?.available === true;

  return (
    <div className="apex-card p-6 lg:p-7 flex flex-col h-full">
      <div className="flex items-start justify-between gap-4">
        <h3 className="apex-card-title">Biological age</h3>
        {available && bioAge && typeof bioAge.deltaYears === "number" && bioAge.deltaYears !== 0 && (
          <span
            className="font-mono text-[12.5px] font-semibold inline-flex items-center gap-1.5"
            style={{
              color: bioAge.deltaYears < 0 ? "var(--opt-d)" : "var(--bord-d)",
            }}
          >
            {bioAge.deltaYears < 0 ? "↓" : "↑"}{" "}
            {Math.abs(bioAge.deltaYears).toFixed(1)} yrs
          </span>
        )}
      </div>

      <div className="h-px my-5 bg-[var(--line)]" />

      {available && bioAge ? (
        <div className="flex flex-col gap-5 h-full">
          <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[62px] font-extrabold tracking-[-0.03em] leading-[0.92] text-foreground">
                  {bioAge.biologicalYears !== null
                    ? formatYears(bioAge.biologicalYears)
                    : "—"}
                </span>
                <span className="text-[24px] font-semibold text-mute leading-none">
                  yrs
                </span>
              </div>
              {bioAge.deltaYears !== null && bioAge.deltaYears < 0 && (
                <div
                  className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full font-semibold text-[13px]"
                  style={{ background: "var(--opt-soft)", color: "var(--opt-d)" }}
                >
                  ↓ {Math.abs(bioAge.deltaYears).toFixed(1)} yrs younger
                </div>
              )}
              {bioAge.chronologicalYears !== null && (
                <p className="text-[13.5px] text-ink-2 mt-3">
                  vs chronological{" "}
                  <b className="text-foreground">{bioAge.chronologicalYears} yrs</b>
                </p>
              )}
            </div>
            <div
              className="relative w-[336px] h-[480px] shrink-0 -my-8"
              aria-hidden="true"
            >
              <BodyModel3D
                scanState="complete"
                color="#E11816"
                autoRotate
                autoRotateSpeed={1.2}
                className="absolute inset-0"
              />
            </div>
          </div>

          {/* Biological vs chronological scale — same graph as Health Analysis */}
          {bioAge.biologicalYears !== null &&
            bioAge.chronologicalYears !== null && (
              <BioAgeScale
                bio={bioAge.biologicalYears}
                chrono={bioAge.chronologicalYears}
              />
            )}

          <div className="mt-auto pt-3 border-t border-[var(--line)] flex items-baseline justify-between gap-2 flex-wrap">
            {bioAge.history.length > 1 ? (
              <span className="font-mono text-[12.5px] text-ink-2">
                {bioAge.history.map((h, i) => (
                  <span key={i}>
                    {h.biologicalYears.toFixed(1)}
                    {i < bioAge.history.length - 1 ? " → " : ""}
                  </span>
                ))}
              </span>
            ) : (
              <span />
            )}
            <span className="font-mono text-[11px] text-mute uppercase tracking-[.08em]">
              {bioAge.method ?? "PhenoAge"}
              {typeof bioAge.biomarkerCount === "number"
                ? ` · ${bioAge.biomarkerCount} biomarkers`
                : ""}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <div
            className="w-14 h-14 rounded-full grid place-items-center mb-4"
            style={{ background: "var(--opt-soft)", color: "var(--opt-d)" }}
          >
            <Sparkles className="w-6 h-6" strokeWidth={1.8} />
          </div>
          <p className="text-[15px] font-semibold text-foreground">
            {hasAnalysis ? "Bio age not yet calibrated" : "No AI analysis yet"}
          </p>
          <p className="text-[13.5px] text-ink-2 mt-2 max-w-[42ch]">
            {bioAge?.reason ??
              (hasAnalysis
                ? "Once your panel includes the longevity biomarkers (Lp(a), ApoB, HbA1c, hsCRP and others), your biological age will appear here."
                : "Run your first AI Health Analysis to compute your biological age across kidney, liver, lipid, and inflammation markers.")}
          </p>
          <Link
            to={createPageUrl("HealthAnalysis")}
            className="mt-5 inline-flex items-center gap-1.5 font-semibold text-[13.5px]"
            style={{ color: "var(--apex-accent-bright)" }}
          >
            {hasAnalysis ? "Review latest analysis" : "Run AI Health Analysis"}
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
          </Link>
        </div>
      )}
    </div>
  );
}

function formatYears(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
