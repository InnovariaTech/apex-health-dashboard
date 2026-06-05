/**
 * Trainerize response envelope.
 *
 * All `/api/trainerize/*` endpoints return `{ success: true, data: T }` on
 * success and `{ success: false, message: string }` on error (see
 * `docs/trainerize/client-apis.md` header). `unwrap` extracts `data`; the axios
 * response interceptor already throws on non-2xx, so an envelope with
 * `success: false` returned with a 2xx status is unexpected but defensively
 * handled.
 */

export interface Envelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export function unwrap<T>(envelope: unknown): T {
  if (envelope && typeof envelope === "object" && "data" in envelope) {
    const e = envelope as Envelope<T>;
    if (e.success === false) {
      throw new Error(e.message || "Trainerize request failed");
    }
    return e.data as T;
  }
  return envelope as T;
}

/** Same as `unwrap` but tolerant of a `null` `data` (e.g. `me/link` when unlinked). */
export function unwrapNullable<T>(envelope: unknown): T | null {
  if (envelope && typeof envelope === "object" && "data" in envelope) {
    const e = envelope as Envelope<T>;
    if (e.success === false) {
      throw new Error(e.message || "Trainerize request failed");
    }
    return (e.data ?? null) as T | null;
  }
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
    return e.data ?? null;
  }
  return envelope;
}
