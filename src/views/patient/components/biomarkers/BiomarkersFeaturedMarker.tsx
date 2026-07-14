import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  BiomarkerCategoryMap,
  BiomarkerReferenceRange,
} from "@/types/biomarkers/biomarkers_types";
import {
  deriveDelta,
  formatCategoryLabel,
  formatDelta,
  latestPoint,
  numericHistory,
  pickFeaturedMarker,
  resolveRegistryRange,
  statusToTone,
  toStatus,
} from "@/views/patient/utils/biomarkerHelpers";

/**
 * Featured biomarker block — mockup `.featured` two-column card.
 *
 * Phase-1 picks the marker algorithmically (most-flagged with longest
 * history, see `pickFeaturedMarker`). The chart uses the marker's own
 * trend history. We render the optimal-band overlay only when a static
 * range dictionary lands in Phase 2 — for now the chart is plain.
 */
export default function BiomarkersFeaturedMarker({
  data,
  onOpen,
}: {
  data: BiomarkerCategoryMap | undefined;
  onOpen: (markerId: string) => void;
}) {
  const featured = useMemo(() => pickFeaturedMarker(data), [data]);
  if (!featured) return null;

  const { item, category, reason } = featured;
  const latest = latestPoint(item);
  const status = toStatus(latest?.status);
  const tone = statusToTone(status);
  const unit = item.unit ?? latest?.unit ?? "";

  const delta = deriveDelta(item);
  const history = numericHistory(item);
  const range = resolveRegistryRange(item);
  const baselinePct =
    history.length >= 2 && history[0] !== 0
      ? ((history[history.length - 1]! - history[0]!) / Math.abs(history[0]!)) * 100
      : null;
  const tagCopy =
    reason === "flagged-longest"
      ? "Most tracked · flagged"
      : reason === "longest-history"
        ? "Most tracked"
        : "Highlighted";

  const id = item.loinc || item.canonicalName || item.biomarkerName;

  return (
    <div className="apex-card mb-[22px]" style={{ padding: "24px 28px" }}>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-9">
      {/* Left column */}
      <div>
        <span
          className="inline-flex items-center gap-1.5 uppercase font-semibold"
          style={{
            fontSize: 10,
            background: "var(--apex-accent-soft)",
            color: "var(--apex-accent-bright)",
            padding: "4px 10px",
            borderRadius: 100,
            letterSpacing: "0.08em",
            marginBottom: 14,
          }}
        >
          <Star className="w-3 h-3" strokeWidth={2.2} />
          {tagCopy}
        </span>
        <h2
          className="font-sans m-0 flex items-center gap-3"
          style={{
            fontWeight: 700,
            fontSize: 28,
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
          }}
        >
          {item.biomarkerName || item.canonicalName}
          {tone !== "unknown" && (
            <span
              className="rounded-full inline-block"
              style={{
                width: 11,
                height: 11,
                background: `var(--${tone})`,
              }}
            />
          )}
        </h2>
        <p
          className="m-0 mt-1"
          style={{ fontSize: 13, color: "var(--ink-3)" }}
        >
          {item.canonicalName !== item.biomarkerName
            ? `${item.canonicalName} · ${formatCategoryLabel(category)} panel`
            : `${formatCategoryLabel(category)} panel`}
        </p>

        <div
          className="flex items-baseline gap-1.5 mb-1"
          style={{ marginTop: 18 }}
        >
          <span
            className="font-mono tabular-nums"
            style={{
              fontSize: 56,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            {latest && latest.value !== null ? String(latest.value) : "—"}
          </span>
          {unit && (
            <span style={{ fontSize: 14, color: "var(--ink-3)" }}>{unit}</span>
          )}
        </div>

        {delta && (
          <div
            className="inline-flex items-center gap-1 font-mono tabular-nums"
            style={{
              fontSize: 12,
              color:
                delta.isGood === true
                  ? "var(--opt)"
                  : delta.isGood === false
                    ? "var(--att)"
                    : "var(--ink-3)",
              marginBottom: 18,
            }}
          >
            {delta.delta > 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2.4} />
            )}
            {formatDelta(delta.delta)} {unit} since last result
          </div>
        )}

        <p
          className="m-0"
          style={{
            fontSize: 14,
            color: "var(--ink-2)",
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {item.trend.length}-result trajectory across{" "}
          {formatCategoryLabel(category)}. Click <em>Full detail</em> to open
          the marker drill-down with the full history table.
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpen(id)}
            className="text-xs"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Full detail
          </Button>
          <Button variant="outline" size="sm" className="text-xs" disabled>
            <Target className="w-3.5 h-3.5" /> Optimize
          </Button>
        </div>
      </div>

      {/* Right column — chart */}
      <div className="relative">
        <div className="flex items-baseline justify-between mb-2">
          <div
            className="font-semibold"
            style={{ fontSize: 13, color: "var(--ink-2)" }}
          >
            {item.trend.length}-result trajectory
          </div>
          {history.length > 1 && (
            <div
              className="font-mono"
              style={{ fontSize: 11, color: "var(--ink-3)" }}
            >
              {history[0]} → {history[history.length - 1]} {unit}
            </div>
          )}
        </div>
        <FeaturedTrendChart item={item} range={range} />
      </div>
    </div>

    {/* Stats strip — derived from real data; the mockup's unbacked
        "Cardiovascular risk" tile is omitted. */}
    <FeaturedStats
      delta={delta}
      baselinePct={baselinePct}
      range={range}
      unit={unit}
    />
    </div>
  );
}

// ─── Stats strip ───────────────────────────────────────────────────────────

function FeaturedStats({
  delta,
  baselinePct,
  range,
  unit,
}: {
  delta: ReturnType<typeof deriveDelta>;
  baselinePct: number | null;
  range: BiomarkerReferenceRange | null;
  unit: string;
}) {
  const improving = delta?.isGood === true;
  const declining = delta?.isGood === false;
  const heroTitle = improving
    ? "Great progress!"
    : declining
      ? "Worth a look"
      : "Holding steady";
  const heroSub = improving
    ? "Trending in the right direction."
    : declining
      ? "Moving away from range."
      : "Stable across recent panels.";

  const goal =
    range && range.optimalMin !== null && range.optimalMax !== null
      ? `Maintain ${fmtRange(range.optimalMin)}–${fmtRange(range.optimalMax)}${unit ? ` ${unit}` : ""}`
      : null;

  return (
    <div
      className="mt-[18px] grid"
      style={{
        gridTemplateColumns: `1.7fr 1fr${goal ? " 1.15fr" : ""}`,
        background: "var(--card, #fff)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: "16px 6px",
      }}
    >
      <div
        className="flex items-center gap-3"
        style={{ padding: "0 16px", minWidth: 0 }}
      >
        <span
          className="grid place-items-center shrink-0"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: improving ? "var(--apex-accent)" : "var(--apex-accent-soft)",
            color: improving ? "#fff" : "var(--apex-accent-bright)",
          }}
        >
          <Trophy className="w-[17px] h-[17px]" strokeWidth={1.9} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
            {heroTitle}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>
            {heroSub}
          </div>
        </div>
      </div>

      <StatCell
        icon={<BarChart3 className="w-[17px] h-[17px]" strokeWidth={1.9} />}
        label="Since baseline"
        value={
          baselinePct === null
            ? "—"
            : `${baselinePct > 0 ? "+" : ""}${baselinePct.toFixed(0)}%`
        }
        valueColor={
          baselinePct === null || delta?.isGood == null
            ? "var(--ink)"
            : delta.isGood
              ? "var(--opt)"
              : "var(--att)"
        }
      />

      {goal ? (
        <StatCell
          icon={<Target className="w-[17px] h-[17px]" strokeWidth={1.9} />}
          label="Goal"
          value={goal}
        />
      ) : null}
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
  valueColor = "var(--ink)",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      className="flex items-center gap-3"
      style={{ padding: "0 16px", borderLeft: "1px solid var(--line)", minWidth: 0 }}
    >
      <span
        className="grid place-items-center shrink-0"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--apex-accent-soft)",
          color: "var(--apex-accent-bright)",
        }}
      >
        {icon}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{label}</div>
        <div
          style={{ fontSize: 15, fontWeight: 700, color: valueColor, marginTop: 1 }}
          className="truncate"
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function fmtRange(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

// ─── Trend chart ─────────────────────────────────────────────────────────

function FeaturedTrendChart({
  item,
  range,
}: {
  item: ReturnType<typeof pickFeaturedMarker> extends infer T
    ? T extends { item: infer I }
      ? I
      : never
    : never;
  range: BiomarkerReferenceRange | null;
}) {
  const w = 480;
  const h = 220;
  const padL = 40;
  const padR = 16;
  const padT = 28;
  const padB = 28;

  const points = useMemo(() => {
    const pts = item.trend
      .map((t) => {
        const v =
          typeof t.value === "number"
            ? t.value
            : typeof t.value === "string"
              ? Number(t.value)
              : NaN;
        return { date: t.date, value: Number.isFinite(v) ? v : null, status: t.status };
      })
      .filter((p) => p.value !== null) as Array<{
      date: string;
      value: number;
      status: string;
    }>;
    return pts;
  }, [item.trend]);

  if (points.length < 2) {
    return (
      <div
        className="rounded-md border border-dashed border-[var(--line-2)] grid place-items-center"
        style={{ height: h, color: "var(--ink-3)", fontSize: 12 }}
      >
        Not enough data points to chart yet.
      </div>
    );
  }

  const optMin = range?.optimalMin ?? null;
  const optMax = range?.optimalMax ?? null;
  const values = points.map((p) => p.value);
  // Include the optimal band in the y-domain so it's always visible.
  const domainVals = [...values];
  if (optMin !== null) domainVals.push(optMin);
  if (optMax !== null) domainVals.push(optMax);
  const rawMax = Math.max(...domainVals);
  const rawMin = Math.min(...domainVals);
  const spanY = rawMax - rawMin || 1;
  const max = rawMax + spanY * 0.08;
  const min = rawMin - spanY * 0.08;
  const spread = max - min || 1;
  const xStep = (w - padL - padR) / (points.length - 1);
  const yFor = (v: number) =>
    padT + (1 - (v - min) / spread) * (h - padT - padB);

  const linePoints = points
    .map((p, i) => `${padL + i * xStep},${yFor(p.value).toFixed(1)}`)
    .join(" ");

  const lastIdx = points.length - 1;
  const lastStatus = String(points[lastIdx]!.status ?? "").toUpperCase();
  const lastColor =
    lastStatus === "NORMAL"
      ? "var(--opt)"
      : lastStatus === "HIGH" || lastStatus === "LOW"
        ? "var(--bord)"
        : lastStatus === "CRITICAL"
          ? "var(--att)"
          : "var(--ink-3)";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto block"
    >
      {optMin !== null && optMax !== null && (
        <>
          <rect
            x={padL}
            y={yFor(optMax)}
            width={w - padL - padR}
            height={Math.abs(yFor(optMin) - yFor(optMax))}
            fill="rgba(46, 125, 90, 0.10)"
          />
          <line
            x1={padL}
            y1={yFor(optMax)}
            x2={w - padR}
            y2={yFor(optMax)}
            stroke="var(--opt)"
            strokeWidth="1"
            strokeDasharray="5 4"
          />
          <line
            x1={padL}
            y1={yFor(optMin)}
            x2={w - padR}
            y2={yFor(optMin)}
            stroke="var(--opt)"
            strokeWidth="1"
            strokeDasharray="5 4"
          />
          <text
            x={padL + 4}
            y={yFor(optMax) - 4}
            fontSize="9"
            fill="var(--opt-d, #1F5B41)"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="500"
          >
            Optimal {formatTick(optMin)}–{formatTick(optMax)}
          </text>
        </>
      )}
      <line
        x1={padL}
        y1={h - padB + 2}
        x2={w - padR}
        y2={h - padB + 2}
        stroke="rgba(26,25,22,0.08)"
        strokeWidth="0.5"
      />
      <text
        x={padL - 6}
        y={yFor(max) + 3}
        fontSize="9"
        fill="var(--ink-3)"
        fontFamily="JetBrains Mono, monospace"
        textAnchor="end"
      >
        {formatTick(max)}
      </text>
      <text
        x={padL - 6}
        y={yFor(min) + 3}
        fontSize="9"
        fill="var(--ink-3)"
        fontFamily="JetBrains Mono, monospace"
        textAnchor="end"
      >
        {formatTick(min)}
      </text>
      <polyline
        points={linePoints}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={padL + i * xStep}
          cy={yFor(p.value)}
          r={i === lastIdx ? 4 : 2.5}
          fill={i === lastIdx ? lastColor : "var(--ink)"}
          stroke={i === lastIdx ? "#FFFFFF" : undefined}
          strokeWidth={i === lastIdx ? 2 : undefined}
        />
      ))}
      <text
        x={padL + lastIdx * xStep - 6}
        y={yFor(points[lastIdx]!.value) - 10}
        fontSize="11"
        fill={lastColor}
        fontFamily="JetBrains Mono, monospace"
        fontWeight="500"
        textAnchor="end"
      >
        {points[lastIdx]!.value}
      </text>
      {points.map((p, i) => {
        // Show every-other label on the X axis to avoid crowding.
        if (i % Math.ceil(points.length / 6) !== 0 && i !== lastIdx) return null;
        return (
          <text
            key={i}
            x={padL + i * xStep}
            y={h - 6}
            fontSize="9"
            fill="var(--ink-3)"
            fontFamily="Inter, sans-serif"
            textAnchor="middle"
          >
            {formatXLabel(p.date)}
          </text>
        );
      })}
    </svg>
  );
}

function formatTick(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}

function formatXLabel(iso: string): string {
  try {
    return format(parseISO(iso), "MMM yy");
  } catch {
    return iso;
  }
}
