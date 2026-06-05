import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  CreateHabitPayload,
  CreateHabitResult,
  DeleteDailyItemPayload,
  GetDailyItemParams,
  HabitDailyItem,
  ListHabitsParams,
  ListHabitsResult,
  TrackDailyItemPayload,
  TrackDailyItemResult,
} from "@/types/trainerize/habits_types";

/**
 * Trainerize habits — list, create, daily-item GET / PUT / DELETE.
 * See `docs/trainerize/habits-apis.md`.
 *
 * Notes:
 *  - Server resolves the linked client ID; never send `userID` / `clientUserId`.
 *  - DELETE uses a JSON request body (not query params), per the doc.
 *  - `listHabits` returns an object `{ total, habits[] }` — use `unwrap`, not
 *    `unwrapArray`, since the bare-array fallback would drop `total`.
 */

const BASE = "/api/trainerize/me/habits";
const DAILY_ITEMS = `${BASE}/daily-items`;

export async function listHabits(
  params: ListHabitsParams = {},
): Promise<ListHabitsResult> {
  const res = await axiosService.get<Envelope<ListHabitsResult>>(BASE, {
    params,
  });
  const data = unwrap<ListHabitsResult | null>(res.data);
  // Defensive fallback: some envelopes return just the array.
  if (!data) return { total: 0, habits: [] };
  if (Array.isArray((data as unknown))) {
    return { total: (data as unknown as unknown[]).length, habits: data as unknown as ListHabitsResult["habits"] };
  }
  return {
    total: typeof data.total === "number" ? data.total : (data.habits?.length ?? 0),
    habits: Array.isArray(data.habits) ? data.habits : [],
  };
}

export async function createHabit(
  payload: CreateHabitPayload,
): Promise<CreateHabitResult> {
  const res = await axiosService.post<Envelope<CreateHabitResult>>(BASE, payload);
  return unwrap<CreateHabitResult>(res.data);
}

export async function getDailyItem(
  params: GetDailyItemParams,
): Promise<HabitDailyItem> {
  const res = await axiosService.get<Envelope<HabitDailyItem>>(DAILY_ITEMS, {
    params,
  });
  return unwrap<HabitDailyItem>(res.data);
}

export async function trackDailyItem(
  payload: TrackDailyItemPayload,
): Promise<TrackDailyItemResult> {
  const body = { status: "tracked", ...payload };
  const res = await axiosService.put<Envelope<TrackDailyItemResult>>(
    DAILY_ITEMS,
    body,
  );
  return unwrap<TrackDailyItemResult>(res.data) ?? {};
}

export async function deleteDailyItem(
  payload: DeleteDailyItemPayload,
): Promise<void> {
  // DELETE with JSON body per the doc.
  await axiosService.delete<Envelope<null>>(DAILY_ITEMS, { data: payload });
}
