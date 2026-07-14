import { ArrowUpRight, Eye, TrendingUp } from "lucide-react";
import type { NarrativeTrends } from "@/types/ai-agent/ai_summary_types";

/**
 * "Recent trends" card matching the mockup's `.narr-section` + `.trend-grid`.
 *
 * Spec sources (`New Ui/2 Health Analysis/.../css/styles.css`):
 *   - .trend-grid: 1fr 1fr, gap 14
 *   - .trend-card: border 1 line, radius 10, padding 18/20, border-left 3 tone
 *   - .trend-head: mono 12.5 / 0.14em / weight 600 / tone color
 *   - .trend-list li: 16 / 1.5 / ink-2 with icon
 */
export default function TrendsCard({
  trends,
}: {
  trends: NarrativeTrends | null;
}) {
  const positive = trends?.positive ?? [];
  const monitor = trends?.monitor ?? [];

  if (positive.length === 0 && monitor.length === 0) return null;

  return (
    <div
      className="apex-card mb-[18px] overflow-hidden"
      style={{ padding: "6px 30px 30px" }}
    >
      <section style={{ padding: "26px 0" }}>
        <div className="flex items-center justify-between gap-3.5 mb-4">
          <h4
            className="font-sans m-0 inline-flex items-center gap-2.5"
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.015em",
              color: "var(--apex-accent-dark)",
            }}
          >
            <TrendingUp className="w-5 h-5" strokeWidth={1.9} />
            Recent trends
          </h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mt-1">
          {positive.length > 0 && (
            <TrendCard
              tone="positive"
              heading="Positive"
              icon={<ArrowUpRight className="w-4 h-4" strokeWidth={2} />}
              items={positive}
            />
          )}
          {monitor.length > 0 && (
            <TrendCard
              tone="monitor"
              heading="Monitor"
              icon={<Eye className="w-4 h-4" strokeWidth={2} />}
              items={monitor}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function TrendCard({
  tone,
  heading,
  icon,
  items,
}: {
  tone: "positive" | "monitor";
  heading: string;
  icon: React.ReactNode;
  items: string[];
}) {
  const color = tone === "positive" ? "var(--opt)" : "var(--bord)";

  return (
    <div
      className="bg-card"
      style={{
        border: "1px solid var(--line)",
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        padding: "18px 20px",
      }}
    >
      <div
        className="font-mono inline-flex items-center gap-2.5 uppercase"
        style={{
          fontSize: 12.5,
          letterSpacing: "0.14em",
          fontWeight: 600,
          color,
          marginBottom: 14,
        }}
      >
        {icon}
        {heading}
      </div>
      <ul
        className="flex flex-col gap-[11px] list-none p-0 m-0"
        style={{ fontSize: 16, lineHeight: 1.5, color: "var(--ink-2)" }}
      >
        {items.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              className="font-mono shrink-0"
              style={{ color, fontSize: 17, lineHeight: 1, marginTop: 1 }}
            >
              •
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
