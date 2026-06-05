/**
 * Trainerize body stats — `/api/trainerize/me/bodystats` (GET/POST/PUT/DELETE).
 * See `docs/trainerize/client-apis.md` Phase 4.
 *
 * Doc lifecycle: POST creates the empty record for a date, PUT writes the
 * measurements. Trainerize has no range endpoint — pulling a trend means N
 * GETs (see `useBodyStatsRange` in hooks).
 */
import type { WeightUnit, BodystatUnit } from "./linkage_types";

/**
 * Free-form key/value map. Known keys typed, anything else allowed.
 *
 * The docs show fields named `weight` and `bodyFat`, but the actual server
 * response uses `bodyWeight` and `bodyFatPercent` (Trainerize's canonical
 * names). Both are accepted on the type and `Progress.tsx` reads them with a
 * fallback. `caliperMode` is non-measurement metadata the server includes.
 */
export interface BodyMeasures {
  /** Server canonical name. The doc's `weight` may also appear from old clients. */
  bodyWeight?: number | null;
  weight?: number | null;
  /** Server canonical name. The doc's `bodyFat` may also appear. */
  bodyFatPercent?: number | null;
  bodyFat?: number | null;
  caliperMode?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  neck?: number | null;
  shoulders?: number | null;
  bicep?: number | null;
  forearm?: number | null;
  thigh?: number | null;
  calf?: number | null;
  [key: string]: number | null | undefined;
}

/** `GET /me/bodystats` — returns the record for one date. */
export interface BodyStatsRecord {
  date: string;
  status?: string;
  bodyMeasures?: BodyMeasures;
  [key: string]: unknown;
}

export interface GetBodyStatsParams {
  date: string;
  unitWeight: WeightUnit;
  unitBodystats: BodystatUnit;
}

/** `POST /me/bodystats` — create the stub record. */
export interface CreateBodyStatsPayload {
  date: string;
  status: "recorded";
}

/** `PUT /me/bodystats` — save measurements. */
export interface UpdateBodyStatsPayload {
  date: string;
  unitWeight: WeightUnit;
  unitBodystats: BodystatUnit;
  bodyMeasures: BodyMeasures;
}

export interface DeleteBodyStatsPayload {
  date: string;
}
