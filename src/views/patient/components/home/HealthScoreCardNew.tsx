import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowDown, ArrowRight, ArrowUp, Clock, Database } from "lucide-react";
import { useAllPatientSummaries } from "@/hooks/ai-agent/useaiSummary";
import type {
  PatientSummary,
  SeverityTone,
} from "@/types/ai-agent/ai_summary_types";
import { createPageUrl } from "@/utils";

/**
 * Dashboard hero — overall health score card. Reads `report.overallScore`
 * directly: subsystem breakdown, biomarker counts, flagged issues, and
 * delta vs prior analysis all come from the backend.
 */

const SCORE_RADIUS = 82;
const SCORE_CIRC = 2 * Math.PI * SCORE_RADIUS;

export default function HealthScoreCardNew() {
  const summariesQuery = useAllPatientSummaries();

  const latest: PatientSummary | null = useMemo(() => {
    const items = summariesQuery.data?.items ?? [];
    return items.find((s) => s.report) ?? items[0] ?? null;
  }, [summariesQuery.data]);

  const report = latest?.report;
  const overall = report?.overallScore;
  const score = overall?.score ?? null;
  const delta = overall?.delta ?? null;
  const deltaVsDate = overall?.deltaVsDate ?? null;
  const tone: SeverityTone | null = score !== null ? scoreTone(score) : null;
  const dashoffset =
    score !== null ? SCORE_CIRC * (1 - score / 100) : SCORE_CIRC;

  return (
    <div className="apex-card p-6 lg:p-7 flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <h3 className="apex-card-title">Overall health score</h3>
        {delta !== null && delta !== 0 ? (
          <DeltaPill delta={delta} priorDate={deltaVsDate} />
        ) : null}
      </div>

      <div className="h-px my-5 bg-[var(--line)]" />

      <div className="grid grid-cols-[auto_1fr] gap-8 items-center">
        <div className="relative w-[188px] h-[188px] shrink-0">
          <svg width="188" height="188" viewBox="0 0 188 188" className="rotate-[-90deg]">
            <circle
              cx="94"
              cy="94"
              r={SCORE_RADIUS}
              fill="none"
              stroke="var(--track)"
              strokeWidth="14"
            />
            {score !== null && (
              <circle
                cx="94"
                cy="94"
                r={SCORE_RADIUS}
                fill="none"
                stroke={toneSolid(tone ?? "opt")}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={SCORE_CIRC}
                strokeDashoffset={dashoffset}
                style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.22,1,.36,1)" }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-[58px] font-extrabold tracking-[-0.03em] leading-[0.9] text-foreground">
              {score ?? "—"}
            </div>
            <div className="font-mono text-[13px] text-mute mt-1">/ 100</div>
            {overall?.status && (
              <span
                className="inline-flex items-center gap-1.5 mt-2 font-mono text-[11px] font-semibold uppercase tracking-[.08em] px-2.5 py-1 rounded-full"
                style={{
                  background: toneSoft(tone ?? "opt"),
                  color: toneInk(tone ?? "opt"),
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: toneSolid(tone ?? "opt") }}
                />
                {capitalize(overall.status)}
              </span>
            )}
          </div>
        </div>

        <div className="w-full">
          {overall?.subsystemScores?.length ? (
            <>
              <div className="flex justify-between mb-3.5">
                <span className="apex-eyebrow">Subsystem breakdown</span>
                <span className="apex-eyebrow">Score / 100</span>
              </div>
              <ul className="flex flex-col gap-3">
                {overall.subsystemScores.map((s) => (
                  <li
                    key={s.name}
                    className="grid grid-cols-[118px_38px_1fr] items-center gap-3.5"
                  >
                    <span className="text-[14.5px] font-medium text-foreground truncate">
                      {s.name}
                    </span>
                    <span
                      className="font-mono font-semibold text-[15px] text-right"
                      style={{ color: toneInk(s.tone) }}
                    >
                      {s.score}
                    </span>
                    <div className="h-[7px] rounded-md bg-[var(--track)] overflow-hidden">
                      <div
                        className="h-full rounded-md transition-[width] duration-[1100ms]"
                        style={{
                          width: `${clamp(s.score, 0, 100)}%`,
                          background: toneSolid(s.tone),
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-[13px] text-ink-2">
              Subsystem breakdown will appear after your first analysis.
            </p>
          )}
        </div>
      </div>

      {/* Methodology footer */}
      <div className="flex flex-col gap-1.5 mt-5">
        {overall?.meta && (
          <div className="flex items-center gap-2 text-[13px] text-ink-2">
            <Database className="w-[15px] h-[15px] text-mute" strokeWidth={1.8} />
            Based on {overall.meta.biomarkerCount} biomarker
            {overall.meta.biomarkerCount === 1 ? "" : "s"}
            {overall.meta.analysisCount > 0
              ? ` · ${overall.meta.analysisCount} longitudinal analys${overall.meta.analysisCount === 1 ? "is" : "es"}`
              : ""}
          </div>
        )}
        {latest?.createdAt && (
          <div className="flex items-center gap-2 text-[13px] text-ink-2">
            <Clock className="w-[15px] h-[15px] text-mute" strokeWidth={1.8} />
            {format(new Date(latest.createdAt), "MMM d, yyyy · h:mm a")}
            {overall?.methodologyVersion
              ? ` · Methodology v${overall.methodologyVersion}`
              : ""}
          </div>
        )}
      </div>

      {/* Biomarker status */}
      {overall?.biomarkerStatus && (
        <>
          <div className="flex items-center justify-between mt-6 mb-3">
            <span className="text-[15px] font-bold text-foreground">
              Biomarker status
            </span>
            <span className="font-mono text-[13px] text-ink-2">
              <b style={{ color: "var(--opt-d)", fontWeight: 600 }}>
                {overall.biomarkerStatus.optimalCount} of{" "}
                {overall.biomarkerStatus.totalCount}
              </b>{" "}
              in optimal range
            </span>
          </div>

          {/* Biomarker issue tiles removed — keep only the "X of Y in optimal
              range" header. The full list lives on the Biomarkers page. */}
        </>
      )}

      <Link
        to={createPageUrl("HealthAnalysis")}
        className="mt-4 self-start inline-flex items-center gap-1.5 font-semibold text-[13.5px]"
        style={{ color: "var(--apex-accent-bright)" }}
      >
        See Full Health Analysis
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
      </Link>
    </div>
  );
}

function DeltaPill({
  delta,
  priorDate,
}: {
  delta: number;
  priorDate: string | null;
}) {
  const positive = delta > 0;
  return (
    <div
      className="font-mono text-[12.5px] font-semibold inline-flex items-center gap-1.5"
      style={{ color: positive ? "var(--opt-d)" : "var(--apex-accent)" }}
    >
      {positive ? (
        <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.4} />
      ) : (
        <ArrowDown className="w-3.5 h-3.5" strokeWidth={2.4} />
      )}
      {positive ? "+" : ""}
      {delta}
      {priorDate && (
        <span className="font-normal text-mute">
          vs {format(new Date(priorDate), "MMM d")}
        </span>
      )}
    </div>
  );
}

// ─── Tone palette ────────────────────────────────────────────────────────

function toneSolid(tone: SeverityTone): string {
  switch (tone) {
    case "opt":
      return "var(--opt)";
    case "bord":
      return "var(--bord)";
    case "att":
      return "var(--apex-accent)";
  }
}
function toneSoft(tone: SeverityTone): string {
  switch (tone) {
    case "opt":
      return "var(--opt-soft)";
    case "bord":
      return "var(--bord-soft)";
    case "att":
      return "var(--apex-accent-soft)";
  }
}
function toneInk(tone: SeverityTone): string {
  switch (tone) {
    case "opt":
      return "var(--opt-d)";
    case "bord":
      return "var(--bord-d)";
    case "att":
      return "var(--apex-accent-bright)";
  }
}

function scoreTone(s: number): SeverityTone {
  if (s >= 80) return "opt";
  if (s >= 60) return "bord";
  return "att";
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}
