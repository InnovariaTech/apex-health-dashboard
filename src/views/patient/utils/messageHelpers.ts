import { format, isToday, isYesterday, parseISO } from "date-fns";
import {
  readMessageSentAt,
  type ThreadMessage,
} from "@/types/trainerize/messaging_types";

/**
 * Group an ordered (oldest → newest) message list into day buckets so the
 * conversation panel can drop a "Mon, Jun 15" separator between them.
 *
 * The grouping key is the local-day date string of the message's sent
 * timestamp. Messages without a parseable sent time fall into a single
 * "Earlier" bucket at the front.
 */
export interface MessageDayGroup {
  /** YYYY-MM-DD or `"unknown"`. */
  key: string;
  /** Display label — "Today", "Yesterday", or `"Mon, Jun 15"`. */
  label: string;
  messages: ThreadMessage[];
}

export function groupMessagesByDay(
  messages: ThreadMessage[],
): MessageDayGroup[] {
  const groups: MessageDayGroup[] = [];
  let current: MessageDayGroup | null = null;

  for (const message of messages) {
    const iso = readMessageSentAt(message);
    const key = iso ? safeDayKey(iso) : "unknown";

    if (!current || current.key !== key) {
      current = {
        key,
        label: iso ? safeDayLabel(iso) : "Earlier",
        messages: [],
      };
      groups.push(current);
    }
    current.messages.push(message);
  }

  return groups;
}

function safeDayKey(iso: string): string {
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return "unknown";
  }
}

function safeDayLabel(iso: string): string {
  try {
    const d = parseISO(iso);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEE, MMM d");
  } catch {
    return "Earlier";
  }
}

/** Compact bubble timestamp ("8:42 AM"). */
export function formatMessageTime(iso: string | undefined): string {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "h:mm a");
  } catch {
    return "";
  }
}
