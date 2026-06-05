import { axiosService } from "@/api/http/axiosInstance";
import { unwrap, unwrapArray, type Envelope } from "./_envelope";
import type {
  MessageThread,
  ListThreadsParams,
  ThreadMessage,
  ListThreadMessagesParams,
  GetMessageParams,
  MessageDetail,
  SendMessagePayload,
  SendMessageResult,
  ReplyMessagePayload,
  ReplyMessageResult,
} from "@/types/trainerize/messaging_types";

/**
 * Trainerize messaging — list/detail + send/reply.
 * See `docs/trainerize/messages_client-apis.md`.
 *
 * - `unwrapArray` is defensive: the upstream wraps arrays inside an object
 *   sometimes, and we don't want a runtime `.map` crash.
 * - Server resolves sender / owner from the session — never send IDs.
 */

const BASE = "/api/trainerize/me/message-threads";
const MESSAGES_BASE = "/api/trainerize/me/messages";

export async function listThreads(
  params: ListThreadsParams,
): Promise<MessageThread[]> {
  const res = await axiosService.get<Envelope<MessageThread[]>>(BASE, {
    params,
  });
  return unwrapArray<MessageThread>(res.data);
}

export async function listThreadMessages(
  params: ListThreadMessagesParams,
): Promise<ThreadMessage[]> {
  const res = await axiosService.get<Envelope<ThreadMessage[]>>(
    `${BASE}/messages`,
    { params },
  );
  return unwrapArray<ThreadMessage>(res.data);
}

/**
 * `GET /me/messages?messageId=…` — full detail. Body comes back HTML-encoded
 * per the doc, so any renderer must decode or sanitize before displaying as
 * HTML. Plain-text fallback works in most contexts.
 */
export async function getMessage(
  params: GetMessageParams,
): Promise<MessageDetail | null> {
  const res = await axiosService.get<Envelope<MessageDetail>>(MESSAGES_BASE, {
    params,
  });
  const data = unwrap<MessageDetail | null>(res.data);
  return data ?? null;
}

/**
 * `POST /me/messages/send` — start a new thread. Status: 201.
 * `recipients` must be a non-empty array of Trainerize user IDs.
 */
export async function sendMessage(
  payload: SendMessagePayload,
): Promise<SendMessageResult> {
  const res = await axiosService.post<Envelope<SendMessageResult>>(
    `${MESSAGES_BASE}/send`,
    payload,
  );
  return unwrap<SendMessageResult>(res.data) ?? {};
}

/** `POST /me/messages/reply` — reply in an existing thread. Status: 200. */
export async function replyMessage(
  payload: ReplyMessagePayload,
): Promise<ReplyMessageResult> {
  const res = await axiosService.post<Envelope<ReplyMessageResult>>(
    `${MESSAGES_BASE}/reply`,
    payload,
  );
  return unwrap<ReplyMessageResult>(res.data) ?? {};
}
