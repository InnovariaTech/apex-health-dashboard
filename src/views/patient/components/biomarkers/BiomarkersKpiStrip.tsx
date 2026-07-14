import { ArrowDown, ArrowUp, Calendar } from "lucide-react";
import { useAllPatientSummaries } from "@/hooks/ai-agent/useaiSummary";
import type { BiomarkerCategoryMap } from "@/types/biomarkers/biomarkers_types";
import { deriveTotals } from "@/views/patient/utils/biomarkerHelpers";

/**
 * KPI strip matching the New Ui mockup. Phase 1 ships three cards:
 *
 *   - Biological age (from the latest AI report's structured `biologicalAge`)
 *   - In optimal range (derived from biomarker statuses)
 *   - Improving (count of markers whose latest move is into / within range)
 *
 * The mockup also has a Longevity score card. Backend doesn't ship that
 * field today, so we hide the card per the phase-1 decision rather than
 * render a placeholder.
 *
 * Spec sources (`New Ui/3 Biomarkers/.../css/styles.css` `.kpi-*` block):
 *   .kpi: padding 18 20, radius var(--radius-lg), top accent rule 2px / 40% w
 *   .kpi-lbl: 11px / 600 / 0.08em / ink-3
 *   .kpi-val: mono tabular 36px / 600 / -0.035em
 *   .kpi-val .unit: 14px / ink-3
 *   .kpi-sub: 12px / ink-2
 */
export default function BiomarkersKpiStrip({
  data,
}: {
  data: BiomarkerCategoryMap | undefined;
}) {
  const summariesQuery = useAllPatientSummaries();
  const bioAge = summariesQuery.data?.items?.find((s) => s.report)?.report
    ?.biologicalAge;
  const bioAgeAvailable = bioAge?.available === true;

  const totals = deriveTotals(data);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-[22px]">
      {/* Biological age */}
      <KpiCard
        ruleTone="opt"
        label="Biological age"
        value={
          bioAgeAvailable && typeof bioAge?.biologicalYears === "number"
            ? formatYears(bioAge.biologicalYears)
            : "—"
        }
        unit={bioAgeAvailable ? "yr" : undefined}
        sub={
          bioAgeAvailable &&
          typeof bioAge?.deltaYears === "number" &&
          bioAge.deltaYears !== 0 ? (
            <>
              {bioAge.deltaYears < 0 ? (
                <ArrowDown
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--opt)" }}
                  strokeWidth={2.4}
                />
              ) : (
                <ArrowUp
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--bord)" }}
                  strokeWidth={2.4}
                />
              )}
              {Math.abs(bioAge.deltaYears).toFixed(1)}{" "}
              {bioAge.deltaYears < 0 ? "below" : "above"} chronological
            </>
          ) : bioAgeAvailable ? (
            "matches chronological"
          ) : (
            "Run analysis to compute"
          )
        }
      />

      {/* In optimal range */}
      <KpiCard
        ruleTone={totals.borderline + totals.attention > 0 ? "bord" : "opt"}
        label="In optimal range"
        value={String(totals.optimal)}
        unit={`/ ${totals.tracked}`}
        sub={
          totals.tracked === 0 ? (
            "No tracked markers yet"
          ) : (
            <>
              {totals.borderline > 0 ? `${totals.borderline} borderline` : null}
              {totals.borderline > 0 && totals.attention > 0 ? " · " : null}
              {totals.attention > 0 ? `${totals.attention} attention` : null}
              {totals.borderline === 0 && totals.attention === 0
                ? "All markers in range"
                : null}
            </>
          )
        }
      />

      {/* Improving */}
      <KpiCard
        ruleTone="opt"
        label="Improving"
        value={String(totals.improving)}
        unit="markers"
        sub={
          totals.improving > 0 ? (
            <>
              <Calendar
                className="w-3.5 h-3.5"
                style={{ color: "var(--ink-3)" }}
                strokeWidth={1.8}
              />
              Since last panel
            </>
          ) : (
            "No improving movement"
          )
        }
      />
    </div>
  );
}

interface KpiCardProps {
  ruleTone: "opt" | "bord" | "att";
  label: string;
  value: string;
  unit?: string | undefined;
  sub: React.ReactNode;
}

function KpiCard({ ruleTone, label, value, unit, sub }: KpiCardProps) {
  return (
    <div
      className="apex-card relative overflow-hidden"
      style={{ padding: "18px 20px" }}
    >
      <div
        className="absolute top-0 left-0 h-[2px] w-2/5"
        style={{ background: `var(--${ruleTone})` }}
      />
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          color: "var(--ink-3)",
          letterSpacing: "0.08em",
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        className="font-mono tabular-nums"
        style={{
          fontSize: 36,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: "-0.035em",
          color: "var(--ink)",
        }}
      >
        {value}
        {unit && (
          <span
            className="font-sans"
            style={{
              fontSize: 14,
              color: "var(--ink-3)",
              marginLeft: 4,
              fontWeight: 400,
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <div
          className="flex items-center gap-1.5 mt-2"
          style={{ fontSize: 12, color: "var(--ink-2)" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function formatYears(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
