import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useReplyMessage } from "@/hooks/trainerize/useMessaging";
import {
  getThreadDisplayName,
  readMessageSentAt,
  readSenderId,
  type MessageThread,
  type ThreadMessage,
} from "@/types/trainerize/messaging_types";
import {
  formatMessageTime,
  groupMessagesByDay,
} from "@/views/patient/utils/messageHelpers";

/**
 * Conversation panel matching the mockup's `.convo` block.
 *
 *   .convo-head:     padding 14 22, bottom border, gap 12, avatar 40
 *   .convo-head .nm: 15 / 700
 *   .convo-head .st: 12 / 600 / green + ::before 7x7 green dot
 *   .pager:          26x26 buttons
 *   .thread-list:    flex column gap 18, scrollable, padding 22 26 8
 *   .day-sep:        center-aligned line with mono 11 / .8px / muted-2
 *   .msg.in:         left-aligned, gray bubble, 5px notched bottom-left
 *   .msg.out:        right-aligned, dark bubble, white text,
 *                    5px notched bottom-right
 *   .bubble:         11/15 padding, 16 radius, fs 14 / 1.5
 *   .composer:       border-top, padding 14 18, textarea max-h 120,
 *                    red Send pill 12 20
 */
export default function MessengerConvoPanel({
  thread,
  threadId,
  messages,
  selfId,
  isLoading,
  isError,
  start,
  pageSize,
  onPrev,
  onNext,
  showing,
  trainerName,
  trainerInitials,
}: {
  thread: MessageThread | undefined;
  threadId: number | undefined;
  messages: ThreadMessage[];
  selfId: number | undefined;
  isLoading: boolean;
  isError: boolean;
  start: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
  showing: string;
  trainerName?: string;
  trainerInitials?: string;
}) {
  const displayName =
    thread
      ? getThreadDisplayName(thread, selfId)
      : trainerName ?? "Trainer";
  const initials = pickInitials(displayName, trainerInitials);

  return (
    <section
      className="apex-card flex flex-col overflow-hidden relative"
      style={{ borderRadius: 18 }}
    >
      {/* Convo head */}
      <header
        className="flex items-center gap-3"
        style={{
          padding: "14px 22px",
          borderBottom: "1px solid var(--line-2)",
        }}
      >
        <div
          className="rounded-full grid place-items-center text-white shrink-0"
          style={{
            width: 40,
            height: 40,
            background: "var(--apex-accent-bright)",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="m-0 truncate" style={{ fontSize: 15, fontWeight: 700 }}>
            {displayName}
          </p>
          {/* Online status hidden — Trainerize doesn't expose presence.
          <p
            className="m-0 flex items-center gap-1.5"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--opt)" }}
          >
            <span
              className="rounded-full"
              style={{ width: 7, height: 7, background: "var(--opt)" }}
            />
            Online
          </p>
          */}
        </div>
        <div className="flex items-center gap-2">
          {showing && (
            <span
              className="font-mono whitespace-nowrap"
              style={{ fontSize: 12, color: "var(--ink-3)" }}
            >
              Showing {showing}
            </span>
          )}
          <PagerButton onClick={onPrev} disabled={start === 0} aria-label="Newer page">
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
          </PagerButton>
          <PagerButton
            onClick={onNext}
            disabled={messages.length < pageSize}
            aria-label="Older page"
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </PagerButton>
        </div>
      </header>

      {/* Thread list */}
      <ThreadList
        threadId={threadId}
        messages={messages}
        selfId={selfId}
        isLoading={isLoading}
        isError={isError}
        trainerInitials={initials}
      />

      {/* Composer */}
      {threadId !== undefined && <Composer threadId={threadId} />}
    </section>
  );
}

// ─── Thread list ─────────────────────────────────────────────────────────

function ThreadList({
  threadId,
  messages,
  selfId,
  isLoading,
  isError,
  trainerInitials,
}: {
  threadId: number | undefined;
  messages: ThreadMessage[];
  selfId: number | undefined;
  isLoading: boolean;
  isError: boolean;
  trainerInitials: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastId = messages[messages.length - 1]?.id;

  // Pin to bottom whenever the list changes — see TrainerChat double-pass
  // rationale (rAF + timeout to catch late-loaded avatars / images).
  useEffect(() => {
    if (messages.length === 0) return;
    const pin = () => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    };
    const r = requestAnimationFrame(pin);
    const t = setTimeout(pin, 50);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [threadId, lastId, messages.length]);

  if (threadId === undefined) {
    return (
      <div
        className="flex-1 grid place-items-center text-center"
        style={{ padding: "60px 24px" }}
      >
        <div>
          <MessageSquare
            className="w-10 h-10 mx-auto mb-3 opacity-30"
            strokeWidth={1.5}
          />
          <p className="font-semibold mb-1">Select a conversation</p>
          <p className="text-sm" style={{ color: "var(--ink-3)" }}>
            Pick a thread from the inbox to start reading.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 grid place-items-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-mute" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex-1 p-4 text-sm"
        style={{ color: "var(--apex-accent-bright)" }}
      >
        Couldn&apos;t load messages.
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        className="flex-1 grid place-items-center text-center"
        style={{ padding: "60px 24px" }}
      >
        <div>
          <MessageSquare
            className="w-10 h-10 mx-auto mb-3 opacity-30"
            strokeWidth={1.5}
          />
          <p className="text-sm" style={{ color: "var(--ink-3)" }}>
            No messages in this thread yet — send the first one below.
          </p>
        </div>
      </div>
    );
  }

  const groups = groupMessagesByDay(messages);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto flex flex-col"
      style={{ gap: 18, padding: "22px 26px 8px" }}
    >
      {groups.map((g) => (
        <div key={g.key} className="flex flex-col" style={{ gap: 18 }}>
          <DaySeparator label={g.label} />
          {g.messages.map((m) => (
            <MessageBubble
              key={m.id ?? `${m.threadId}-${readMessageSentAt(m)}`}
              message={m}
              isSelf={readSenderId(m.sender) === selfId}
              trainerInitials={trainerInitials}
              selfInitials="Y"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center" style={{ gap: 14, margin: "6px 0 2px" }}>
      <span className="flex-1 h-px" style={{ background: "var(--line)" }} />
      <span
        className="uppercase"
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.8px",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </span>
      <span className="flex-1 h-px" style={{ background: "var(--line)" }} />
    </div>
  );
}

// ─── Message bubble ─────────────────────────────────────────────────────

function MessageBubble({
  message,
  isSelf,
  trainerInitials,
  selfInitials,
}: {
  message: ThreadMessage;
  isSelf: boolean;
  trainerInitials: string;
  selfInitials: string;
}) {
  const time = formatMessageTime(readMessageSentAt(message));
  const body = message.body ?? "";
  const initials = isSelf ? selfInitials : trainerInitials;
  const name = isSelf ? "You" : "Trainer";

  return (
    <div
      className="flex"
      style={{
        maxWidth: "74%",
        gap: 11,
        alignSelf: isSelf ? "flex-end" : "flex-start",
        flexDirection: isSelf ? "row-reverse" : "row",
        animation: "messengerRise 0.42s cubic-bezier(0.2, 0.7, 0.3, 1) both",
      }}
    >
      <div
        className="rounded-full grid place-items-center shrink-0"
        style={{
          width: 34,
          height: 34,
          fontWeight: 700,
          fontSize: 12.5,
          background: isSelf ? "var(--ink-2)" : "var(--line)",
          color: isSelf ? "#FFFFFF" : "var(--ink-2)",
        }}
      >
        {initials}
      </div>
      <div
        className="flex flex-col"
        style={{ gap: 5, alignItems: isSelf ? "flex-end" : "flex-start" }}
      >
        <div
          className="flex items-center"
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            gap: 8,
            flexDirection: isSelf ? "row-reverse" : "row",
          }}
        >
          <b style={{ color: "var(--ink-2)", fontWeight: 700 }}>{name}</b>
          {time && (
            <span className="font-mono" style={{ color: "var(--ink-3)" }}>
              {time}
            </span>
          )}
        </div>
        <div
          style={{
            padding: "11px 15px",
            borderRadius: 16,
            fontSize: 14,
            lineHeight: 1.5,
            background: isSelf ? "var(--ink-2)" : "#ECEEF0",
            color: isSelf ? "#FFFFFF" : "var(--ink)",
            borderBottomLeftRadius: isSelf ? 16 : 5,
            borderBottomRightRadius: isSelf ? 5 : 16,
            width: "fit-content",
            maxWidth: "100%",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {body || "—"}
        </div>
      </div>
      <style>{`
        @keyframes messengerRise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

// ─── Composer ────────────────────────────────────────────────────────────

function Composer({ threadId }: { threadId: number }) {
  const [body, setBody] = useState("");
  const reply = useReplyMessage();
  const ref = useRef<HTMLTextAreaElement | null>(null);

  // Reset on thread switch.
  useEffect(() => {
    setBody("");
  }, [threadId]);

  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed || reply.isPending) return;
    try {
      await reply.mutateAsync({ threadId, body: trimmed, type: "text" });
      setBody("");
      ref.current?.focus();
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Couldn't send reply",
        description:
          (err as { message?: string })?.message ?? "Try again in a moment.",
      });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void send();
    }
  };

  // Auto-grow textarea height as content grows, capped at 120.
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div
      className="flex items-end bg-card"
      style={{
        borderTop: "1px solid var(--line-2)",
        padding: "14px 18px",
        gap: 12,
      }}
    >
      <textarea
        ref={ref}
        value={body}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Type a reply…  (⌘/Ctrl+Enter to send)"
        rows={1}
        className="flex-1 focus:outline-none resize-none"
        style={{
          border: "1px solid var(--line)",
          borderRadius: 14,
          padding: "12px 15px",
          fontSize: 14,
          color: "var(--ink)",
          lineHeight: 1.45,
          maxHeight: 120,
          minHeight: 46,
        }}
        disabled={reply.isPending}
      />
      <button
        type="button"
        onClick={() => void send()}
        disabled={reply.isPending || !body.trim()}
        className="inline-flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
        style={{
          background: "var(--apex-accent-bright)",
          color: "#FFFFFF",
          padding: "12px 20px",
          borderRadius: 14,
          border: "none",
          fontWeight: 600,
          fontSize: 14,
          cursor: reply.isPending || !body.trim() ? "not-allowed" : "pointer",
        }}
      >
        {reply.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" strokeWidth={2} />
        )}
        Send
      </button>
    </div>
  );
}

// ─── Bits ────────────────────────────────────────────────────────────────

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

function pickInitials(name: string, fallback?: string): string {
  if (fallback && fallback.trim()) return fallback.trim().slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((p) => p[0] ?? "").join("");
  return initials.toUpperCase() || "T";
}
