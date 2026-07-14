/**
 * Trainerize accomplishment **stats** (personal records / bests).
 * See `docs/accomplishments-stats-api.md`.
 *
 * Proxies `POST /v03/accomplishment/getStatsList` for the linked client only;
 * the backend injects the Trainerize `userID` — never send it from the FE.
 */

export type AccomplishmentStatsCategory =
  | "goalHabit"
  | "workoutBrokenRecord"
  | "workoutMilestone"
  | "cardioBrokenRecord"
  | "cardioMilestone";

/** Payload for workout / cardio broken-record (PR) rows. */
export interface WorkoutBrokenRecordData {
  dailyExerciseID: number;
  exerciseID: number;
  exerciseName: string;
  /** Logging model — e.g. `strength`, `endurance`, `cardio`, `timedFasterBetter`. */
  recordType: string;
  /** Which PR metric was broken — e.g. `maxLoad`, `maxWeight`, `maxReps`, `tenRepMax`. */
  brokenRecordType: string;
  /** Current best value for this record type. */
  data: number;
  /** Improvement vs previous best (delta). */
  dataChange: number;
  /** Unit for `data` — e.g. `lbs`, `kg`, `reps`, `miles`. */
  unit: string;
  time?: number;
  weight?: number;
}

export interface AccomplishmentStatRow {
  accomplishmentID: number;
  userID: number;
  /** `YYYY-MM-DD HH:MM:SS` (UTC). */
  itemDate: string;
  category: AccomplishmentStatsCategory;
  /** Mirrors `data.brokenRecordType` for PR rows. */
  type: string;
  /** Trainerize aggregate count (meaning varies by category). */
  total: number;
  data: WorkoutBrokenRecordData;
}

export interface AccomplishmentStatsResult {
  stats: AccomplishmentStatRow[];
  total: number;
}

export interface GetAccomplishmentStatsParams {
  category?: AccomplishmentStatsCategory;
  /** 0-based pagination offset. */
  start?: number;
  /** Page size (positive integer). */
  count?: number;
}

/**
 * Humanize a `brokenRecordType` / `type` value for display.
 * e.g. `tenRepMax` → "10 rep max", `maxLoad` → "Max load".
 */
export function humanizeRecordType(type: string | undefined | null): string {
  if (!type) return "Personal record";
  const REP_MAX: Record<string, string> = {
    oneRepMax: "1 rep max",
    threeRepMax: "3 rep max",
    fiveRepMax: "5 rep max",
    tenRepMax: "10 rep max",
  };
  if (REP_MAX[type]) return REP_MAX[type]!;
  const NAMED: Record<string, string> = {
    maxWeight: "Max weight",
    maxLoad: "Max load",
    maxReps: "Max reps",
    maxSpeed: "Max speed",
    maxDistance: "Max distance",
    maxTime: "Max time",
    minTime: "Best time",
    maxLoadTimeWeight: "Max load · time · weight",
  };
  if (NAMED[type]) return NAMED[type]!;
  // Fallback: split camelCase → "Some Words"
  const spaced = type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
  return spaced;
}
