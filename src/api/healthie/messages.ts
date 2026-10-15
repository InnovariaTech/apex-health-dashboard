import { axiosService } from "@/api/http/axiosInstance";
import type { CareTeamMessage, MessageThreadList } from "@/types/healthie/messages_types";

/** Messages with the care team. Read live from Healthie by the backend — nothing is cached there. */

const BASE = "/api/patient/messages";

function unwrap<T>(body: unknown): T {
  return (body as { data: T }).data;
}

export async function listMessageThreads(): Promise<MessageThreadList> {
  const res = await axiosService.get(BASE);
  return unwrap<MessageThreadList>(res.data);
}

/** Newest first. No paging cursor yet, so the newest 100 is all that can be read. */
export async function getThreadMessages(threadId: string): Promise<CareTeamMessage[]> {
  const res = await axiosService.get(`${BASE}/${encodeURIComponent(threadId)}`, { params: { pageSize: 100 } });
  return unwrap<{ messages: CareTeamMessage[] }>(res.data).messages ?? [];
}

/** The first message: creates the care-team thread. The reply carries no thread id — re-list. */
export async function sendFirstMessage(content: string): Promise<CareTeamMessage> {
  const res = await axiosService.post(BASE, { content });
  return unwrap<CareTeamMessage>(res.data);
}

export async function replyToThread(threadId: string, content: string): Promise<CareTeamMessage> {
  const res = await axiosService.post(`${BASE}/${encodeURIComponent(threadId)}`, { content });
  return unwrap<CareTeamMessage>(res.data);
}

export async function markThreadRead(threadId: string): Promise<void> {
  await axiosService.post(`${BASE}/${encodeURIComponent(threadId)}/read`, {});
}
