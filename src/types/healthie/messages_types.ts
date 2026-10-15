/**
 * Messages with the care team, on our own Healthie account — `/api/patient/messages/*`.
 * See `Documents/healthie-ai-form-builder-docs/healthie/messages-api.md`. Ids are numeric strings.
 */

export interface MessageThread {
  id: string;
  name: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  /** This patient's own read state. */
  unread: boolean;
}

export interface MessageThreadList {
  threads: MessageThread[];
  unreadCount: number;
}

export interface CareTeamMessage {
  id: string;
  /** May carry basic HTML from Healthie — always shown as plain text. */
  content: string;
  createdAt: string;
  /** Null for a system message. */
  author: { id: string; name: string; isPatient: boolean } | null;
}
