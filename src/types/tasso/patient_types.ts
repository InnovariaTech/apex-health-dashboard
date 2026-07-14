/**
 * Tasso patient-facing types.
 * See `docs/tasso/new-patient-api-and-tasso-implementation.md` §3–5 plus
 * the sampled responses in `docs/tasso/test_results.md`. Field naming
 * follows the LIVE responses (not the doc), so any doc-vs-live drift
 * (e.g. `eventType`, missing `responseMetadata`) is handled here.
 */

// ─── Order events ─────────────────────────────────────────────────────────

/**
 * Doc lists `"ORDER_STATUS_CHANGED"`; the live API returns
 * `"SHIPMENT_STATUS"`. Typed as a string union to accept either + any
 * future variants the backend might add.
 */
export type TassoEventType =
  | "SHIPMENT_STATUS"
  | "ORDER_STATUS_CHANGED"
  | string;

/**
 * Kit lifecycle. Doc enumerates 13 values; the happy path observed in
 * live data is the first 6. Kept as a union with a string escape so
 * unknown values from Tasso don't blow up the parser.
 */
export type TassoOrderStatus =
  | "accepted"
  | "pendingFulfillment"
  | "inTransitToPatient"
  | "atPatient"
  | "inTransitToLab"
  | "atLab"
  | "resultsReady"
  | "delayed"
  | "problem"
  | "cancelled"
  | "returned"
  | "rejected"
  | "failed"
  | string;

export interface TassoOrderEvent {
  orderId: string;
  projectId: string;
  patientId: string;
  eventType: TassoEventType;
  eventContext: {
    status: TassoOrderStatus;
    statusChangedAt: string;
  };
}

export interface ListTassoOrderEventsParams {
  limit?: number;
  cursor?: string;
  /** Comma-separated Tasso order UUIDs. */
  orderIds?: string;
  /** Filter by an order status from `TassoOrderStatus`. */
  status?: TassoOrderStatus;
  /** ISO 8601 datetime — return only events after this. */
  createdSince?: string;
}

/**
 * Live responses don't always carry `responseMetadata`. Treat absent as
 * "no more pages." Hooks read `responseMetadata?.nextCursor ?? undefined`.
 */
export interface TassoPaginatedResponse<T> {
  results: T[];
  responseMetadata?: {
    nextCursor?: string | null;
  };
}

export type ListTassoOrderEventsResult = TassoPaginatedResponse<TassoOrderEvent>;

// ─── Test results ─────────────────────────────────────────────────────────

/**
 * FHIR R4 Bundle entry. We only care about three resource types:
 *   - `Observation` — single analyte reading
 *   - `Specimen`    — sample metadata (collected at, received at)
 *   - `DiagnosticReport` — bundles a plain-text lab report PDF blob
 * Everything else stays as `unknown` to avoid over-typing.
 */
export interface TassoFhirCode {
  coding?: Array<{
    system?: string;
    code?: string;
    display?: string;
  }>;
  text?: string;
}

export interface TassoFhirInterpretation {
  coding?: Array<{
    system?: string;
    code?: string;
    display?: string;
  }>;
  text?: string;
}

export interface TassoFhirObservation {
  resourceType: "Observation";
  status?: string;
  code?: TassoFhirCode;
  specimen?: { reference?: string };
  /** Live values come back as a single string like `"3.3 g/dL"`. */
  valueString?: string;
  interpretation?: TassoFhirInterpretation[];
  effectiveDateTime?: string;
  issued?: string;
}

export interface TassoFhirSpecimen {
  resourceType: "Specimen";
  id?: string;
  receivedTime?: string;
  collection?: { collectedDateTime?: string };
}

export interface TassoFhirDiagnosticReport {
  resourceType: "DiagnosticReport";
  status?: string;
  specimen?: Array<{ reference?: string }>;
  presentedForm?: Array<{
    contentType?: string;
    title?: string;
    /**
     * Plain-text lab report (not actually a PDF despite the
     * `application/PDF` content type). This is the canonical source for
     * reference ranges since the Observation entries don't carry them.
     */
    data?: string;
  }>;
  code?: Record<string, unknown>;
}

export type TassoFhirEntry =
  | { resource: TassoFhirObservation }
  | { resource: TassoFhirSpecimen }
  | { resource: TassoFhirDiagnosticReport }
  | { resource: { resourceType: string; [key: string]: unknown } };

export interface TassoFhirBundle {
  resourceType: "Bundle";
  identifier?: { system?: string; value?: string };
  type?: string;
  entry?: TassoFhirEntry[];
  meta?: { lastUpdated?: string };
  timestamp?: string;
}

export interface TassoTestResult {
  id: string;
  patientId: string;
  orderId: string;
  createdAt: string;
  updatedAt?: string | null;
  renderedResults?: TassoFhirBundle | null;
  /** HL7 v2 ORU message — surfaced as a debug toggle, not user-facing. */
  rawResults?: { value?: string } | null;
}

export interface ListTassoTestResultsParams {
  limit?: number;
  cursor?: string;
  orderIds?: string;
}

export type ListTassoTestResultsResult = TassoPaginatedResponse<TassoTestResult>;

// ─── Helpers / accessors ──────────────────────────────────────────────────

/**
 * Pluck only the `Observation` entries from a bundle. Order is preserved
 * so the UI matches the lab's intended presentation.
 */
export function selectObservations(
  bundle: TassoFhirBundle | null | undefined,
): TassoFhirObservation[] {
  const entries = bundle?.entry ?? [];
  const out: TassoFhirObservation[] = [];
  for (const e of entries) {
    if (e?.resource?.resourceType === "Observation") {
      out.push(e.resource as TassoFhirObservation);
    }
  }
  return out;
}

/**
 * First `DiagnosticReport.presentedForm[0].data` blob found in the bundle.
 * Used for the "Lab report" tab + reference-range extraction.
 */
export function selectLabReportText(
  bundle: TassoFhirBundle | null | undefined,
): string | null {
  const entries = bundle?.entry ?? [];
  for (const e of entries) {
    if (e?.resource?.resourceType === "DiagnosticReport") {
      const data = (e.resource as TassoFhirDiagnosticReport)
        ?.presentedForm?.[0]?.data;
      if (typeof data === "string" && data.trim() !== "") return data;
    }
  }
  return null;
}

/** Display name for an observation — `code.text` first, then any coding. */
export function getObservationName(o: TassoFhirObservation): string {
  if (typeof o.code?.text === "string" && o.code.text.trim() !== "") {
    return o.code.text.trim();
  }
  const coded = o.code?.coding?.find((c) => c.display)?.display;
  if (typeof coded === "string" && coded.trim() !== "") return coded.trim();
  return "Unknown analyte";
}

/**
 * Split `"3.3 g/dL"` into `{ value: "3.3", unit: "g/dL" }`. Anything
 * without a space lands as value-only.
 */
export function parseObservationValue(o: TassoFhirObservation): {
  value: string;
  unit: string | null;
} {
  const raw = typeof o.valueString === "string" ? o.valueString.trim() : "";
  if (!raw) return { value: "", unit: null };
  const lastSpace = raw.lastIndexOf(" ");
  if (lastSpace === -1) return { value: raw, unit: null };
  return {
    value: raw.slice(0, lastSpace).trim(),
    unit: raw.slice(lastSpace + 1).trim() || null,
  };
}

/** "HIGH" / "LOW" / etc. — the most human-friendly form. */
export function getInterpretation(
  o: TassoFhirObservation,
): string | null {
  const first = o.interpretation?.[0];
  if (!first) return null;
  if (typeof first.text === "string" && first.text.trim() !== "") {
    return first.text.trim().toUpperCase();
  }
  const display = first.coding?.find((c) => c.display)?.display;
  return typeof display === "string" && display.trim() !== ""
    ? display.trim().toUpperCase()
    : null;
}

// ─── Reference-range extraction from the plain-text lab report ────────────

export interface ParsedReferenceRange {
  low?: number;
  high?: number;
  unit?: string;
  /** Original verbatim slice for "Less than 5.7%" style guidelines. */
  text?: string;
}

/**
 * Build a `Map<analyteNameUppercase, ParsedReferenceRange>` by scanning
 * lines in the plain-text lab report. Lab text columns are space-padded
 * like:
 *
 *   ALBUMIN                           3.3                   3.2-5.5 g/dL
 *   VITAMIN B-12                      311                   211-911 pg/mL
 *   HIGH DENSITY LIPOPROTEIN(HDL       74                   40-75 mg/dL
 *
 * The regex picks up the analyte name (uppercase + a few punctuation
 * chars), skips the value, captures `low-high unit`. The trailing
 * paren on HDL is acceptable noise — we strip it during lookup.
 */
export function parseRangesFromLabReport(
  text: string | null | undefined,
): Map<string, ParsedReferenceRange> {
  const out = new Map<string, ParsedReferenceRange>();
  if (!text) return out;
  const lines = text.split(/\r?\n/);
  // Anchor: indented line starting with 2+ spaces, an uppercase analyte
  // name, then numbers and an `n.n-n.n unit` window.
  const rowRegex =
    /^\s+([A-Z][A-Z0-9 ()/.\-]+?)\s+[\d.]+\s+(?:HIGH|LOW|NORMAL)?\s*([\d.]+)\s*-\s*([\d.]+)\s+(\S+)\s*$/;
  for (const line of lines) {
    const m = line.match(rowRegex);
    if (!m || !m[1] || !m[2] || !m[3] || !m[4]) continue;
    const rawName = m[1].trim().replace(/\(+$/, "").trim();
    const low = parseFloat(m[2]);
    const high = parseFloat(m[3]);
    const unit = m[4];
    if (Number.isFinite(low) && Number.isFinite(high)) {
      const range: ParsedReferenceRange = { low, high };
      if (unit) range.unit = unit;
      out.set(rawName.toUpperCase(), range);
    }
  }
  return out;
}

/**
 * Look up a parsed range for an observation. Tolerates the analyte's
 * `code.text` and the lab report's name being slightly different
 * (trailing parens, extra punctuation) by stripping non-alphanumeric
 * chars before comparing.
 */
export function findRangeFor(
  o: TassoFhirObservation,
  ranges: Map<string, ParsedReferenceRange>,
): ParsedReferenceRange | null {
  const target = getObservationName(o).toUpperCase();
  if (ranges.has(target)) return ranges.get(target) ?? null;
  // Fuzzy fallback — strip everything except letters/numbers and compare.
  const norm = (s: string) => s.replace(/[^A-Z0-9]/g, "");
  const targetNorm = norm(target);
  for (const [k, v] of ranges) {
    if (norm(k) === targetNorm) return v;
  }
  return null;
}
