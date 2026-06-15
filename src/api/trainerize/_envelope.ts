/**
 * Trainerize response envelope.
 *
 * Two envelope layers can carry errors and the FE must check both:
 *
 *   1. Apex proxy envelope — `{ success: true, data: T }` on success,
 *      `{ success: false, message }` on transport/auth failures. The axios
 *      interceptor already throws on non-2xx, so a `success: false` body with a
 *      2xx status is unexpected but handled defensively.
 *
 *   2. Trainerize Partner-API envelope — Trainerize always returns HTTP 200
 *      and signals application errors via `{ code: <nonzero>, message, data:
 *      null }` *inside* the proxy's `data` field. The proxy strips this on
 *      success (`code: 0`) but currently forwards the error blob verbatim
 *      (see `docs/trainerize/trainerize-api-issues-nutrition-habit (1).docx`
 *      §Issue #2 — "FE should check `data.code === 0` until envelope error
 *      handling is tightened"). We detect that shape and throw a tagged Error
 *      so React Query treats it as a failure.
 */

export interface Envelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class TrainerizeApiError extends Error {
  readonly trainerizeCode: number;
  constructor(code: number, message: string) {
    super(`[trainerize] ${message}`);
    this.name = "TrainerizeApiError";
    this.trainerizeCode = code;
  }
}

/**
 * Detect Trainerize Partner-API error envelopes leaking through the proxy.
 * Shape: `{ code: <nonzero number>, message: string, data: null }`.
 *
 * Conservative match — requires all three fields — so legitimate response
 * objects that happen to carry a `code` field (e.g. a status code embedded in
 * a domain object) don't trip the detector. Throws `TrainerizeApiError` on
 * match; returns silently otherwise.
 */
function detectTrainerizeError(inner: unknown): void {
  if (!inner || typeof inner !== "object" || Array.isArray(inner)) return;
  const obj = inner as { code?: unknown; message?: unknown; data?: unknown };
  const hasErrorCode =
    typeof obj.code === "number" && Number.isFinite(obj.code) && obj.code !== 0;
  const dataIsEmpty = "data" in obj && (obj.data === null || obj.data === undefined);
  if (!hasErrorCode || !dataIsEmpty) return;
  const msg =
    typeof obj.message === "string" && obj.message.length > 0
      ? obj.message
      : "Trainerize request failed";
  throw new TrainerizeApiError(obj.code as number, msg);
}

export function unwrap<T>(envelope: unknown): T {
  if (envelope && typeof envelope === "object" && "data" in envelope) {
    const e = envelope as Envelope<T>;
    if (e.success === false) {
      throw new Error(e.message || "Trainerize request failed");
    }
    detectTrainerizeError(e.data);
    return e.data as T;
  }
  detectTrainerizeError(envelope);
  return envelope as T;
}

/** Same as `unwrap` but tolerant of a `null` `data` (e.g. `me/link` when unlinked). */
export function unwrapNullable<T>(envelope: unknown): T | null {
  if (envelope && typeof envelope === "object" && "data" in envelope) {
    const e = envelope as Envelope<T>;
    if (e.success === false) {
      throw new Error(e.message || "Trainerize request failed");
    }
    detectTrainerizeError(e.data);
    return (e.data ?? null) as T | null;
  }
  detectTrainerizeError(envelope);
  return (envelope ?? null) as T | null;
}

/**
 * Defensive array extraction for Trainerize list endpoints.
 *
 * The Apex proxy *should* return `{ success: true, data: [...] }` per the
 * docs, but in practice the upstream Trainerize Partner API frequently wraps
 * arrays inside an object (e.g. `{ users: [...], total: N }`, `{ threads: [...] }`,
 * `{ results: [...] }`). When that shape leaks through the proxy, the page
 * receives an object and `.map` blows up.
 *
 * This helper handles:
 *   - bare arrays:                   `[...]`            → returned as-is
 *   - documented envelope:           `{success,data:[]}` → returns data
 *   - common upstream wrappers:      `{users|threads|messages|results|items|<key>:[]}`
 *   - unexpected shapes:             returns `[]` (the caller renders empty)
 */
export function unwrapArray<T>(envelope: unknown): T[] {
  const inner = pickInner(envelope);
  if (Array.isArray(inner)) return inner as T[];
  if (inner && typeof inner === "object") {
    for (const key of [
      "results",
      "items",
      "users",
      "threads",
      "messages",
      "programs",
      "plans",
      "workouts",
      "data",
    ]) {
      const candidate = (inner as Record<string, unknown>)[key];
      if (Array.isArray(candidate)) return candidate as T[];
    }
    // Last-ditch: first array-valued property wins.
    for (const value of Object.values(inner as Record<string, unknown>)) {
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}

function pickInner(envelope: unknown): unknown {
  if (envelope && typeof envelope === "object" && "data" in envelope) {
    const e = envelope as Envelope<unknown>;
    if (e.success === false) {
      throw new Error(e.message || "Trainerize request failed");
    }
    detectTrainerizeError(e.data);
    return e.data ?? null;
  }
  detectTrainerizeError(envelope);
  return envelope;
}
