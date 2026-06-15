/**
 * Trainerize calendar — `GET /api/trainerize/me/calendar`.
 * See `docs/trainerize/client-apis.md` Phase 2 and
 * `docs/trainerize/habit/habits-daily-items-apis.md` for the habit entry shape.
 *
 * Real response shape (observed, contradicts the loose doc description):
 *
 *   { success: true, data: { calendar: [
 *     { date: "2026-06-08", items: [
 *       { id, type: "habit"|"workout"|"cardio"|"rest", title, status,
 *         subtitle, sort, fromProgram, userProgramID, isAddon, createdBy,
 *         numberOfComments, detail: { type: "customHabit", ... } }
 *     ] }
 *   ] } }
 *
 * The proxy strips the outer `{ success, data }` envelope. We then flatten
 * `calendar[].items[]` into a flat `CalendarEntry[]` (one entry per item)
 * with the parent `date` injected onto each — that's what `listCalendar`
 * returns, so all consumers see a flat list keyed by `(date, type, id)`.
 *
 * Habit entries: pass `id` as `dailyItemId` to `/me/habits/daily-items`
 * GET / PUT / DELETE. Do NOT use the habit series id from `/me/habits` —
 * Trainerize rejects it with `403 No privilege to access user habits`.
 *
 * Backwards-compat: `dailyWorkoutIds` / `dailyCardioIds` / `itemID` aliases
 * are no longer populated by the real upstream. Per-item `id` + `type` is
 * the source of truth — older callsites should migrate to read `id` where
 * `type` matches.
 */
import type { WeightUnit, DistanceUnit } from "./linkage_types";

export type CalendarEntryType =
  | "workout"
  | "cardio"
  | "rest"
  | "habit"
  | string;

/** One item under a day group — the real per-entry shape from upstream. */
export interface CalendarEntry {
  date: string;
  type: CalendarEntryType;
  id?: number;
  title?: string;
  subtitle?: string | null;
  status?: string;
  sort?: number;
  fromProgram?: boolean;
  userProgramID?: number | null;
  isAddon?: boolean;
  createdBy?: unknown;
  numberOfComments?: number;
  detail?: { type?: string; [key: string]: unknown };
  /** @deprecated The real response doesn't aggregate ids — use `id` + `type === "workout"`. */
  dailyWorkoutIds?: number[];
  /** @deprecated The real response doesn't aggregate ids — use `id` + `type === "cardio"`. */
  dailyCardioIds?: number[];
  /** @deprecated The real response doesn't ship a separate `itemID` — use `id`. */
  itemID?: number;
  [key: string]: unknown;
}

/** Day-group shape returned by the upstream before flattening. */
interface CalendarDayGroup {
  date?: string;
  items?: Array<Record<string, unknown>>;
}

/**
 * Flatten the nested upstream shape into per-item entries with `date` copied
 * down from the day group. Tolerates both the nested shape and a list that's
 * already flat (so we don't double-flatten if a caller pre-massages it).
 */
export function flattenCalendar(input: unknown): CalendarEntry[] {
  if (!Array.isArray(input)) return [];
  const out: CalendarEntry[] = [];
  for (const node of input) {
    if (!node || typeof node !== "object") continue;
    const obj = node as CalendarDayGroup & Record<string, unknown>;
    // Already-flat entry: has its own `type` or top-level `id`.
    if (typeof obj.type === "string" || typeof obj.id === "number") {
      out.push(obj as CalendarEntry);
      continue;
    }
    // Day-group: { date, items[] }
    if (Array.isArray(obj.items)) {
      const date = typeof obj.date === "string" ? obj.date : "";
      for (const raw of obj.items) {
        if (!raw || typeof raw !== "object") continue;
        out.push({ date, ...(raw as Record<string, unknown>) } as CalendarEntry);
      }
    }
  }
  return out;
}

export interface ListCalendarParams {
  startDate: string;
  endDate: string;
  unitDistance: DistanceUnit;
  unitWeight: WeightUnit;
}

/**
 * Filter for habit entries on a calendar payload.
 *
 * Doc gives the canonical shape as `{ type: "habit", itemID, date }` but the
 * upstream is loose about casing and id-field naming — observed variants
 * include `itemId`, `dailyItemID`, and string-typed ids. We normalize all of
 * them to a single `itemID: number` field so the UI doesn't silently drop
 * entries that ARE habits but don't match the docs verbatim.
 *
 * Entries we still skip:
 *   - `type` is not a string starting with "habit" (case-insensitive)
 *   - no id-shaped field present, OR present but unparseable as a number
 */
export interface HabitCalendarEntry extends CalendarEntry {
  type: "habit";
  itemID: number;
}

const HABIT_ID_KEYS = [
  "id",
  "itemID",
  "itemId",
  "dailyItemID",
  "dailyItemId",
] as const;

function readNumericField(
  entry: Record<string, unknown>,
  keys: readonly string[],
): number | null {
  for (const k of keys) {
    const raw = entry[k];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      const n = Number(raw);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function isHabitType(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim().toLowerCase().startsWith("habit")
  );
}

export function pickHabitEntries(
  entries: CalendarEntry[] | null | undefined,
): HabitCalendarEntry[] {
  if (!Array.isArray(entries)) return [];
  const out: HabitCalendarEntry[] = [];
  for (const e of entries) {
    if (!e || typeof e !== "object") continue;
    if (!isHabitType(e.type)) continue;
    const id = readNumericField(e as Record<string, unknown>, HABIT_ID_KEYS);
    if (id === null) continue;
    out.push({ ...e, type: "habit", itemID: id } as HabitCalendarEntry);
  }
  return out;
}
