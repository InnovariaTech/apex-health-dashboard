import { useMemo } from "react";
import { format } from "date-fns";
import { ArrowDown, ArrowRight, ArrowUp, Clock, Database } from "lucide-react";
import { useAllPatientSummaries } from "@/hooks/ai-agent/useaiSummary";
import type {
  PatientSummary,
  SeverityTone,
} from "@/types/ai-agent/ai_summary_types";

/**
 * Large score card matching the mockup's `.score-card-large` block.
 *
 * Spec sources (`New Ui/2 Health Analysis/.../css/styles.css`):
 *   - .score-card-large: padding 28px 32px (when in hero-grid)
 *   - .score-head .label: serif 24px / 700 / accent-dark
 *   - .donut-large: 192×192, num 64px/-0.04em
 *   - .score-row: 130px / 38px / 1fr; name 13.5/500, val 14.5/700 mono
 *   - .score-foot: 13px / ink-3
 *   - .biomarker-title: serif 14px / 700 / accent-dark
 *   - .biomarker-issue: padding 9px 12px, border-radius 6px
 */

const GAUGE_RADIUS = 84;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_RADIUS;

export default function AnalysisScoreCard() {
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
    score !== null ? GAUGE_CIRC * (1 - score / 100) : GAUGE_CIRC;

  const summaryExcerpt = useMemo(() => {
    const text = overall?.scoreExplanation?.trim();
    if (!text) return null;
    if (text.length <= 320) return text;
    return text.slice(0, 300).replace(/\s+\S*$/, "") + "…";
  }, [overall?.scoreExplanation]);

  return (
    <div
      className="apex-card relative overflow-hidden flex flex-col gap-4"
      style={{ padding: "28px 32px" }}
    >
      {/* Score head — title + delta with bottom rule */}
      <div className="flex items-baseline justify-between gap-3 pb-3.5 border-b border-[var(--line)]">
        <h3 className="apex-card-title">Overall health score</h3>
        {delta !== null && delta !== 0 ? (
          <DeltaPill delta={delta} priorDate={deltaVsDate} />
        ) : null}
      </div>

      {/* Body — donut + subsystem breakdown */}
      <div className="grid grid-cols-[192px_1fr] gap-[26px] items-center max-[760px]:grid-cols-1 max-[760px]:justify-items-center max-[760px]:gap-[18px]">
        <Gauge score={score} tone={tone} dashoffset={dashoffset} statusLabel={overall?.status} />

        <div className="w-full">
          {overall?.subsystemScores?.length ? (
            <div className="flex flex-col gap-2">
              <div
                className="flex items-baseline justify-between pb-1.5 mb-1 border-b border-[var(--line)]"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ink-3)",
                  fontWeight: 600,
                }}
              >
                <span>Subsystem breakdown</span>
                <span
                  style={{
                    color: "var(--ink-4)",
                    fontWeight: 400,
                    letterSpacing: "0.04em",
                  }}
                >
                  Score / 100
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {overall.subsystemScores.map((s) => (
                  <li
                    key={s.name}
                    className="grid grid-cols-[130px_38px_1fr] items-center gap-3.5"
                  >
                    <span className="text-[13.5px] font-medium text-foreground truncate">
                      {s.name}
                    </span>
                    <span
                      className="font-mono font-bold text-[14.5px] text-right tabular-nums"
                      style={{ color: toneInk(s.tone) }}
                    >
                      {s.score}
                    </span>
                    <div className="h-[7px] rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-[1100ms]"
                        style={{
                          width: `${clamp(s.score, 0, 100)}%`,
                          background: toneSolid(s.tone),
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[13px] text-ink-3">
              Subsystem breakdown will appear after your first analysis.
            </p>
          )}
        </div>
      </div>

      {/* Methodology footer */}
      <div
        className="flex justify-between items-center flex-wrap gap-2 pt-3 border-t border-[var(--line)]"
        style={{ fontSize: 13, color: "var(--ink-3)" }}
      >
        {overall?.meta && (
          <div className="inline-flex items-center gap-1.5">
            <Database
              style={{ width: 14, height: 14, color: "var(--ink-4)" }}
              strokeWidth={1.8}
            />
            Based on {overall.meta.biomarkerCount} biomarker
            {overall.meta.biomarkerCount === 1 ? "" : "s"}
            {overall.meta.analysisCount > 0
              ? ` · ${overall.meta.analysisCount} longitudinal analys${overall.meta.analysisCount === 1 ? "is" : "es"}`
              : ""}
          </div>
        )}
        {latest?.createdAt && (
          <div className="inline-flex items-center gap-1.5">
            <Clock
              style={{ width: 14, height: 14, color: "var(--ink-4)" }}
              strokeWidth={1.8}
            />
            {format(new Date(latest.createdAt), "MMM d, yyyy · h:mm a")}
            {overall?.methodologyVersion
              ? ` · Methodology v${overall.methodologyVersion}`
              : ""}
          </div>
        )}
      </div>

      {/* Biomarker status */}
      {overall?.biomarkerStatus && (
        <div className="pt-4 border-t border-[var(--line)]">
          <div className="flex items-baseline justify-between mb-3.5">
            <span
              className="font-sans"
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "-0.015em",
                color: "var(--apex-accent-dark)",
              }}
            >
              Biomarker status
            </span>
            <span className="text-[13.5px] text-ink-2">
              <b style={{ color: "var(--opt)", fontWeight: 700 }}>
                {overall.biomarkerStatus.optimalCount} of{" "}
                {overall.biomarkerStatus.totalCount}
              </b>{" "}
              in optimal range
            </span>
          </div>

          {overall.biomarkerStatus.issues.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {overall.biomarkerStatus.issues.slice(0, 6).map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="grid items-center gap-3.5 bg-card border border-[var(--line)] rounded-md"
                  style={{
                    padding: "9px 12px",
                    gridTemplateColumns:
                      "10px minmax(110px, 1fr) minmax(100px, auto) 1.6fr",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: toneSolid(f.severity) }}
                  />
                  <span className="text-[13.5px] font-bold text-ink tracking-[-0.005em] truncate">
                    {f.name}
                  </span>
                  <span className="font-mono text-[12.5px] font-semibold text-ink-2 tabular-nums whitespace-nowrap">
                    {f.value}
                    {f.unit ? ` ${f.unit}` : ""}
                  </span>
                  <span className="text-[13px] text-ink-2 tracking-[-0.005em] truncate">
                    {f.statusLabel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Analysis summary excerpt */}
      {summaryExcerpt && (
        <div className="pt-4 border-t border-[var(--line)]">
          <div className="flex items-center justify-between mb-3">
            <span className="apex-eyebrow">Analysis summary</span>
            {overall?.status && tone && (
              <StatusPill label={capitalize(overall.status)} tone={tone} />
            )}
          </div>
          <p className="text-[15px] text-ink-2 leading-[1.62]">{summaryExcerpt}</p>
          <a
            href="#narrative-report"
            className="mt-3 inline-flex items-center gap-1.5 font-semibold text-[13.5px]"
            style={{ color: "var(--apex-accent-bright)" }}
          >
            See full report
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.4} />
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Gauge ───────────────────────────────────────────────────────────────

function Gauge({
  score,
  tone,
  dashoffset,
  statusLabel,
}: {
  score: number | null;
  tone: SeverityTone | null;
  dashoffset: number;
  statusLabel: string | undefined;
}) {
  return (
    <div className="relative w-[192px] h-[192px] shrink-0">
      <svg
        viewBox="0 0 200 200"
        className="rotate-[-90deg] w-full h-full"
        aria-hidden
      >
        <circle
          cx="100"
          cy="100"
          r={GAUGE_RADIUS}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth="12"
        />
        {/* Threshold ticks at 50 / 70 / 85 */}
        <g stroke="var(--ink-4)" strokeWidth="1">
          <line x1="100" y1="190" x2="100" y2="198" />
          <line x1="20.05" y1="125.95" x2="12.43" y2="128.43" />
          <line x1="32.05" y1="50.61" x2="25.42" y2="46.78" />
        </g>
        {score !== null && (
          <circle
            cx="100"
            cy="100"
            r={GAUGE_RADIUS}
            fill="none"
            stroke={toneSolid(tone ?? "opt")}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={GAUGE_CIRC}
            strokeDashoffset={dashoffset}
            style={{
              transition: "stroke-dashoffset 1.3s cubic-bezier(.22,1,.36,1)",
            }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-[2px]">
        <div
          className="font-mono tabular-nums leading-none text-ink"
          style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em" }}
        >
          {score ?? "—"}
        </div>
        <div
          className="font-mono text-ink-3 mt-1"
          style={{ fontSize: 11, letterSpacing: "0.06em" }}
        >
          / 100
        </div>
        {statusLabel && tone && (
          <StatusPill label={capitalize(statusLabel)} tone={tone} compact />
        )}
      </div>
    </div>
  );
}

function StatusPill({
  label,
  tone,
  compact,
}: {
  label: string;
  tone: SeverityTone;
  compact?: boolean;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono uppercase"
      style={{
        background: toneSoft(tone),
        color: toneSolid(tone),
        padding: compact ? "3px 11px" : "6px 12px",
        borderRadius: 100,
        fontSize: compact ? 10 : 11.5,
        fontWeight: 600,
        letterSpacing: compact ? "0.14em" : "0.12em",
        marginTop: compact ? 8 : 0,
      }}
    >
      <span
        className="w-[5px] h-[5px] rounded-full"
        style={{ background: toneSolid(tone) }}
      />
      {label}
    </span>
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
      className="font-mono inline-flex items-center gap-1.5"
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: "0.02em",
        color: positive ? "var(--opt)" : "var(--bord)",
      }}
    >
      {positive ? (
        <ArrowUp className="w-3 h-3" strokeWidth={2.4} />
      ) : (
        <ArrowDown className="w-3 h-3" strokeWidth={2.4} />
      )}
      {positive ? "+" : ""}
      {delta}
      {priorDate && (
        <span style={{ color: "var(--ink-3)", fontWeight: 400, marginLeft: 4 }}>
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
      return "var(--att)";
  }
}
function toneSoft(tone: SeverityTone): string {
  switch (tone) {
    case "opt":
      return "var(--opt-soft)";
    case "bord":
      return "var(--bord-soft)";
    case "att":
      return "var(--att-soft)";
  }
}
function toneInk(tone: SeverityTone): string {
  switch (tone) {
    case "opt":
      return "var(--opt)";
    case "bord":
      return "var(--bord)";
    case "att":
      return "var(--att)";
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
