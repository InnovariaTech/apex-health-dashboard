import type {
  BiomarkerCategoryMap,
  BiomarkerReferenceRange,
  BiomarkerSummaryItem,
  BiomarkerTier,
  BiomarkerTrendPoint,
} from "@/types/biomarkers/biomarkers_types";

/**
 * Shared helpers for the Biomarkers page surfaces (page, tile, drill panel,
 * featured marker). Frontend-only derivations from `useBiomarkersSummary`.
 */

// ─── Status & tone mapping ───────────────────────────────────────────────

export type BiomarkerStatus = "NORMAL" | "HIGH" | "LOW" | "CRITICAL" | "UNKNOWN";
export type BiomarkerTone = "opt" | "bord" | "att" | "unknown";

export function toStatus(raw: string | undefined): BiomarkerStatus {
  const s = String(raw ?? "").toUpperCase();
  if (s === "NORMAL" || s === "HIGH" || s === "LOW" || s === "CRITICAL") return s;
  return "UNKNOWN";
}

export function statusToTone(status: BiomarkerStatus): BiomarkerTone {
  if (status === "NORMAL") return "opt";
  if (status === "HIGH" || status === "LOW") return "bord";
  if (status === "CRITICAL") return "att";
  return "unknown";
}

export const TONE_LABEL: Record<BiomarkerTone, string> = {
  opt: "Optimal",
  bord: "Borderline",
  att: "Needs attention",
  unknown: "Unknown",
};

// ─── Trend reads ─────────────────────────────────────────────────────────

export function latestPoint(item: BiomarkerSummaryItem): BiomarkerTrendPoint | null {
  return item.trend.length ? item.trend[item.trend.length - 1] ?? null : null;
}

export function previousPoint(item: BiomarkerSummaryItem): BiomarkerTrendPoint | null {
  return item.trend.length >= 2 ? item.trend[item.trend.length - 2] ?? null : null;
}

export function toNumeric(val: unknown): number | null {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function hasValue(val: unknown): boolean {
  if (val == null) return false;
  if (typeof val === "string" && val.trim() === "") return false;
  return true;
}

export function itemHasAnyValue(item: BiomarkerSummaryItem): boolean {
  return item.trend.some((t) => hasValue(t.value));
}

// ─── Derived: delta, history, improving ─────────────────────────────────

export interface BiomarkerDelta {
  delta: number;
  /** When the delta moves toward NORMAL, isGood = true; null when we can't tell. */
  isGood: boolean | null;
}

/**
 * Numeric delta = latest - previous. `isGood` flips based on the latest
 * status: if we moved into / further into NORMAL the change is good; if we
 * moved away from NORMAL it's bad. Without a "desirable direction" signal
 * from the backend, this is the most honest we can be.
 */
export function deriveDelta(item: BiomarkerSummaryItem): BiomarkerDelta | null {
  const latest = latestPoint(item);
  const prev = previousPoint(item);
  if (!latest || !prev) return null;
  const a = toNumeric(latest.value);
  const b = toNumeric(prev.value);
  if (a === null || b === null) return null;
  const delta = a - b;

  const latestStatus = toStatus(latest.status);
  const prevStatus = toStatus(prev.status);

  // Both NORMAL → flat is good; movement direction inconclusive.
  if (latestStatus === "NORMAL" && prevStatus === "NORMAL") {
    return { delta, isGood: true };
  }
  // Was abnormal, now normal — clearly good.
  if (latestStatus === "NORMAL" && prevStatus !== "NORMAL") {
    return { delta, isGood: true };
  }
  // Was normal, now abnormal — clearly bad.
  if (latestStatus !== "NORMAL" && prevStatus === "NORMAL") {
    return { delta, isGood: false };
  }
  // Both abnormal — can't tell without a direction-of-good hint.
  return { delta, isGood: null };
}

export function numericHistory(item: BiomarkerSummaryItem): number[] {
  return item.trend
    .map((t) => toNumeric(t.value))
    .filter((n): n is number => n !== null);
}

/**
 * "Improving" — last point is closer to a normal status than the previous
 * one. Uses the same logic as `deriveDelta.isGood`. Anything flat-and-normal
 * counts as improving (stable in range).
 */
export function isImproving(item: BiomarkerSummaryItem): boolean {
  const d = deriveDelta(item);
  return d?.isGood === true;
}

// ─── Aggregate counts for KPI strip ──────────────────────────────────────

export interface BiomarkerTotals {
  /** Markers with at least one tracked value. */
  tracked: number;
  /** Markers whose latest point is NORMAL. */
  optimal: number;
  /** Markers whose latest point is HIGH or LOW. */
  borderline: number;
  /** Markers whose latest point is CRITICAL. */
  attention: number;
  /** Markers whose latest delta is "good" per `deriveDelta`. */
  improving: number;
  /** Markers across how many categories. */
  categories: number;
}

export function deriveTotals(data: BiomarkerCategoryMap | undefined): BiomarkerTotals {
  const out: BiomarkerTotals = {
    tracked: 0,
    optimal: 0,
    borderline: 0,
    attention: 0,
    improving: 0,
    categories: 0,
  };
  if (!data) return out;

  for (const items of Object.values(data)) {
    if (!Array.isArray(items)) continue;
    const tracked = items.filter(itemHasAnyValue);
    if (tracked.length === 0) continue;
    out.categories += 1;
    for (const item of tracked) {
      out.tracked += 1;
      const latest = latestPoint(item);
      const status = toStatus(latest?.status);
      if (status === "NORMAL") out.optimal += 1;
      else if (status === "HIGH" || status === "LOW") out.borderline += 1;
      else if (status === "CRITICAL") out.attention += 1;
      if (isImproving(item)) out.improving += 1;
    }
  }
  return out;
}

// ─── Featured marker selection ───────────────────────────────────────────

export interface FeaturedMarker {
  item: BiomarkerSummaryItem;
  category: string;
  /** Reason this marker was chosen — drives the tag copy. */
  reason: "flagged-longest" | "longest-history" | "first-tracked";
}

/**
 * Pick a marker worth showing as the hero featured tile.
 *
 * Heuristic (per Phase 1 scope decision):
 *   1. Markers with status != NORMAL on the latest point AND >=4 trend points
 *      → pick the one with the most trend points (longest history).
 *   2. Else any marker with >=6 trend points → pick longest.
 *   3. Else the first marker with any value.
 *   4. Else null.
 */
export function pickFeaturedMarker(
  data: BiomarkerCategoryMap | undefined,
): FeaturedMarker | null {
  if (!data) return null;
  const candidates: Array<{ item: BiomarkerSummaryItem; category: string }> = [];
  for (const [category, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!itemHasAnyValue(item)) continue;
      candidates.push({ item, category });
    }
  }
  if (candidates.length === 0) return null;

  const flaggedLong = candidates
    .filter(({ item }) => {
      const status = toStatus(latestPoint(item)?.status);
      return status !== "NORMAL" && item.trend.length >= 4;
    })
    .sort((a, b) => b.item.trend.length - a.item.trend.length);
  if (flaggedLong[0]) return { ...flaggedLong[0], reason: "flagged-longest" };

  const longHistory = [...candidates]
    .filter(({ item }) => item.trend.length >= 6)
    .sort((a, b) => b.item.trend.length - a.item.trend.length);
  if (longHistory[0]) return { ...longHistory[0], reason: "longest-history" };

  return { ...candidates[0]!, reason: "first-tracked" };
}

// ─── Format helpers ──────────────────────────────────────────────────────

export function formatCategoryLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Compact delta formatter — 0 decimal places for whole numbers, 1 otherwise.
 * Always carries a sign.
 */
export function formatDelta(delta: number): string {
  const abs = Math.abs(delta);
  const formatted = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1).replace(/\.0$/, "");
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return `${sign}${formatted}`;
}

// ─── Reference-range parsing ─────────────────────────────────────────────

/**
 * Parsed reference range. One-sided ranges (`>N` or `<N`) leave the other
 * bound `null`.
 */
export interface ParsedRange {
  lo: number | null;
  hi: number | null;
  /** Original string from the lab — kept for display fallbacks. */
  raw: string;
}

/**
 * Parse the lab reference range string shipped by the backend.
 *
 * Accepts the formats observed in production:
 *   - `"37.5-51.0"`  → both sides
 *   - `"0.0-1.2"`    → both sides (zero-leading lo)
 *   - `">39"`        → lower bound only
 *   - `"<1"`         → upper bound only
 *   - `null` / `""`  → null result
 *
 * Returns null when the string can't be parsed (unknown format).
 */
export function parseReferenceRange(
  raw: string | null | undefined,
): ParsedRange | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  // ">N" / "≥N"
  let m = trimmed.match(/^[>≥]\s*(-?[0-9]*\.?[0-9]+)$/);
  if (m) {
    const n = Number(m[1]);
    return Number.isFinite(n) ? { lo: n, hi: null, raw } : null;
  }

  // "<N" / "≤N"
  m = trimmed.match(/^[<≤]\s*(-?[0-9]*\.?[0-9]+)$/);
  if (m) {
    const n = Number(m[1]);
    return Number.isFinite(n) ? { lo: null, hi: n, raw } : null;
  }

  // "lo-hi" (hyphen, en-dash, em-dash, "to"). Avoid eating a leading
  // negative sign as the separator by matching the first numeric token
  // greedily then the rest.
  m = trimmed.match(
    /^(-?[0-9]*\.?[0-9]+)\s*(?:-|–|—|to)\s*(-?[0-9]*\.?[0-9]+)$/i,
  );
  if (m) {
    const lo = Number(m[1]);
    const hi = Number(m[2]);
    if (Number.isFinite(lo) && Number.isFinite(hi) && lo <= hi) {
      return { lo, hi, raw };
    }
  }

  return null;
}

/**
 * Resolve the best reference range to use for a biomarker tile / drill
 * panel — prefer the explicit `latestReferenceRange` on the summary item;
 * fall back to scanning trend[] newest-first for a populated string.
 */
export function pickReferenceRange(
  item: BiomarkerSummaryItem,
): ParsedRange | null {
  const fromLatest = parseReferenceRange(item.latestReferenceRange);
  if (fromLatest) return fromLatest;
  for (let i = item.trend.length - 1; i >= 0; i--) {
    const parsed = parseReferenceRange(item.trend[i]?.referenceRange);
    if (parsed) return parsed;
  }
  return null;
}

// ─── Registry reference ranges + tiers ───────────────────────────────────

/**
 * Pick the gender-appropriate registry range from `item.referenceRanges`.
 * Prefers the gender resolved by `referenceStatus`, then `"both"`, then the
 * first available. Returns null when the marker has no registry ranges.
 */
export function resolveRegistryRange(
  item: BiomarkerSummaryItem,
): BiomarkerReferenceRange | null {
  const ranges = item.referenceRanges;
  if (!Array.isArray(ranges) || ranges.length === 0) return null;
  const wantGender = String(
    item.referenceStatus?.gender ?? "",
  ).toLowerCase();
  if (wantGender) {
    const byGender = ranges.find(
      (r) => String(r.gender).toLowerCase() === wantGender,
    );
    if (byGender) return byGender;
  }
  const both = ranges.find((r) => String(r.gender).toLowerCase() === "both");
  return both ?? ranges[0] ?? null;
}

/** Normalize a tier string from the API. */
export function toTier(raw: string | undefined | null): BiomarkerTier | null {
  const t = String(raw ?? "").toUpperCase();
  if (t === "LOW" || t === "NORMAL" || t === "OPTIMAL" || t === "HIGH") return t;
  return null;
}

/**
 * Tier → tone. OPTIMAL is green, NORMAL is amber (acceptable but not
 * optimal), LOW / HIGH (out of range) are red.
 */
export function tierToTone(tier: BiomarkerTier | null): BiomarkerTone {
  if (tier === "OPTIMAL") return "opt";
  if (tier === "NORMAL") return "bord";
  if (tier === "LOW" || tier === "HIGH") return "att";
  return "unknown";
}

export const TIER_LABEL: Record<string, string> = {
  LOW: "Out of Range (Low)",
  NORMAL: "Normal",
  OPTIMAL: "Optimal",
  HIGH: "Out of Range (High)",
};
