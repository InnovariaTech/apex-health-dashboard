import type { ParsedRange } from "@/views/patient/utils/biomarkerHelpers";

/**
 * 3-zone reference range bar — out-of-range / in-range / out-of-range.
 *
 * Backend ships only the lab reference range (`lo–hi`), not the tighter
 * "optimal" sub-range from the mockup, so this component is a faithful
 * 3-zone simplification of the mockup's 5-zone `.rng-t` bar:
 *
 *   [ red ]----[ green normal range ]----[ red ]
 *                 ▲ current value marker
 *                 ◯ previous value marker (compare mode)
 *
 * Handles three range shapes from `parseReferenceRange`:
 *   - both sides (`{lo, hi}`)  — full red-green-red split
 *   - upper bound only (`{hi}` for `"<N"`)  — green left, red right
 *   - lower bound only (`{lo}` for `">N"`)  — red left, green right
 *
 * The visible axis pads by ~30% beyond the range so values just outside
 * are still visible without flattening the whole bar.
 */
export default function BiomarkerRangeBar({
  value,
  prev,
  range,
  showPrev,
  size = "tile",
}: {
  value: number | null;
  prev: number | null;
  range: ParsedRange;
  showPrev?: boolean;
  size?: "tile" | "drill";
}) {
  const axis = computeAxis(range, value, prev);
  if (!axis) return null;

  const { min, max, loPct, hiPct, mode } = axis;

  const valuePct =
    value !== null ? clamp01(((value - min) / (max - min)) * 100) : null;
  const prevPct =
    prev !== null && showPrev
      ? clamp01(((prev - min) / (max - min)) * 100)
      : null;

  const barHeight = size === "drill" ? 14 : 12;
  const markerHeight = barHeight + 4;
  const markerOffset = -(markerHeight - barHeight) / 2;

  return (
    <div className={size === "drill" ? "my-3" : "my-3"}>
      <div
        className="relative flex overflow-hidden"
        style={{ height: barHeight, borderRadius: 999 }}
      >
        <RangeZones loPct={loPct} hiPct={hiPct} mode={mode} />

        {/* Connector between prev and current */}
        {prevPct !== null && valuePct !== null && (
          <span
            className="absolute"
            style={{
              top: barHeight / 2 - 1,
              height: 2,
              background: "var(--ink-3)",
              opacity: 0.3,
              left: `${Math.min(prevPct, valuePct)}%`,
              width: `${Math.abs(valuePct - prevPct)}%`,
            }}
          />
        )}

        {/* Previous marker (hollow circle) */}
        {prevPct !== null && (
          <span
            className="absolute"
            style={{
              top: markerOffset,
              width: markerHeight,
              height: markerHeight,
              left: `${prevPct}%`,
              transform: "translateX(-50%)",
              borderRadius: "50%",
              border: "1.5px solid var(--ink-2)",
              background: "var(--card)",
            }}
            aria-label="Previous value"
          />
        )}

        {/* Current value marker — black tick with white halo, matching the
            registry reference scale. */}
        {valuePct !== null && (
          <span
            className="absolute"
            style={{
              top: markerOffset,
              width: 4,
              height: markerHeight,
              left: `${valuePct}%`,
              transform: "translateX(-50%)",
              background: "var(--ink)",
              borderRadius: 2,
              boxShadow: "0 0 0 2px var(--card)",
            }}
            aria-label="Current value"
          />
        )}
      </div>

      <div
        className="flex justify-between font-mono mt-2"
        style={{ fontSize: 10, color: "var(--ink-3)" }}
      >
        <span>{formatBound(range.lo)}</span>
        {mode === "both" ? (
          <span style={{ color: "var(--opt)" }}>
            {range.lo}–{range.hi}
          </span>
        ) : null}
        <span>{formatBound(range.hi)}</span>
      </div>
    </div>
  );
}

// ─── Zone helper ─────────────────────────────────────────────────────────

const SEP = "2px solid var(--card)";

function RangeZones({
  loPct,
  hiPct,
  mode,
}: {
  loPct: number;
  hiPct: number;
  mode: "both" | "upper" | "lower";
}) {
  // Solid, prominent zone colors — same palette as the registry reference
  // scale: red `--att` (out of range) / green `--opt` (in range), with a
  // hairline white separator between zones.
  if (mode === "both") {
    return (
      <>
        <span style={{ width: `${loPct}%`, background: "var(--att)", borderRight: SEP }} />
        <span
          style={{ width: `${hiPct - loPct}%`, background: "var(--opt)", borderRight: SEP }}
        />
        <span style={{ width: `${100 - hiPct}%`, background: "var(--att)" }} />
      </>
    );
  }
  if (mode === "upper") {
    // `<N` — green left, red right
    return (
      <>
        <span style={{ width: `${hiPct}%`, background: "var(--opt)", borderRight: SEP }} />
        <span style={{ width: `${100 - hiPct}%`, background: "var(--att)" }} />
      </>
    );
  }
  // `>N` — red left, green right
  return (
    <>
      <span style={{ width: `${loPct}%`, background: "var(--att)", borderRight: SEP }} />
      <span style={{ width: `${100 - loPct}%`, background: "var(--opt)" }} />
    </>
  );
}

// ─── Axis math ───────────────────────────────────────────────────────────

interface AxisInfo {
  min: number;
  max: number;
  loPct: number;
  hiPct: number;
  mode: "both" | "upper" | "lower";
}

/**
 * Decide the visible min/max for the axis and the % positions of the
 * lo/hi reference bounds. Pads ~30% beyond the range so values close to
 * the edge are still readable; expands further if the current value sits
 * outside that pad.
 */
function computeAxis(
  range: ParsedRange,
  value: number | null,
  prev: number | null,
): AxisInfo | null {
  if (range.lo !== null && range.hi !== null) {
    const span = range.hi - range.lo || 1;
    const pad = span * 0.3;
    let min = range.lo - pad;
    let max = range.hi + pad;
    // Expand if data points fall outside the pad
    if (value !== null) {
      min = Math.min(min, value - span * 0.1);
      max = Math.max(max, value + span * 0.1);
    }
    if (prev !== null) {
      min = Math.min(min, prev - span * 0.1);
      max = Math.max(max, prev + span * 0.1);
    }
    const loPct = ((range.lo - min) / (max - min)) * 100;
    const hiPct = ((range.hi - min) / (max - min)) * 100;
    return { min, max, loPct, hiPct, mode: "both" };
  }

  if (range.hi !== null && range.lo === null) {
    // "<N" — anchor axis around hi with padding
    const reference = Math.max(Math.abs(range.hi), 1);
    let min = range.hi - reference;
    let max = range.hi + reference;
    if (value !== null) {
      min = Math.min(min, value - reference * 0.2);
      max = Math.max(max, value + reference * 0.2);
    }
    if (prev !== null) {
      min = Math.min(min, prev - reference * 0.2);
      max = Math.max(max, prev + reference * 0.2);
    }
    const hiPct = ((range.hi - min) / (max - min)) * 100;
    return { min, max, loPct: 0, hiPct, mode: "upper" };
  }

  if (range.lo !== null && range.hi === null) {
    // ">N" — anchor axis around lo with padding
    const reference = Math.max(Math.abs(range.lo), 1);
    let min = range.lo - reference;
    let max = range.lo + reference;
    if (value !== null) {
      min = Math.min(min, value - reference * 0.2);
      max = Math.max(max, value + reference * 0.2);
    }
    if (prev !== null) {
      min = Math.min(min, prev - reference * 0.2);
      max = Math.max(max, prev + reference * 0.2);
    }
    const loPct = ((range.lo - min) / (max - min)) * 100;
    return { min, max, loPct, hiPct: 100, mode: "lower" };
  }

  return null;
}

function formatBound(n: number | null): string {
  if (n === null) return "";
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(100, n));
}
