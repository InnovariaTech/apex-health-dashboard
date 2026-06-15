/**
 * Trainerize studio locations — backs `src/api/trainerize/locations.ts`.
 * See `docs/trainerize/locations/trainerize-locations.md`.
 *
 * `Location.id` is the value to pass as `locationId` on the appointment
 * self-book and timeslots endpoints. The Apex proxy filters inactive
 * locations server-side, so `isActive` is always `true` in responses.
 */

export type LocationType = "physical" | "online" | string;

/** One of `monday`…`sunday`. */
export type LocationWeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const LOCATION_WEEK_DAYS: LocationWeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export interface LocationHours {
  weekDay?: LocationWeekDay | string;
  isClose?: boolean;
  /** Open time as minutes from midnight (e.g. 600 = 10:00). */
  openAt?: number;
  /** Close time as minutes from midnight (e.g. 1080 = 18:00). */
  closeAt?: number;
}

export interface Location {
  id: number;
  name?: string;
  type?: LocationType;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phoneNumber?: string;
  lat?: number;
  lng?: number;
  isActive?: boolean;
  hours?: LocationHours[];
}

export interface ListLocationsResult {
  locations: Location[];
}

/**
 * Format an `openAt`/`closeAt` minutes value as `HH:mm` for display.
 * Returns `--:--` if the input is missing/invalid.
 */
export function formatLocationHourMinutes(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--:--";
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.floor(value)));
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Render a single-line address from a `Location` — skips missing parts so
 * online-only locations don't render dangling commas.
 */
export function formatLocationAddress(loc: Location | null | undefined): string {
  if (!loc) return "";
  const parts = [
    loc.address1,
    loc.address2,
    loc.city,
    [loc.state, loc.zipCode].filter(Boolean).join(" "),
    loc.country,
  ].filter((p) => typeof p === "string" && p.trim() !== "");
  return parts.join(", ");
}
