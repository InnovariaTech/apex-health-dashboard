import { axiosService } from "@/api/http/axiosInstance";
import { unwrapArray, type Envelope } from "./_envelope";
import type {
  CalendarEntry,
  ListCalendarParams,
} from "@/types/trainerize/calendar_types";

/**
 * `GET /api/trainerize/me/calendar`. Doc requires `startDate`, `endDate`,
 * `unitDistance`, `unitWeight`. See `docs/trainerize/client-apis.md` Phase 2.
 *
 * Uses `unwrapArray` defensively — upstream wraps arrays in objects.
 */
export async function listCalendar(
  params: ListCalendarParams,
): Promise<CalendarEntry[]> {
  const res = await axiosService.get<Envelope<CalendarEntry[]>>(
    "/api/trainerize/me/calendar",
    { params },
  );
  return unwrapArray<CalendarEntry>(res.data);
}
