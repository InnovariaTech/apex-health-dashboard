import type {
  BiomarkerReferenceRange,
  BiomarkerSummaryItem,
} from "@/types/biomarkers/biomarkers_types";
import {
  latestPoint,
  resolveRegistryRange,
  toNumeric,
} from "@/views/patient/utils/biomarkerHelpers";

/**
 * Registry-backed reference scale — the 5-zone (or 3-zone) gauge from the
 * biomarker detail mockup:
 *
 *   [ Out of Range ][ Normal ][ Optimal ][ Normal ][ Out of Range ]
 *                          ▲ Your Score
 *
 * Driven by `item.referenceRanges` (gender-resolved) + `item.referenceStatus`.
 * Zone layout depends on `direction`:
 *   - `in_range`         → red · amber · green · amber · red (5 zones)
 *   - `higher_is_better` → red · amber · green            (3 zones)
 *   - `lower_is_better`  → green · amber · red            (3 zones)
 *
 * Returns `null` when the marker has no registry range (or the range lacks the
 * thresholds its direction needs) — the caller then falls back to the simple
 * lab-string range bar.
 */

// Vivid zone palette matching the biomarkers mockup (`--z-*`), not the muted
// status palette — green (optimal) / amber (normal) / red (out of range).
const TONE_COLOR = {
  opt: "var(--z-green)",
  bord: "var(--z-amber)",
  att: "var(--z-red)",
} as const;

type Tone = keyof typeof TONE_COLOR;
type Tier = "LOW" | "NORMAL" | "OPTIMAL" | "HIGH";

interface Segment {
  from: number;
  to: number;
  tone: Tone;
}
interface LegendCell {
  label: string;
  tier: Tier;
  tone: Tone;
}
interface ScaleModel {
  domainMin: number;
  domainMax: number;
  segments: Segment[];
  ticks: number[];
  legend: LegendCell[];
}

export default function BiomarkerReferenceScale({
  item,
}: {
  item: BiomarkerSummaryItem;
}) {
  const range = resolveRegistryRange(item);
  if (!range) return null;

  const value =
    item.referenceStatus?.value ?? toNumeric(latestPoint(item)?.value);
  const unit = range.unit ?? item.unit ?? "";

  const model = buildScale(range);
  if (!model) return null;

  const { domainMin, domainMax, segments, ticks, legend } = model;
  const span = domainMax - domainMin || 1;
  const pct = (v: number) => clamp01(((v - domainMin) / span) * 100);

  const valuePct = value !== null ? pct(value) : null;
  // Keep the value / "Your Score" labels from spilling past the card edge (and
  // overlapping the neighbouring tile) when the marker sits at an extreme.
  const labelPct = valuePct !== null ? Math.max(13, Math.min(87, valuePct)) : null;

  return (
    <div className="overflow-hidden">
      {/* Marker value label (above the bar) */}
      <div className="relative" style={{ height: 20, marginBottom: 6 }}>
        {valuePct !== null && (
          <span
            className="absolute font-mono tabular-nums"
            style={{
              left: `${labelPct}%`,
              transform: "translateX(-50%)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink)",
              whiteSpace: "nowrap",
            }}
          >
            {fmtNum(value!)}
            {unit ? ` ${unit}` : ""}
          </span>
        )}
      </div>

      {/* Segmented bar — thin 6px bar to match the mockup `.rng-t`. */}
      <div
        className="relative flex overflow-hidden"
        style={{ height: 6, borderRadius: 3 }}
      >
        {segments.map((seg, i) => {
          const w = clamp01(((seg.to - seg.from) / span) * 100);
          return (
            <span
              key={i}
              style={{ width: `${w}%`, background: TONE_COLOR[seg.tone] }}
            />
          );
        })}

        {/* Your Score marker — 2px black tick, matching the mockup `.mk`. */}
        {valuePct !== null && (
          <span
            className="absolute"
            style={{
              top: -3,
              height: 12,
              width: 2,
              left: `${valuePct}%`,
              transform: "translateX(-50%)",
              background: "var(--ink)",
              borderRadius: 1,
            }}
            aria-label="Your value"
          />
        )}
      </div>

      {/* Boundary tick numbers */}
      <div className="relative" style={{ height: 30, marginTop: 6 }}>
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute font-mono tabular-nums text-center"
            style={{
              left: `${Math.max(4, Math.min(96, pct(t)))}%`,
              transform: "translateX(-50%)",
              fontSize: 10.5,
              color: "var(--ink-3)",
              whiteSpace: "nowrap",
            }}
          >
            {fmtNum(t)}
          </span>
        ))}
        {valuePct !== null && (
          <span
            className="absolute text-center"
            style={{
              left: `${labelPct}%`,
              transform: "translateX(-50%)",
              top: 13,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "var(--ink)",
              whiteSpace: "nowrap",
            }}
          >
            Your Score
          </span>
        )}
      </div>

      {/* Tier legend */}
      <div
        className="mt-2 grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${legend.length}, minmax(0, 1fr))`,
        }}
      >
        {legend.map((cell, i) => (
          <div key={i} className="text-center">
            <div
              className="font-mono tabular-nums"
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: TONE_COLOR[cell.tone],
                lineHeight: 1.25,
              }}
            >
              {cell.label}
            </div>
            <div
              style={{
                fontSize: 10,
                color: TONE_COLOR[cell.tone],
                marginTop: 2,
                lineHeight: 1.2,
              }}
            >
              {TIER_TEXT[cell.tier]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TIER_TEXT: Record<Tier, string> = {
  LOW: "Out of Range (Low)",
  NORMAL: "Normal",
  OPTIMAL: "Optimal",
  HIGH: "Out of Range (High)",
};

/**
 * True when this marker can render the registry reference scale — i.e. it has
 * a gender-resolved range whose thresholds satisfy its direction. Lets the
 * caller decide between this scale and the simple lab-string range bar.
 */
export function hasRegistryScale(item: BiomarkerSummaryItem): boolean {
  const range = resolveRegistryRange(item);
  return range !== null && buildScale(range) !== null;
}

// ─── Scale model ─────────────────────────────────────────────────────────

function buildScale(range: BiomarkerReferenceRange): ScaleModel | null {
  const dir = String(range.direction);
  const { normalMin, optimalMin, optimalMax, normalMax } = range;

  if (dir === "higher_is_better") {
    if (optimalMin === null) return null;
    // Full 3-zone when there's a distinct normal floor below optimal…
    if (normalMin !== null && normalMin < optimalMin) {
      const step = optimalMin - normalMin;
      const domainMin = normalMin - step * 1.3;
      const domainMax = optimalMin + step * 2.5;
      return {
        domainMin,
        domainMax,
        segments: [
          { from: domainMin, to: normalMin, tone: "att" },
          { from: normalMin, to: optimalMin, tone: "bord" },
          { from: optimalMin, to: domainMax, tone: "opt" },
        ],
        ticks: [normalMin, optimalMin],
        legend: [
          { label: `< ${fmtNum(normalMin)}`, tier: "LOW", tone: "att" },
          {
            label: `${fmtNum(normalMin)}–${fmtNum(optimalMin)}`,
            tier: "NORMAL",
            tone: "bord",
          },
          { label: `≥ ${fmtNum(optimalMin)}`, tier: "OPTIMAL", tone: "opt" },
        ],
      };
    }
    // …else a 2-zone (below-optimal / optimal) when normal == optimal or absent.
    // Guard against degenerate registry data (threshold ≤ 0) that would
    // collapse the domain — fall back to the lab-range bar instead.
    if (!(optimalMin > 0)) return null;
    const step = Math.max(Math.abs(optimalMin) * 0.3, 1e-6);
    const domainMin = Math.max(0, optimalMin - step * 2);
    const domainMax = optimalMin + step * 2.5;
    return {
      domainMin,
      domainMax,
      segments: [
        { from: domainMin, to: optimalMin, tone: "att" },
        { from: optimalMin, to: domainMax, tone: "opt" },
      ],
      ticks: [optimalMin],
      legend: [
        { label: `< ${fmtNum(optimalMin)}`, tier: "LOW", tone: "att" },
        { label: `≥ ${fmtNum(optimalMin)}`, tier: "OPTIMAL", tone: "opt" },
      ],
    };
  }

  if (dir === "lower_is_better") {
    if (optimalMax === null) return null;
    // Full 3-zone when there's a distinct normal ceiling above optimal…
    if (normalMax !== null && normalMax > optimalMax) {
      const step = normalMax - optimalMax;
      const domainMin = Math.min(0, optimalMax - step * 2);
      const domainMax = normalMax + step * 1.4;
      return {
        domainMin,
        domainMax,
        segments: [
          { from: domainMin, to: optimalMax, tone: "opt" },
          { from: optimalMax, to: normalMax, tone: "bord" },
          { from: normalMax, to: domainMax, tone: "att" },
        ],
        ticks: [optimalMax, normalMax],
        legend: [
          { label: `≤ ${fmtNum(optimalMax)}`, tier: "OPTIMAL", tone: "opt" },
          {
            label: `${fmtNum(optimalMax)}–${fmtNum(normalMax)}`,
            tier: "NORMAL",
            tone: "bord",
          },
          { label: `> ${fmtNum(normalMax)}`, tier: "HIGH", tone: "att" },
        ],
      };
    }
    // …else a 2-zone (optimal / high) when normal == optimal or absent.
    // Guard against degenerate registry data (threshold ≤ 0, e.g. Bilirubin's
    // optimalMax:0) that would collapse the domain — fall back to the lab bar.
    if (!(optimalMax > 0)) return null;
    const step = Math.max(Math.abs(optimalMax) * 0.4, 1e-6);
    const domainMin = Math.min(0, optimalMax - step * 2);
    const domainMax = optimalMax + step * 2;
    return {
      domainMin,
      domainMax,
      segments: [
        { from: domainMin, to: optimalMax, tone: "opt" },
        { from: optimalMax, to: domainMax, tone: "att" },
      ],
      ticks: [optimalMax],
      legend: [
        { label: `≤ ${fmtNum(optimalMax)}`, tier: "OPTIMAL", tone: "opt" },
        { label: `> ${fmtNum(optimalMax)}`, tier: "HIGH", tone: "att" },
      ],
    };
  }

  // in_range (default) — need the four inner thresholds.
  if (
    normalMin === null ||
    optimalMin === null ||
    optimalMax === null ||
    normalMax === null
  ) {
    return null;
  }
  if (!(normalMin <= optimalMin && optimalMin < optimalMax && optimalMax <= normalMax)) {
    return null;
  }
  const outerSpan = normalMax - normalMin || 1;
  const pad = Math.max(outerSpan * 0.18, (optimalMin - normalMin) || outerSpan * 0.1);
  const domainMin = normalMin - pad;
  const domainMax = normalMax + pad;
  return {
    domainMin,
    domainMax,
    segments: [
      { from: domainMin, to: normalMin, tone: "att" },
      { from: normalMin, to: optimalMin, tone: "bord" },
      { from: optimalMin, to: optimalMax, tone: "opt" },
      { from: optimalMax, to: normalMax, tone: "bord" },
      { from: normalMax, to: domainMax, tone: "att" },
    ],
    ticks: [normalMin, optimalMin, optimalMax, normalMax],
    legend: [
      { label: `< ${fmtNum(normalMin)}`, tier: "LOW", tone: "att" },
      {
        label: `${fmtNum(normalMin)}–${fmtNum(optimalMin)}`,
        tier: "NORMAL",
        tone: "bord",
      },
      {
        label: `${fmtNum(optimalMin)}–${fmtNum(optimalMax)}`,
        tier: "OPTIMAL",
        tone: "opt",
      },
      {
        label: `${fmtNum(optimalMax)}–${fmtNum(normalMax)}`,
        tier: "NORMAL",
        tone: "bord",
      },
      { label: `> ${fmtNum(normalMax)}`, tier: "HIGH", tone: "att" },
    ],
  };
}

// ─── Utils ───────────────────────────────────────────────────────────────

function clamp01(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(abs < 10 ? 2 : 1).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}
