import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, type Envelope } from "./_envelope";
import type {
  CreateGoalPayload,
  CreateGoalResult,
  DeleteGoalPayload,
  Goal,
  GoalDetailParams,
  ListGoalsParams,
  ListGoalsResult,
  UpdateGoalPayload,
  UpdateGoalProgressPayload,
  UpdateGoalProgressResult,
  UpdateGoalResult,
} from "@/types/trainerize/goals_types";

/**
 * Trainerize goals — list / detail / add / set / progress / delete.
 * See `docs/trainerize/goals/` (README + per-endpoint docs).
 *
 * Notes:
 *  - Server resolves the linked Trainerize client ID; never send `userID`.
 *  - `listGoals` returns `{ total, goals[] }` — use `unwrap`, not
 *    `unwrapArray`, since the bare-array fallback would drop `total`.
 *  - `deleteGoal` uses a JSON request body (not query params), per the doc
 *    (`docs/trainerize/goals/goal-delete.md`).
 *  - PUT /goals (`updateGoal`) has a known doc gap — body has no `id` field
 *    (§1 in `goals_clarification.md`). The wire passthrough is exactly what
 *    the add payload looks like; the UI holds the Edit affordance until the
 *    backend clarifies how a specific goal is targeted on multi-goal users.
 */

const BASE = "/api/trainerize/me/goals";
const LIST = `${BASE}/list`;
const DETAIL = `${BASE}/detail`;
const PROGRESS = `${BASE}/progress`;

export async function listGoals(
  params: ListGoalsParams = {},
): Promise<ListGoalsResult> {
  // Coerce boolean → string per doc: "Query as `true` or `false` string".
  const query: Record<string, unknown> = { ...params };
  if (typeof params.achieved === "boolean") {
    query.achieved = String(params.achieved);
  }
  const res = await axiosService.get<Envelope<ListGoalsResult>>(LIST, {
    params: query,
  });
  const data = unwrap<ListGoalsResult | null>(res.data);
  if (!data) return { total: 0, goals: [] };
  if (Array.isArray(data as unknown)) {
    return {
      total: (data as unknown as unknown[]).length,
      goals: data as unknown as ListGoalsResult["goals"],
    };
  }
  return {
    total: typeof data.total === "number" ? data.total : (data.goals?.length ?? 0),
    goals: Array.isArray(data.goals) ? data.goals : [],
  };
}

export async function getGoalDetail(params: GoalDetailParams): Promise<Goal> {
  const query: Record<string, unknown> = { ...params };
  if (typeof params.achieved === "boolean") {
    query.achieved = String(params.achieved);
  }
  const res = await axiosService.get<Envelope<Goal>>(DETAIL, { params: query });
  return unwrap<Goal>(res.data);
}

export async function createGoal(
  payload: CreateGoalPayload,
): Promise<CreateGoalResult> {
  const res = await axiosService.post<Envelope<CreateGoalResult>>(BASE, payload);
  return unwrap<CreateGoalResult>(res.data);
}

export async function updateGoal(
  payload: UpdateGoalPayload,
): Promise<UpdateGoalResult> {
  const res = await axiosService.put<Envelope<UpdateGoalResult>>(BASE, payload);
  return unwrap<UpdateGoalResult>(res.data) ?? {};
}

export async function updateGoalProgress(
  payload: UpdateGoalProgressPayload,
): Promise<UpdateGoalProgressResult> {
  const res = await axiosService.put<Envelope<UpdateGoalProgressResult>>(
    PROGRESS,
    payload,
  );
  return unwrap<UpdateGoalProgressResult>(res.data) ?? {};
}

export async function deleteGoal(payload: DeleteGoalPayload): Promise<void> {
  // DELETE with JSON body per the doc.
  await axiosService.delete<Envelope<null>>(BASE, { data: payload });
}
