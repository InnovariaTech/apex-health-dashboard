import { useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Printer, Download, X, FileText } from "lucide-react";
import type {
  BiomarkerCategoryMap,
  BiomarkerSummaryItem,
} from "@/types/biomarkers/biomarkers_types";
import {
  deriveDelta,
  deriveTotals,
  formatCategoryLabel,
  latestPoint,
  numericHistory,
  pickFeaturedMarker,
  resolveRegistryRange,
  TIER_LABEL,
  tierToTone,
  toNumeric,
  toStatus,
  toTier,
} from "@/views/patient/utils/biomarkerHelpers";
import "./biomarkerPdf.css";

/**
 * Biomarker PDF export — ported from the `biomarkers (37).html` demo's
 * `Export PDF` modal. Renders a 2-page, print-ready report populated with the
 * real (filtered) biomarker data. "Save as PDF" / "Print" both call
 * `window.print()`; the `@media print` rules in `biomarkerPdf.css` isolate the
 * paper pages.
 *
 * Per the "wire real, hide the rest" decision, patient PII fields and the
 * hand-written insights narrative from the demo are omitted — only fields we
 * can derive from the biomarker summary + AI bio-age are shown.
 */

interface BioAge {
  available?: boolean;
  biologicalYears?: number;
  deltaYears?: number;
}

export default function BiomarkerPdfReport({
  open,
  onClose,
  data,
  bioAge,
}: {
  open: boolean;
  onClose: () => void;
  data: BiomarkerCategoryMap | undefined;
  bioAge?: BioAge;
}) {
  // Lock body scroll + wire Escape while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const now = useMemo(() => new Date(), [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const totals = deriveTotals(data);
  const featured = useMemo(() => pickFeaturedMarker(data), [data]);

  const rows = useMemo(() => buildRows(data), [data]);
  const markerCount = rows.length;
  const categoryCount = useMemo(() => {
    if (!data) return 0;
    return Object.values(data).filter(
      (items) => Array.isArray(items) && items.some(hasVal),
    ).length;
  }, [data]);

  const latestDraw = useMemo(() => {
    let latest: string | null = null;
    rows.forEach((r) => {
      if (r.date && (!latest || r.date > latest)) latest = r.date;
    });
    return latest;
  }, [rows]);

  if (!open) return null;

  const bioAgeAvailable = bioAge?.available === true;
  const generated = format(now, "MMM d, h:mm a");
  const today = format(now, "MMMM d, yyyy");
  const reportId = `BMK-${format(now, "yyyy-MM-dd")}`;
  const drawnLabel = latestDraw ? safeDate(latestDraw) : "—";

  const brandHeader = (
    <div className="rep-h">
      <div>
        <img className="rep-logo" src="/images/apex-md-logo.png" alt="Apex MD" />
        <div className="rep-brand-sub">Longevity &amp; concierge medicine</div>
      </div>
      <div className="rep-meta-right">
        <div>
          Report <strong>{reportId}</strong>
        </div>
        <div>
          Generated <strong>{today}</strong>
        </div>
      </div>
    </div>
  );

  const footer = (page: number) => (
    <div className="rep-footer">
      <span>Apex MD · Biomarker panel</span>
      <span>Page {page} of 2 · Confidential</span>
    </div>
  );

  return (
    <div
      className="bm-pdf-modal open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pdf-toolbar">
        <span className="tb-title">
          <FileText className="w-4 h-4" /> Biomarker report preview
        </span>
        <span className="tb-meta">Generated {generated}</span>
        <div className="tb-actions">
          <button
            type="button"
            className="tb-btn"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            type="button"
            className="tb-btn primary"
            onClick={() => window.print()}
          >
            <Download className="w-3.5 h-3.5" /> Save as PDF
          </button>
          <button
            type="button"
            className="tb-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="pdf-pages-wrap">
        {/* Page 1 */}
        <div className="pdf-page">
          {brandHeader}

          <div className="rep-title-block">
            <h1 className="rep-title">
              Biomarker <em>panel</em>
            </h1>
            <div className="rep-subtitle">
              Comprehensive panel · {markerCount} markers
            </div>
          </div>

          <div className="rep-patient">
            <Field label="Drawn" mono value={drawnLabel} />
            <Field label="Markers" mono value={String(markerCount)} />
            <Field label="Categories" mono value={String(categoryCount)} />
            <Field label="Report ID" mono value={reportId} />
          </div>

          <div className="rep-section">Summary</div>
          <div className="rep-kpis">
            <div className="rep-kpi">
              <div className="rule" />
              <div className="lbl">Biological age</div>
              <div className="val">
                {bioAgeAvailable && typeof bioAge?.biologicalYears === "number"
                  ? bioAge.biologicalYears.toFixed(1)
                  : "—"}
                {bioAgeAvailable ? <span className="unit">yr</span> : null}
              </div>
              <div className="sub">
                {bioAgeAvailable &&
                typeof bioAge?.deltaYears === "number" &&
                bioAge.deltaYears !== 0
                  ? `${Math.abs(bioAge.deltaYears).toFixed(1)} ${bioAge.deltaYears < 0 ? "below" : "above"} chronological`
                  : bioAgeAvailable
                    ? "Matches chronological"
                    : "Run analysis to compute"}
              </div>
            </div>
            <div className="rep-kpi">
              <div
                className={`rule${totals.borderline + totals.attention > 0 ? " bord" : ""}`}
              />
              <div className="lbl">In optimal range</div>
              <div className="val">
                {totals.optimal}
                <span className="unit">/ {totals.tracked}</span>
              </div>
              <div className="sub">
                {totals.borderline > 0 ? `${totals.borderline} borderline` : ""}
                {totals.borderline > 0 && totals.attention > 0 ? " · " : ""}
                {totals.attention > 0 ? `${totals.attention} attention` : ""}
                {totals.borderline === 0 && totals.attention === 0
                  ? "All markers in range"
                  : ""}
              </div>
            </div>
            <div className="rep-kpi">
              <div className="rule" />
              <div className="lbl">Improving</div>
              <div className="val">
                {totals.improving}
                <span className="unit">markers</span>
              </div>
              <div className="sub">Trending toward range since last panel</div>
            </div>
          </div>

          {featured ? (
            <FeaturedBlock featured={featured} />
          ) : null}

          {footer(1)}
        </div>

        {/* Page 2 */}
        <div className="pdf-page">
          {brandHeader}

          <div className="rep-section">Complete panel · {markerCount} markers</div>
          <table className="rep-table">
            <thead>
              <tr>
                <th>Marker</th>
                <th>Category</th>
                <th>Value</th>
                <th>Optimal range</th>
                <th>Status</th>
                <th>vs previous</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <strong>{r.name}</strong>
                  </td>
                  <td className="cat">{r.category}</td>
                  <td className="num">
                    {r.value}{" "}
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        color: "#525252",
                        fontWeight: 400,
                      }}
                    >
                      {r.unit}
                    </span>
                  </td>
                  <td className="dim">{r.optimal}</td>
                  <td>
                    <span className={`sdot dot-${r.tone}`} />
                    <span className="slbl">{r.statusLabel}</span>
                  </td>
                  <td
                    className={`num ${r.deltaGood ? "delta-good" : "delta-bad"}`}
                  >
                    {r.deltaStr}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="rep-disclaimer">
            This report is intended for the named patient and their authorized
            care team. Interpretation should occur in consultation with your
            Apex MD physician. Not a substitute for clinical judgment. © 2026
            Apex Health Enterprises.
          </div>

          {footer(2)}
        </div>
      </div>
    </div>
  );
}

// ─── Featured block ────────────────────────────────────────────────────────

function FeaturedBlock({
  featured,
}: {
  featured: NonNullable<ReturnType<typeof pickFeaturedMarker>>;
}) {
  const { item, category } = featured;
  const latest = latestPoint(item);
  const unit = item.unit ?? latest?.unit ?? "";
  const tier = toTier(item.referenceStatus?.tier);
  const tone = tier ? tierToTone(tier) : "opt";
  const range = resolveRegistryRange(item);
  const delta = deriveDelta(item);
  const history = numericHistory(item);

  const statusText = tier ? TIER_LABEL[tier] ?? "In range" : "In range";

  return (
    <>
      <div className="rep-section">Featured marker</div>
      <div className="rep-featured">
        <div>
          <span className="rep-featured-tag">Most tracked</span>
          <h3>{item.biomarkerName || item.canonicalName}</h3>
          <div className="full-name">
            {item.canonicalName && item.canonicalName !== item.biomarkerName
              ? `${item.canonicalName} · ${formatCategoryLabel(category)} panel`
              : `${formatCategoryLabel(category)} panel`}
          </div>
          <div className="feat-val">
            <span className="feat-num">
              {latest && latest.value !== null ? String(latest.value) : "—"}
            </span>
            <span className="feat-unit">{unit}</span>
          </div>
          <div className={`feat-status${tone === "opt" ? "" : ` ${tone}`}`}>
            {statusText}
            {range && range.optimalMin !== null && range.optimalMax !== null
              ? ` · ${fmtNum(range.optimalMin)}–${fmtNum(range.optimalMax)} optimal`
              : ""}
          </div>
          {delta ? (
            <div className="feat-delta">
              {delta.delta > 0 ? "↑" : delta.delta < 0 ? "↓" : "→"}{" "}
              {Math.abs(delta.delta)} {unit} since last result
            </div>
          ) : null}
          <p>
            {item.trend.length}-result trajectory across{" "}
            {formatCategoryLabel(category)}. See the full history and
            personalized guidance in the marker detail view.
          </p>
        </div>
        <div className="rep-trend-wrap">
          <MiniTrajectory history={history} tone={tone} range={range} />
          {history.length > 1 ? (
            <div className="rep-trend-cap">
              {item.trend.length}-result trajectory · {history[0]} →{" "}
              {history[history.length - 1]} {unit}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function MiniTrajectory({
  history,
  tone,
  range,
}: {
  history: number[];
  tone: "opt" | "bord" | "att" | "unknown";
  range: ReturnType<typeof resolveRegistryRange>;
}) {
  if (history.length < 2) {
    return (
      <div
        style={{
          height: 140,
          display: "grid",
          placeItems: "center",
          color: "#8a8a8a",
          fontSize: 10,
          border: "1px dashed #e0e0dc",
          borderRadius: 6,
        }}
      >
        Not enough data to chart
      </div>
    );
  }
  const w = 360;
  const h = 140;
  const padL = 36;
  const padR = 12;
  const padT = 22;
  const padB = 24;
  const vals = [...history];
  if (range?.optimalMin != null) vals.push(range.optimalMin);
  if (range?.optimalMax != null) vals.push(range.optimalMax);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const span = max - min || 1;
  const pad = span * 0.12;
  const dMax = max + pad;
  const dMin = min - pad;
  const xStep = (w - padL - padR) / (history.length - 1);
  const yFor = (v: number) =>
    padT + (1 - (v - dMin) / (dMax - dMin)) * (h - padT - padB);
  const points = history
    .map((v, i) => `${(padL + i * xStep).toFixed(1)},${yFor(v).toFixed(1)}`)
    .join(" ");
  const lastColor =
    tone === "opt" ? "#2E7D5A" : tone === "bord" ? "#B8761C" : "#B23A3A";

  const optTop = range?.optimalMax != null ? yFor(range.optimalMax) : null;
  const optBot = range?.optimalMin != null ? yFor(range.optimalMin) : null;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      {optTop != null && optBot != null ? (
        <rect
          x={padL}
          y={optTop}
          width={w - padL - padR}
          height={Math.abs(optBot - optTop)}
          fill="rgba(46, 125, 90, 0.08)"
        />
      ) : null}
      <polyline
        points={points}
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {history.map((v, i) => {
        const last = i === history.length - 1;
        return (
          <circle
            key={i}
            cx={padL + i * xStep}
            cy={yFor(v)}
            r={last ? 3.5 : 2}
            fill={last ? lastColor : "#1a1a1a"}
            stroke={last ? "#fff" : undefined}
            strokeWidth={last ? 1.5 : undefined}
          />
        );
      })}
    </svg>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <span className={mono ? "mono" : undefined}>{value}</span>
    </div>
  );
}

interface Row {
  name: string;
  category: string;
  value: string;
  unit: string;
  optimal: string;
  tone: "opt" | "bord" | "att" | "unknown";
  statusLabel: string;
  deltaStr: string;
  deltaGood: boolean;
  date: string | null;
}

function buildRows(data: BiomarkerCategoryMap | undefined): Row[] {
  const out: Row[] = [];
  if (!data) return out;
  for (const [cat, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!hasVal(item)) continue;
      const latest = latestPoint(item);
      const tier = toTier(item.referenceStatus?.tier);
      const tone = tier ? tierToTone(tier) : "opt";
      const range = resolveRegistryRange(item);
      const delta = deriveDelta(item);
      const d = delta?.delta ?? null;
      out.push({
        name: item.biomarkerName || item.canonicalName || "Marker",
        category: formatCategoryLabel(cat),
        value:
          latest && latest.value !== null && latest.value !== ""
            ? String(latest.value)
            : "—",
        unit: item.unit ?? latest?.unit ?? "",
        optimal:
          range && range.optimalMin !== null && range.optimalMax !== null
            ? `${fmtNum(range.optimalMin)}–${fmtNum(range.optimalMax)}`
            : "—",
        tone,
        statusLabel: tier ? TIER_LABEL[tier] ?? "In range" : "In range",
        deltaStr:
          d === null
            ? "—"
            : `${d > 0 ? "↑" : d < 0 ? "↓" : "→"} ${d > 0 ? "+" : ""}${Math.abs(d) < 1 ? d.toFixed(1) : Math.round(d)}`,
        deltaGood: delta?.isGood !== false,
        date: latest?.date ?? null,
      });
    }
  }
  return out;
}

function hasVal(item: BiomarkerSummaryItem): boolean {
  return item.trend.some((t) => t.value !== null && t.value !== "");
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

function safeDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

// Silence unused import in some build configs.
void toStatus;
void toNumeric;
