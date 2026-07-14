import { AlertTriangle, ArrowRight, Lightbulb, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAllPatientSummaries } from "@/hooks/ai-agent/useaiSummary";
import { createPageUrl } from "@/utils";

/**
 * "Patterns & insights" card matching the mockup's `.insights` block.
 *
 * Pulls from `report.narrative.trends.{positive, monitor}` — the AI report
 * already produces these strings as part of every analysis. We render up
 * to one positive + one monitor row + a static "info" row as the third
 * (the mockup has 3 rows; the third is a passive observation rather than
 * a trend).
 *
 * Spec sources (`New Ui/3 Biomarkers/.../css/styles.css`):
 *   .insights-title: serif 22 / 600 / -0.015em
 *   .ins-row: padding 18 0, gap 16
 *   .ins-ic: 36x36 round, soft tone bg
 *   .ins-tx: 13.5 / 1.6 / ink
 *   .ins-lbl: 600 bolded lede
 */
export default function BiomarkersInsights() {
  const summariesQuery = useAllPatientSummaries();
  const navigate = useNavigate();
  const trends = summariesQuery.data?.items?.find((s) => s.report)?.report
    ?.narrative?.trends;

  const positive = trends?.positive ?? [];
  const monitor = trends?.monitor ?? [];

  if (positive.length === 0 && monitor.length === 0) return null;

  // Jump to the Health Analysis narrative report — that's where the AI
  // strings being summarised here actually live. The id matches the
  // `<div id="narrative-report" />` anchor on `NarrativeReportCard`.
  const onOpenReport = () => {
    navigate(`${createPageUrl("HealthAnalysis")}#narrative-report`);
  };

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-3.5 px-1">
        <h2
          className="m-0 font-sans"
          style={{
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "-0.015em",
          }}
        >
          Patterns &amp; insights
        </h2>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
          Generated from your last AI analysis
        </span>
      </div>

      <div
        className="apex-card"
        style={{ padding: "0 22px" }}
      >
        {positive[0] && (
          <InsightRow
            tone="good"
            icon={<TrendingDown className="w-4 h-4" strokeWidth={2} />}
            lede={extractLede(positive[0])}
            body={extractBody(positive[0])}
            onOpenReport={onOpenReport}
          />
        )}
        {monitor[0] && (
          <InsightRow
            tone="alert"
            icon={<AlertTriangle className="w-4 h-4" strokeWidth={2} />}
            lede={extractLede(monitor[0])}
            body={extractBody(monitor[0])}
            onOpenReport={onOpenReport}
          />
        )}
        {positive[1] && (
          <InsightRow
            tone="info"
            icon={<Lightbulb className="w-4 h-4" strokeWidth={2} />}
            lede={extractLede(positive[1])}
            body={extractBody(positive[1])}
            onOpenReport={onOpenReport}
          />
        )}
      </div>
    </div>
  );
}

function InsightRow({
  tone,
  icon,
  lede,
  body,
  onOpenReport,
}: {
  tone: "good" | "warn" | "alert" | "info";
  icon: React.ReactNode;
  lede: string;
  body: string;
  onOpenReport: () => void;
}) {
  const palette: Record<typeof tone, { bg: string; color: string }> = {
    good: { bg: "var(--opt-soft)", color: "var(--opt)" },
    warn: { bg: "var(--bord-soft)", color: "var(--bord)" },
    alert: { bg: "var(--att-soft)", color: "var(--att)" },
    info: { bg: "var(--apex-accent-soft)", color: "var(--apex-accent-bright)" },
  };
  const p = palette[tone];

  return (
    <div
      className="flex items-start gap-4 border-b border-[var(--line)] last:border-b-0"
      style={{ padding: "18px 0" }}
    >
      <span
        className="rounded-full shrink-0 grid place-items-center"
        style={{ width: 36, height: 36, background: p.bg, color: p.color }}
      >
        {icon}
      </span>
      <div
        className="flex-1"
        style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink)" }}
      >
        <span style={{ fontWeight: 600, marginRight: 4 }}>{lede}</span>
        {body && <span>{body}</span>}
      </div>
      <button
        type="button"
        onClick={onOpenReport}
        className="inline-flex items-center gap-1 self-center shrink-0 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        style={{
          fontSize: 12,
          color: "var(--apex-accent-bright)",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        Open report
        <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
      </button>
    </div>
  );
}

/**
 * Split the AI trend string into a bolded lede (first clause up to the
 * first period or em-dash) and a body (the rest). Backend trend strings
 * follow this rhythm: "ALT trending up across three panels. Liver enzymes
 * have moved…" — we want to bold the first sentence.
 */
function extractLede(line: string): string {
  const trimmed = line.trim();
  const m = trimmed.match(/^(.*?[.!?——-])\s/);
  return m ? m[1]!.trim() : trimmed;
}
function extractBody(line: string): string {
  const trimmed = line.trim();
  const m = trimmed.match(/^.*?[.!?——-]\s(.*)$/);
  return m ? m[1]!.trim() : "";
}
