import { useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight, X } from "lucide-react";
import type { BiomarkerSummaryItem } from "@/types/biomarkers/biomarkers_types";
import { useBiomarkerEducation } from "@/hooks/biomarkers/useBiomarkers";
import type { BiomarkerEducationView } from "@/types/biomarkers/education_types";
import {
  deriveDelta,
  formatCategoryLabel,
  formatDelta,
  latestPoint,
  pickReferenceRange,
  previousPoint,
  statusToTone,
  TIER_LABEL,
  tierToTone,
  toNumeric,
  toStatus,
  toTier,
  TONE_LABEL,
} from "@/views/patient/utils/biomarkerHelpers";
import BiomarkerRangeBar from "@/views/patient/components/biomarkers/BiomarkerRangeBar";
import BiomarkerReferenceScale, {
  hasRegistryScale,
} from "@/views/patient/components/biomarkers/BiomarkerReferenceScale";

/**
 * Slide-in drill panel matching the mockup's `.drill` block.
 *
 * Phase-1 sections (everything we can render from the existing data):
 *   - Header: tag (category), name, full name, headline value + status + delta
 *   - 8-quarter trajectory (chart from the trend array)
 *   - Result history table
 *
 * Sections hidden until later phases (need backend or static dictionary):
 *   - Reference range bar (needs optLo / optHi / rangeLo / rangeHi)
 *   - "What this measures" (needs `what` description)
 *   - "What moves it" factor grid
 *   - Action plan
 *   - Related markers
 */
export default function BiomarkerDrillPanel({
  item,
  category,
  open,
  onClose,
}: {
  item: BiomarkerSummaryItem | null;
  category: string | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[90] backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(26, 25, 22, 0.32)" }}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed top-0 right-0 z-[100] h-screen max-w-[95vw] bg-card shadow-[var(--shadow-panel)] overflow-y-auto flex flex-col transition-transform"
        style={{
          width: 540,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transitionDuration: "280ms",
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0.18, 1)",
        }}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        {item ? (
          <DrillBody item={item} category={category} onClose={onClose} />
        ) : null}
      </aside>
    </>
  );
}

function DrillBody({
  item,
  category,
  onClose,
}: {
  item: BiomarkerSummaryItem;
  category: string | null;
  onClose: () => void;
}) {
  const latest = latestPoint(item);
  const prev = previousPoint(item);
  const status = toStatus(latest?.status);
  const unit = item.unit ?? latest?.unit ?? "";
  const delta = deriveDelta(item);
  const range = pickReferenceRange(item);
  const latestNumeric = toNumeric(latest?.value);
  const prevNumeric = toNumeric(prev?.value);

  // Prefer the registry tier (distinguishes Optimal vs Normal) for the status
  // pill; fall back to the coarse lab status (NORMAL/HIGH/LOW) when absent.
  const tier = toTier(item.referenceStatus?.tier);
  const tone = tier ? tierToTone(tier) : statusToTone(status);
  const statusLabel = tier ? TIER_LABEL[tier] ?? TONE_LABEL[tone] : TONE_LABEL[tone];
  const showRegistryScale = hasRegistryScale(item);

  // Lazy education content — fires on drawer open (this body only mounts when
  // a marker is selected). loinc preferred, canonicalName fallback.
  const education = useBiomarkerEducation(item.loinc, item.canonicalName);

  return (
    <>
      {/* Header */}
      <div
        className="sticky top-0 z-[2] bg-card border-b border-[var(--line)] relative"
        style={{ padding: "22px 28px 18px" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute grid place-items-center rounded-md border border-[var(--line)] bg-card hover:bg-[var(--surface-2)]"
          style={{
            top: 16,
            right: 18,
            width: 32,
            height: 32,
            color: "var(--ink-2)",
          }}
          aria-label="Close"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>

        {category && (
          <span
            className="inline-block uppercase font-semibold"
            style={{
              fontSize: 10,
              background: "var(--apex-accent-soft)",
              color: "var(--apex-accent-bright)",
              padding: "3px 9px",
              borderRadius: 100,
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            {formatCategoryLabel(category)} panel
          </span>
        )}

        <h2
          className="font-sans m-0"
          style={{
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: "-0.015em",
            paddingRight: 50,
          }}
        >
          {item.biomarkerName || item.canonicalName}
        </h2>
        {item.canonicalName !== item.biomarkerName && item.canonicalName && (
          <p
            className="m-0"
            style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}
          >
            {item.canonicalName}
          </p>
        )}

        <div
          className="flex items-center gap-4 flex-wrap mt-4"
        >
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-mono tabular-nums"
              style={{
                fontSize: 40,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {latest && latest.value !== null ? String(latest.value) : "—"}
            </span>
            {unit && (
              <span style={{ fontSize: 14, color: "var(--ink-3)" }}>{unit}</span>
            )}
          </div>

          {tone !== "unknown" && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full"
              style={{
                background: `var(--${tone}-soft)`,
                color: `var(--${tone})`,
                padding: "5px 11px",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: `var(--${tone})` }}
              />
              {statusLabel}
            </span>
          )}

          {delta && (
            <span
              className="inline-flex items-center gap-1 font-mono tabular-nums"
              style={{
                fontSize: 13,
                color:
                  delta.isGood === true
                    ? "var(--opt)"
                    : delta.isGood === false
                      ? "var(--att)"
                      : "var(--ink-3)",
              }}
            >
              {delta.delta > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.4} />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" strokeWidth={2.4} />
              )}
              {formatDelta(delta.delta)} {unit} vs last result
            </span>
          )}

          {item.loinc && (
            <span
              className="ml-auto font-mono"
              style={{ fontSize: 11, color: "var(--ink-3)" }}
            >
              LOINC {item.loinc}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "22px 28px 32px" }}>
        {(showRegistryScale || (range && latestNumeric !== null)) && (
          <section className="mb-7">
            <h3
              className="font-sans m-0 mb-3"
              style={{
                fontSize: 15,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
                fontWeight: 700,
              }}
            >
              Reference range
            </h3>

            {showRegistryScale ? (
              <BiomarkerReferenceScale item={item} />
            ) : (
              range &&
              latestNumeric !== null && (
                <BiomarkerRangeBar
                  value={latestNumeric}
                  prev={prevNumeric}
                  range={range}
                  showPrev
                  size="drill"
                />
              )
            )}

            {range && (
              <p
                className="m-0 mt-3 font-mono"
                style={{ fontSize: 11, color: "var(--ink-3)" }}
              >
                Lab reference range:{" "}
                <strong style={{ color: "var(--ink-2)" }}>{range.raw}</strong>
                {unit ? ` ${unit}` : ""}
              </p>
            )}
          </section>
        )}

        {/* Education — "What this measures" + "What moves it" (lazy). */}
        <EducationSections
          isLoading={education.isLoading}
          data={education.data ?? null}
        />

        <section className="mb-7">
          <h3
            className="font-sans m-0 mb-3"
            style={{
              fontSize: 15,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              fontWeight: 700,
            }}
          >
            Trajectory · {item.trend.length}{" "}
            {item.trend.length === 1 ? "result" : "results"}
          </h3>
          <TrajectoryChart item={item} />
        </section>

        <section>
          <h3
            className="font-mono uppercase m-0 mb-3"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              color: "var(--ink-3)",
              fontWeight: 600,
            }}
          >
            Result history
          </h3>
          <ResultHistoryTable item={item} unit={unit} />
        </section>
      </div>
    </>
  );
}

// ─── Education (What this measures / What moves it) ──────────────────────

const EDU_HEADING_STYLE = {
  fontSize: 15,
  letterSpacing: "-0.01em",
  color: "var(--ink)",
  fontWeight: 700,
} as const;

function EducationSections({
  isLoading,
  data,
}: {
  isLoading: boolean;
  data: BiomarkerEducationView | null;
}) {
  if (isLoading) {
    return (
      <section className="mb-7">
        <div
          className="rounded-md"
          style={{
            height: 14,
            width: "42%",
            background: "var(--surface-2)",
            marginBottom: 12,
          }}
        />
        <div
          className="rounded-md"
          style={{ height: 52, background: "var(--surface-2)" }}
        />
      </section>
    );
  }

  // 404 / no registry link → hide education entirely (nothing to show).
  if (!data) return null;

  const hasSummary = Boolean(data.measurementSummary);
  const factors = data.modifiableFactors ?? [];
  const hasFactors = factors.length > 0;
  if (!hasSummary && !hasFactors) return null;

  return (
    <>
      {hasSummary && (
        <section className="mb-7">
          <h3 className="font-sans m-0 mb-3" style={EDU_HEADING_STYLE}>
            What this measures
          </h3>
          <p
            className="m-0"
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "var(--ink-2)",
            }}
          >
            {data.measurementSummary}
          </p>
        </section>
      )}

      {hasFactors && (
        <section className="mb-7">
          <h3 className="font-sans m-0 mb-3" style={EDU_HEADING_STYLE}>
            Factors that may affect this marker
          </h3>
          <ul className="m-0 p-0 list-none grid gap-2">
            {factors.map((f, i) => (
              <FactorRow
                key={`${f.label}-${i}`}
                label={f.label}
                direction={f.direction}
              />
            ))}
          </ul>
          <p
            className="m-0 mt-3"
            style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}
          >
            Informational only — not clinical advice.
          </p>
        </section>
      )}
    </>
  );
}

function FactorRow({
  label,
  direction,
}: {
  label: string;
  direction: "increase" | "decrease";
}) {
  const raises = direction === "increase";
  // Direction is the *effect on the value* (raise / lower), NOT good vs bad —
  // the same direction can be desirable or not depending on the marker. Keep
  // the coloring neutral; only the arrow + label carry the meaning.
  const Icon = raises ? ArrowUp : ArrowDown;
  return (
    <li
      className="flex items-center gap-3"
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid var(--line)",
        background: "var(--surface-2)",
      }}
    >
      <span
        className="grid place-items-center flex-none rounded-full"
        style={{
          width: 24,
          height: 24,
          background: "var(--surface)",
          border: "1px solid var(--line-2)",
          color: "var(--ink-2)",
        }}
        title={raises ? "Tends to raise this marker" : "Tends to lower this marker"}
      >
        <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
      </span>
      <span
        className="flex-1 min-w-0"
        style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}
      >
        {label}
      </span>
      <span
        className="font-mono uppercase flex-none"
        style={{
          fontSize: 9.5,
          letterSpacing: "0.08em",
          color: "var(--ink-3)",
          fontWeight: 600,
        }}
      >
        {raises ? "Raises" : "Lowers"}
      </span>
    </li>
  );
}

// ─── Trajectory ──────────────────────────────────────────────────────────

/**
 * Mockup-faithful trajectory chart for the drill panel.
 *
 * Spec from `New Ui/3 Biomarkers/.../js/biomarkers.js`:
 *   - 480×200 viewBox, padding L36 R16 T28 B24
 *   - Reference range painted as a soft-green rect under the line
 *   - Y-axis labels at the lo/hi range bounds (mono 9px ink-3)
 *   - Polyline #1A1A1A, stroke 1.75
 *   - Past dots = black r2.5, latest = tone-colored r4 with white stroke
 *   - Latest value floats above the last dot in the tone color
 *   - X-axis labels every-other tick (mono 9px ink-3)
 *   - Axis baseline ruler (faint ink stroke)
 */
function TrajectoryChart({ item }: { item: BiomarkerSummaryItem }) {
  const range = pickReferenceRange(item);

  const points = useMemo(() => {
    return item.trend
      .map((t) => {
        const v =
          typeof t.value === "number"
            ? t.value
            : typeof t.value === "string"
              ? Number(t.value)
              : NaN;
        return {
          date: t.date,
          value: Number.isFinite(v) ? v : null,
          status: t.status,
        };
      })
      .filter((p) => p.value !== null) as Array<{
      date: string;
      value: number;
      status: string;
    }>;
  }, [item.trend]);

  if (points.length < 2) {
    return (
      <div
        className="rounded-md border border-dashed border-[var(--line-2)] grid place-items-center"
        style={{ height: 200, color: "var(--ink-3)", fontSize: 12 }}
      >
        Not enough data to plot.
      </div>
    );
  }

  const w = 480;
  const h = 200;
  const padL = 36;
  const padR = 16;
  const padT = 28;
  const padB = 24;
  const values = points.map((p) => p.value);

  // Domain — include the reference range so the band stays in view, and
  // pad slightly past the extremes (mockup's `optHi * 1.2 / optLo * 0.8`).
  const domainMax = range?.hi != null ? Math.max(...values, range.hi * 1.2) : Math.max(...values);
  const domainMin = range?.lo != null ? Math.min(...values, range.lo * 0.8) : Math.min(...values);
  const span = domainMax - domainMin || 1;

  const xStep = (w - padL - padR) / (points.length - 1);
  const yFor = (v: number) => padT + (1 - (v - domainMin) / span) * (h - padT - padB);

  const linePoints = points
    .map((p, i) => `${padL + i * xStep},${yFor(p.value).toFixed(1)}`)
    .join(" ");

  const lastIdx = points.length - 1;
  const lastStatus = String(points[lastIdx]!.status ?? "").toUpperCase();
  const lastColor =
    lastStatus === "NORMAL"
      ? "#2E7D5A"
      : lastStatus === "HIGH" || lastStatus === "LOW"
        ? "#B8761C"
        : lastStatus === "CRITICAL"
          ? "#B23A3A"
          : "#8A8A8A";

  // Reference band y bounds
  const bandTop = range?.hi != null ? yFor(range.hi) : null;
  const bandBot = range?.lo != null ? yFor(range.lo) : h - padB;
  const bandRectTop = bandTop ?? padT;
  const bandRectHeight = (bandBot ?? h - padB) - bandRectTop;
  const showBand = bandRectHeight > 0;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-auto block"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Reference range band */}
      {range && showBand && (
        <>
          <rect
            x={padL}
            y={bandRectTop}
            width={w - padL - padR}
            height={bandRectHeight}
            fill="rgba(46, 125, 90, 0.07)"
          />
          <text
            x={padL + 4}
            y={bandRectTop - 4}
            fontSize="9"
            fill="#2E7D5A"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="500"
          >
            {rangeBandLabel(range)}
          </text>
        </>
      )}

      {/* Y-axis baseline */}
      <line
        x1={padL}
        y1={h - padB}
        x2={w - padR}
        y2={h - padB}
        stroke="rgba(26, 25, 22, 0.08)"
        strokeWidth="0.5"
      />

      {/* Y-axis range bound labels */}
      {range?.hi != null && bandTop != null && (
        <text
          x={padL - 6}
          y={bandTop + 3}
          fontSize="9"
          fill="#8A8A8A"
          fontFamily="JetBrains Mono, monospace"
          textAnchor="end"
        >
          {fmt(range.hi)}
        </text>
      )}
      {range?.lo != null && (
        <text
          x={padL - 6}
          y={yFor(range.lo) + 3}
          fontSize="9"
          fill="#8A8A8A"
          fontFamily="JetBrains Mono, monospace"
          textAnchor="end"
        >
          {fmt(range.lo)}
        </text>
      )}

      {/* Trend line */}
      <polyline
        points={linePoints}
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={padL + i * xStep}
          cy={yFor(p.value)}
          r={i === lastIdx ? 4 : 2.5}
          fill={i === lastIdx ? lastColor : "#1A1A1A"}
          stroke={i === lastIdx ? "#FFFFFF" : undefined}
          strokeWidth={i === lastIdx ? 2 : undefined}
        />
      ))}

      {/* Latest value label */}
      <text
        x={padL + lastIdx * xStep}
        y={yFor(points[lastIdx]!.value) - 10}
        fontSize="11"
        fill={lastColor}
        fontFamily="JetBrains Mono, monospace"
        fontWeight="500"
        textAnchor="end"
      >
        {points[lastIdx]!.value}
      </text>

      {/* X-axis labels — every other point */}
      {points.map((p, i) => {
        if (i % 2 !== 0 && i !== lastIdx) return null;
        return (
          <text
            key={i}
            x={padL + i * xStep}
            y={h - 6}
            fontSize="9"
            fill="#8A8A8A"
            fontFamily="Inter, sans-serif"
            textAnchor="middle"
          >
            {fmtX(p.date)}
          </text>
        );
      })}
    </svg>
  );
}

function rangeBandLabel(range: ReturnType<typeof pickReferenceRange>): string {
  if (!range) return "";
  if (range.lo != null && range.hi != null) {
    return `Normal ${fmt(range.lo)}–${fmt(range.hi)}`;
  }
  if (range.hi != null) return `Normal < ${fmt(range.hi)}`;
  if (range.lo != null) return `Normal > ${fmt(range.lo)}`;
  return "";
}

// ─── Result history ──────────────────────────────────────────────────────

function ResultHistoryTable({
  item,
  unit,
}: {
  item: BiomarkerSummaryItem;
  unit: string;
}) {
  const rows = useMemo(() => [...item.trend].reverse(), [item.trend]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ fontSize: 13 }}>
        <thead>
          <tr className="border-b border-[var(--line)]">
            <th
              className="text-left font-mono uppercase"
              style={{
                padding: "8px 16px 8px 0",
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--ink-3)",
                fontWeight: 600,
              }}
            >
              Date
            </th>
            <th
              className="text-left font-mono uppercase"
              style={{
                padding: "8px 16px 8px 0",
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--ink-3)",
                fontWeight: 600,
              }}
            >
              Value
            </th>
            <th
              className="text-left font-mono uppercase"
              style={{
                padding: "8px 0",
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--ink-3)",
                fontWeight: 600,
              }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const status = toStatus(row.status);
            const tone = statusToTone(status);
            return (
              <tr
                key={`${row.date}-${i}`}
                className="border-b border-[var(--line)] last:border-b-0"
              >
                <td
                  className="font-mono"
                  style={{
                    padding: "10px 16px 10px 0",
                    fontSize: 12,
                    color: "var(--ink-3)",
                  }}
                >
                  {fmtRowDate(row.date)}
                </td>
                <td
                  className="font-mono tabular-nums"
                  style={{
                    padding: "10px 16px 10px 0",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {row.value !== null && row.value !== ""
                    ? `${row.value} ${unit}`
                    : "—"}
                </td>
                <td style={{ padding: "10px 0" }}>
                  {tone !== "unknown" ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        background: `var(--${tone}-soft)`,
                        color: `var(--${tone})`,
                        padding: "3px 9px",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: `var(--${tone})` }}
                      />
                      {TONE_LABEL[tone]}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}
function fmtX(iso: string): string {
  try {
    return format(parseISO(iso), "MMM yy");
  } catch {
    return iso;
  }
}
function fmtRowDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}
