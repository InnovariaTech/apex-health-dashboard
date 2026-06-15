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

/**
 * Field naming varies — the older docs say `name`, the live response gives
 * `firstName`/`lastName`/`profileName` plus a participant `type`
 * ("trainer" | "client" | "admin"). All variants typed for tolerance.
 */
export interface MessageThreadParticipant {
  id?: number;
  userID?: number;
  userId?: number;
  /** Older doc shape. */
  name?: string;
  /** Live response. */
  firstName?: string;
  lastName?: string;
  profileName?: string;
  profileIconUrl?: string | null;
  /** "trainer" | "client" | "admin" | other. */
  type?: string;
  status?: string;
  userRole?: string;
  createdFrom?: string;
  [key: string]: unknown;
}

/**
 * Field naming varies between doc revisions. Live response uses:
 *   `threadID`, `subject`, `excerpt`, `lastSentTime`, `totalUnreadMessages`,
 *   `unread`, `ccUsers[]`, `threadType`, `archived`.
 * Older doc names (`id`, `lastMessage`, `updatedAt`, `unreadCount`,
 * `participants[]`) kept as fallbacks so the UI never silently drops.
 */
export interface MessageThread {
  id?: number;
  threadID?: number;
  subject?: string;
  /** Live: short preview snippet. */
  excerpt?: string;
  /** Older doc fallback. */
  lastMessage?: string;
  /** Live: ISO-ish string ("2026-06-12 10:04:19"). */
  lastSentTime?: string;
  /** Older doc fallback. */
  updatedAt?: string;
  /** Live: total unread count for the thread. */
  totalUnreadMessages?: number;
  /** Older doc fallback. */
  unreadCount?: number;
  /** Live: boolean "has anything unread". */
  unread?: boolean;
  /** Live: capitalized — yes really. */
  Status?: string;
  threadType?: string;
  archived?: boolean;
  /** Live: participants array. */
  ccUsers?: MessageThreadParticipant[];
  /** Older doc fallback. */
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

// ─── Thread display helpers ────────────────────────────────────────────────

/** Pull the canonical id off a participant — same alias chain as senders. */
export function readParticipantId(
  p: MessageThreadParticipant | undefined,
): number | undefined {
  if (!p) return undefined;
  return p.id ?? p.userID ?? p.userId;
}

/**
 * Display label for a participant — "First Last" if both exist, else
 * `profileName`, else `name`, else "Unknown". Used to derive the thread
 * row label (everyone-except-me, joined).
 */
export function formatParticipantName(
  p: MessageThreadParticipant | null | undefined,
): string {
  if (!p) return "Unknown";
  const first = typeof p.firstName === "string" ? p.firstName.trim() : "";
  const last = typeof p.lastName === "string" ? p.lastName.trim() : "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (typeof p.profileName === "string" && p.profileName) return p.profileName;
  if (typeof p.name === "string" && p.name) return p.name;
  return "Unknown";
}

/** Live = `ccUsers`, older docs = `participants`. */
export function getThreadParticipants(
  thread: MessageThread | null | undefined,
): MessageThreadParticipant[] {
  if (!thread) return [];
  if (Array.isArray(thread.ccUsers)) return thread.ccUsers;
  if (Array.isArray(thread.participants)) return thread.participants;
  return [];
}

/** Everyone in the thread other than the current user. */
export function getOtherParticipants(
  thread: MessageThread | null | undefined,
  selfId: number | undefined,
): MessageThreadParticipant[] {
  const all = getThreadParticipants(thread);
  if (typeof selfId !== "number") return all;
  return all.filter((p) => readParticipantId(p) !== selfId);
}

/**
 * Best label for a thread row — comma-joined names of the other parties,
 * with the thread subject as a fallback when nobody else is present (e.g.
 * a thread that ships with only the current user in `ccUsers`).
 */
export function getThreadDisplayName(
  thread: MessageThread | null | undefined,
  selfId: number | undefined,
): string {
  const others = getOtherParticipants(thread, selfId);
  if (others.length > 0) {
    return others.map(formatParticipantName).join(", ");
  }
  return (thread?.subject as string | undefined) || "Conversation";
}

/** Preview snippet — live `excerpt`, older `lastMessage`. */
export function readThreadPreview(
  thread: MessageThread | null | undefined,
): string | undefined {
  if (typeof thread?.excerpt === "string" && thread.excerpt) return thread.excerpt;
  if (typeof thread?.lastMessage === "string" && thread.lastMessage)
    return thread.lastMessage;
  return undefined;
}

/** Latest-activity timestamp — live `lastSentTime`, older `updatedAt`. */
export function readThreadUpdatedAt(
  thread: MessageThread | null | undefined,
): string | undefined {
  if (typeof thread?.lastSentTime === "string" && thread.lastSentTime)
    return thread.lastSentTime;
  if (typeof thread?.updatedAt === "string" && thread.updatedAt)
    return thread.updatedAt;
  return undefined;
}

/** Unread count — live `totalUnreadMessages`, older `unreadCount`. */
export function readThreadUnreadCount(
  thread: MessageThread | null | undefined,
): number {
  if (typeof thread?.totalUnreadMessages === "number")
    return thread.totalUnreadMessages;
  if (typeof thread?.unreadCount === "number") return thread.unreadCount;
  return 0;
}
