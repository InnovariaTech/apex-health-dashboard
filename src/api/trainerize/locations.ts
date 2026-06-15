import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  ListLocationsResult,
  Location,
} from "@/types/trainerize/locations_types";

/**
 * Trainerize studio locations.
 * See `docs/trainerize/locations/trainerize-locations.md`.
 *
 * The proxy returns `{ data: { locations: [...] } }`; we unwrap to the
 * inner array. Empty list is a valid success state (studio with no active
 * locations) — callers render a "Studio location not configured" notice.
 */

const BASE = "/api/trainerize/me/locations";

export async function listLocations(): Promise<Location[]> {
  const res = await axiosService.get<Envelope<ListLocationsResult>>(BASE);
  const data = unwrap<ListLocationsResult | null>(res.data);
  if (!data) return [];
  return Array.isArray(data.locations) ? data.locations : [];
}
