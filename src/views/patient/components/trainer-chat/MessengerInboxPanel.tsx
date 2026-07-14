import { ChevronLeft, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import {
  getThreadDisplayName,
  readThreadId,
  readThreadPreview,
  readThreadUnreadCount,
  readThreadUpdatedAt,
  type MessageThread,
} from "@/types/trainerize/messaging_types";
import { format, parseISO } from "date-fns";

/**
 * Inbox panel matching the New Ui `6 Trainer Messages` mockup's
 * `.inbox-panel`. Single source of truth for layout tokens:
 *
 *   .panel:        border 1px line, radius 18, soft shadow, white bg
 *   .panel-head:   ttl mono 11px / .14em / muted-2 + pager buttons 26x26
 *   .thread:       padding 15 18, left-border 3px transparent → red on .active
 *   .thread.active: bg #fbf2f2 (soft pink) + red left border
 *   .thread-name:  14 / 700 with optional .tag pill
 *   .tag:          9.5 / 700 / .6px / ink bg / white text
 *   .thread-time:  mono 11 / muted-2
 *   .thread-prev:  12.5 / muted / single-line ellipsis
 *   .unread-dot:   8x8 round / accent
 */
export default function MessengerInboxPanel({
  threads,
  activeId,
  selfId,
  isLoading,
  isError,
  start,
  pageSize,
  onSelect,
  onPrev,
  onNext,
}: {
  threads: MessageThread[];
  activeId: number | undefined;
  selfId: number | undefined;
  isLoading: boolean;
  isError: boolean;
  start: number;
  pageSize: number;
  onSelect: (id: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <section
      className="inbox-panel apex-card flex flex-col overflow-hidden"
      style={{ borderRadius: 18 }}
    >
      {/* Panel head */}
      <header
        className="flex items-center justify-between"
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid var(--line-2)",
        }}
      >
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "var(--ink-3)",
          }}
        >
          Inbox
        </span>
        <div className="flex items-center gap-1.5">
          <PagerButton
            onClick={onPrev}
            disabled={start === 0}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
          </PagerButton>
          <PagerButton
            onClick={onNext}
            disabled={threads.length < pageSize}
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </PagerButton>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-mute" />
          </div>
        ) : isError ? (
          <div
            className="p-4 text-sm"
            style={{ color: "var(--apex-accent-bright)" }}
          >
            Couldn&apos;t load threads.
          </div>
        ) : threads.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare
              className="w-10 h-10 mx-auto mb-2 opacity-30"
              strokeWidth={1.5}
            />
            <p className="text-sm" style={{ color: "var(--ink-3)" }}>
              No messages yet.
            </p>
          </div>
        ) : (
          <ul className="m-0 p-0 list-none">
            {threads.map((t) => {
              const id = readThreadId(t);
              const displayName = getThreadDisplayName(t, selfId);
              const preview = readThreadPreview(t);
              const updatedAt = readThreadUpdatedAt(t);
              const unread = readThreadUnreadCount(t);
              const isActive = id === activeId;
              const tag = pickTag(t);
              return (
                <li key={id ?? displayName}>
                  <button
                    type="button"
                    onClick={() => id && onSelect(id)}
                    className="w-full text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    style={{
                      padding: "15px 18px",
                      borderBottom: "1px solid var(--line-2)",
                      borderLeft: `3px solid ${isActive ? "var(--apex-accent-bright)" : "transparent"}`,
                      background: isActive ? "#fbf2f2" : "transparent",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="flex items-center gap-1.5 truncate"
                        style={{ fontSize: 14, fontWeight: 700 }}
                      >
                        <span className="truncate">{displayName}</span>
                        {tag && (
                          <span
                            className="font-mono uppercase"
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              letterSpacing: "0.6px",
                              background: "var(--ink)",
                              color: "#FFFFFF",
                              padding: "2px 7px",
                              borderRadius: 100,
                            }}
                          >
                            {tag}
                          </span>
                        )}
                        {unread > 0 && (
                          <span
                            className="rounded-full shrink-0"
                            style={{
                              width: 8,
                              height: 8,
                              background: "var(--apex-accent-bright)",
                            }}
                            aria-label={`${unread} unread`}
                          />
                        )}
                      </span>
                      {updatedAt && (
                        <span
                          className="font-mono whitespace-nowrap"
                          style={{ fontSize: 11, color: "var(--ink-3)" }}
                        >
                          {formatInboxTime(updatedAt)}
                        </span>
                      )}
                    </div>
                    <span
                      className="truncate"
                      style={{ fontSize: 12.5, color: "var(--ink-3)" }}
                    >
                      {preview || "—"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function PagerButton({
  onClick,
  disabled,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid place-items-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        width: 26,
        height: 26,
        borderRadius: 8,
        border: "1px solid var(--line)",
        background: "#FFFFFF",
        color: "var(--ink-2)",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Best-effort tag derived from the thread row — Trainerize-shipped tags
 *  rarely appear; fall back to "Trainer" for the trainer's own thread. */
function pickTag(thread: MessageThread): string | null {
  const tag = (thread as { tag?: string }).tag;
  if (typeof tag === "string" && tag.trim()) return tag.trim();
  return null;
}

/**
 * Format inbox time: same-day → "5:15 PM"; this calendar year → "Jun 15";
 * else → "Jun 15, 2025".
 */
function formatInboxTime(iso: string): string {
  try {
    const d = parseISO(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) return format(d, "h:mm a");
    if (d.getFullYear() === now.getFullYear()) return format(d, "MMM d");
    return format(d, "MMM d, yyyy");
  } catch {
    return "";
  }
}
