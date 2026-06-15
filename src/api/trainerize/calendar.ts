import { axiosService } from "@/api/http/axiosInstance";
import { unwrapArray, type Envelope } from "./_envelope";
import {
  flattenCalendar,
  type CalendarEntry,
  type ListCalendarParams,
} from "@/types/trainerize/calendar_types";

/**
 * `GET /api/trainerize/me/calendar`. Doc requires `startDate`, `endDate`,
 * `unitDistance`, `unitWeight`. See `docs/trainerize/client-apis.md` Phase 2.
 *
 * Real response is `{ data: { calendar: [{ date, items: [...] }] } }` —
 * `unwrapArray` picks the `calendar` array (first array-valued property),
 * then `flattenCalendar` walks day groups and emits one `CalendarEntry`
 * per item with the parent `date` injected. Callers get a flat list.
 */
export async function listCalendar(
  params: ListCalendarParams,
): Promise<CalendarEntry[]> {
  const res = await axiosService.get<Envelope<unknown>>(
    "/api/trainerize/me/calendar",
    { params },
  );
  const dayGroups = unwrapArray<unknown>(res.data);
  return flattenCalendar(dayGroups);
}
