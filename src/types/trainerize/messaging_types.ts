/**
 * Trainerize messaging — threads, messages, send, reply, single-message detail.
 * See:
 *   - `docs/trainerize/client-apis.md` Phase 3 (legacy doc, read-only)
 *   - `docs/trainerize/messages_client-apis.md` (current — adds send/reply/detail)
 *
 * The server injects sender / owner IDs from the linked Trainerize client —
 * never send `userID`, `senderUserId`, or `ownerUserId` from the frontend.
 */

export type ThreadView = "inbox" | string;

export interface MessageThreadParticipant {
  id?: number;
  userID?: number;
  userId?: number;
  name?: string;
  [key: string]: unknown;
}

/**
 * Field naming varies between doc revisions: the older doc used `id`, the
 * newer messages doc returns `threadID`. Both are typed; callers should read
 * `threadID ?? id`.
 */
export interface MessageThread {
  id?: number;
  threadID?: number;
  subject?: string;
  lastMessage?: string;
  updatedAt?: string;
  unreadCount?: number;
  participants?: MessageThreadParticipant[];
  [key: string]: unknown;
}

export interface ListThreadsParams {
  view: ThreadView;
  /** offset, start at 0 */
  start: number;
  /** page size */
  count: number;
}

/**
 * Same alias rules as threads: `sentTime` (newer doc) vs `createdAt` (older).
 * Sender may also expose `userID` instead of `id`.
 */
export interface MessageSender {
  id?: number;
  userID?: number;
  userId?: number;
  name?: string;
  [key: string]: unknown;
}

export interface ThreadMessage {
  id: number;
  threadId?: number;
  threadID?: number;
  body?: string;
  /** Newer doc: ISO timestamp under `sentTime`. */
  sentTime?: string;
  /** Older doc / some payloads: `createdAt`. */
  createdAt?: string;
  sender?: MessageSender;
  type?: "text" | "appear" | string;
  isRead?: boolean;
  [key: string]: unknown;
}

export interface ListThreadMessagesParams {
  threadId: number;
  start: number;
  count: number;
}

/**
 * Single-message detail. Body is HTML-encoded per the doc — render with care.
 * Nested objects are loosely typed because the doc only enumerates names, not
 * shapes.
 */
export interface MessageDetail extends ThreadMessage {
  attachment?: Record<string, unknown> | null;
  linkInfo?: Record<string, unknown> | null;
  productInfo?: Record<string, unknown> | null;
  workoutInfo?: Record<string, unknown> | null;
  reactions?: unknown[];
  appearRoom?: string | null;
}

export interface GetMessageParams {
  messageId: number;
}

/**
 * `POST /me/messages/send` — starts a new thread. The backend resolves the
 * sender from the session, so the frontend never sets owner / sender IDs.
 */
export interface SendMessagePayload {
  /** Trainerize user IDs (min length 1). */
  recipients: number[];
  subject: string;
  body: string;
  threadType?: "mainThread" | "otherThread";
  conversationType?: "single" | "group";
  type?: "text" | "appear";
  /** Required when `type === "appear"`. */
  appearRoom?: string;
}

export interface SendMessageResult {
  threadID?: number;
  threads?: Array<{ threadID?: number; messageID?: number }>;
  messageID?: number;
  [key: string]: unknown;
}

/** `POST /me/messages/reply` — replies in an existing thread. */
export interface ReplyMessagePayload {
  threadId: number;
  body: string;
  type?: "text" | "appear";
  appearRoom?: string;
}

export interface ReplyMessageResult {
  messageID?: number;
  linkInfo?: Record<string, unknown> | null;
  [key: string]: unknown;
}

/** Helpers — pull the canonical id out of either revision's payload. */
export function readThreadId(thread: MessageThread | null | undefined): number | undefined {
  if (!thread) return undefined;
  return thread.threadID ?? thread.id;
}

export function readMessageSentAt(message: ThreadMessage | null | undefined): string | undefined {
  if (!message) return undefined;
  return message.sentTime ?? message.createdAt;
}

export function readSenderId(sender: MessageSender | undefined): number | undefined {
  if (!sender) return undefined;
  return sender.id ?? sender.userID ?? sender.userId;
}
