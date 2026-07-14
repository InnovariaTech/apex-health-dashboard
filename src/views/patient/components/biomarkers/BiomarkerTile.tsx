import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { BiomarkerSummaryItem } from "@/types/biomarkers/biomarkers_types";
import {
  deriveDelta,
  formatCategoryLabel,
  formatDelta,
  latestPoint,
  numericHistory,
  pickReferenceRange,
  previousPoint,
  statusToTone,
  tierToTone,
  toNumeric,
  toStatus,
  toTier,
} from "@/views/patient/utils/biomarkerHelpers";
import BiomarkerRangeBar from "@/views/patient/components/biomarkers/BiomarkerRangeBar";
import BiomarkerReferenceScale, {
  hasRegistryScale,
} from "@/views/patient/components/biomarkers/BiomarkerReferenceScale";

/**
 * Single biomarker tile matching the mockup's `.bm` card layout.
 *
 *   .bm: padding 18 20, radius var(--radius-lg), 1px line border
 *   .bm-h:  name + cat above, status dot to the right
 *   .bm-name: 13.5 / 600
 *   .bm-cat: 10 / .08em / uppercase / ink-3
 *   .bm-num: mono 26 / 600 / -0.035em / tabular
 *   .bm-prev: 11 / mono / ink-3 — shown when compareMode=true
 *   .bm-f: top border + delta + sparkline
 *   .bm-more: "Click here to learn more" small footer
 *
 * Phase 1: reference range bar is **omitted** because we don't have
 * `optLo / optHi / rangeLo / rangeHi` from backend yet. Range bars
 * land in Phase 2 with the static dictionary.
 */
export default function BiomarkerTile({
  item,
  category,
  index,
  compareMode,
  onOpen,
}: {
  item: BiomarkerSummaryItem;
  category: string;
  index: number;
  compareMode: boolean;
  onOpen: () => void;
}) {
  const latest = latestPoint(item);
  const prev = previousPoint(item);
  const status = toStatus(latest?.status);
  // Prefer the registry tier (Optimal vs Normal vs out-of-range) for the dot
  // colour; fall back to the coarse lab status when there's no registry tier.
  const tier = toTier(item.referenceStatus?.tier);
  const tone = tier ? tierToTone(tier) : statusToTone(status);
  const unit = item.unit ?? latest?.unit ?? "";
  const delta = deriveDelta(item);
  const history = numericHistory(item);
  const range = pickReferenceRange(item);
  const latestNumeric = toNumeric(latest?.value);
  const prevNumeric = toNumeric(prev?.value);

  const displayValue =
    latest && latest.value !== null && latest.value !== "" ? String(latest.value) : "—";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="apex-card text-left w-full transition-all duration-150 hover:-translate-y-px hover:border-[var(--line-2)] focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      style={{ padding: "18px 20px", animationDelay: `${index * 30}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <p
            className="font-sans m-0 truncate"
            style={{ fontSize: 13.5, fontWeight: 600 }}
          >
            {item.biomarkerName || item.canonicalName}
          </p>
          <p
            className="font-sans truncate m-0 mt-1"
            style={{
              fontSize: 12,
              color: "var(--ink-2)",
              letterSpacing: "-0.01em",
              fontWeight: 600,
            }}
          >
            {formatCategoryLabel(category)}
          </p>
        </div>
        {tone !== "unknown" && (
          <span
            className="rounded-full shrink-0 inline-block"
            style={{
              width: 9,
              height: 9,
              background:
                tone === "opt"
                  ? "var(--z-green)"
                  : tone === "bord"
                    ? "var(--z-amber)"
                    : "var(--z-red)",
              marginTop: 4,
            }}
            aria-label={status}
          />
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-1">
        <span
          className="font-mono tabular-nums"
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            lineHeight: 1.1,
          }}
        >
          {displayValue}
        </span>
        {unit && (
          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{unit}</span>
        )}
      </div>

      {/* "Previous: X" line — visible in compare mode only */}
      {compareMode && prev && (
        <div
          className="font-mono tabular-nums"
          style={{ fontSize: 11, color: "var(--ink-3)" }}
        >
          Previous: {String(prev.value ?? "—")} {unit}
        </div>
      )}

      {/* Reference range — the registry 5-zone scale when available (same as
          the drill panel), else the simple lab-string range bar. */}
      {hasRegistryScale(item) ? (
        <div className="mt-3">
          <BiomarkerReferenceScale item={item} />
        </div>
      ) : (
        range &&
        latestNumeric !== null && (
          <BiomarkerRangeBar
            value={latestNumeric}
            prev={compareMode ? prevNumeric : null}
            range={range}
            showPrev={compareMode}
          />
        )
      )}

      {/* Footer: delta + sparkline */}
      <div
        className="flex items-center justify-between mt-3.5 pt-3 border-t border-[var(--line)]"
        style={{ fontSize: 11, color: "var(--ink-3)" }}
      >
        {delta ? (
          <span
            className="inline-flex items-center gap-1 font-mono tabular-nums"
            style={{
              color:
                delta.isGood === true
                  ? "var(--opt)"
                  : delta.isGood === false
                    ? "var(--att)"
                    : "var(--ink-3)",
            }}
          >
            {delta.delta > 0 ? (
              <ArrowUpRight className="w-3 h-3" strokeWidth={2.4} />
            ) : delta.delta < 0 ? (
              <ArrowDownRight className="w-3 h-3" strokeWidth={2.4} />
            ) : (
              <ArrowRight className="w-3 h-3" strokeWidth={2.4} />
            )}
            {formatDelta(delta.delta)} {unit}
          </span>
        ) : (
          <span>
            {item.trend.length} {item.trend.length === 1 ? "result" : "results"}
          </span>
        )}
        {history.length >= 2 && (
          <MiniSparkline values={history} tone={tone} />
        )}
      </div>

      {/* "Click here to learn more" footer */}
      <div
        className="flex items-center gap-1.5 mt-3 pt-[11px] border-t border-[var(--line)]"
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#2563EB",
          letterSpacing: "0.01em",
        }}
      >
        Click here to learn more
        <ArrowRight className="w-3 h-3 transition-transform" strokeWidth={2.4} />
      </div>
    </button>
  );
}

function MiniSparkline({
  values,
  tone,
}: {
  values: number[];
  tone: ReturnType<typeof statusToTone>;
}) {
  const w = 70;
  const h = 22;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastY = h - ((values[values.length - 1]! - min) / range) * (h - 6) - 3;
  const color = tone === "unknown" ? "var(--ink-3)" : `var(--${tone})`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={w} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}
