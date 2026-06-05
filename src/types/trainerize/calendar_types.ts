/**
 * Trainerize calendar — `GET /api/trainerize/me/calendar`.
 * See `docs/trainerize/client-apis.md` Phase 2.
 *
 * Doc keeps the entry shape loose ("each item typically includes…") so we mirror
 * that: keep known fields typed, accept the rest as unknown. `dailyWorkoutIds`
 * found here feed into `POST /me/daily-workouts/query` for full details.
 */
import type { WeightUnit, DistanceUnit } from "./linkage_types";

export type CalendarEntryType = "workout" | "cardio" | "rest" | string;

export interface CalendarEntry {
  date: string;
  type: CalendarEntryType;
  dailyWorkoutIds?: number[];
  dailyCardioIds?: number[];
  [key: string]: unknown;
}

export interface ListCalendarParams {
  startDate: string;
  endDate: string;
  unitDistance: DistanceUnit;
  unitWeight: WeightUnit;
}
