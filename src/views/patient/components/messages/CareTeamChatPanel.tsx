import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { format, isToday } from "date-fns";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCareTeamMessages } from "@/hooks/healthie/useCareTeamMessages";
import type { CareTeamMessage } from "@/types/healthie/messages_types";

/**
 * The patient's conversation with their care team, in the same look as the old case chat.
 *
 * Doctors answer in Healthie; their messages arrive here by polling (there is no live push).
 * Message text can carry basic HTML from Healthie, so it is flattened to plain text — never
 * inserted as markup.
 */

/** Plain text from Healthie's message HTML: block tags become line breaks, the rest is dropped. */
function toPlainText(content: string): string {
  if (!/[<&]/.test(content)) return content;
  const withBreaks = content.replace(/<\s*(br|\/p|\/div|\/li)\s*\/?>/gi, "\n");
  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return isToday(d) ? format(d, "h:mm a") : format(d, "MMM d, h:mm a");
}

type Shown = CareTeamMessage & { sending?: boolean };

function Bubble({ message }: { message: Shown }) {
  if (!message.author) {
    return (
      <p className="text-center text-[12px] text-muted-foreground">{toPlainText(message.content)}</p>
    );
  }
  const mine = message.author.isPatient;
  return (
    <div className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2 text-[12px]">
        <span className="font-medium text-foreground">{mine ? "You" : message.author.name}</span>
        {!mine && <span style={{ color: "var(--opt)" }}>(Care team)</span>}
        <span className="font-mono text-[11px] text-muted-foreground">
          {message.sending ? "Sending…" : timeLabel(message.createdAt)}
        </span>
      </div>
      <div
        className={`max-w-[80%] rounded-[14px] px-4 py-2 ${
          mine ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-foreground"
        } ${message.sending ? "opacity-70" : ""}`}
      >
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{toPlainText(message.content) || "—"}</p>
      </div>
    </div>
  );
}

export default function CareTeamChatPanel({ title = "Messages with your care team" }: { title?: string }) {
  const { thread, messages, isLoading, isError, send } = useCareTeamMessages();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Shown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Drop a "Sending…" bubble once the real one has come back from Healthie.
  useEffect(() => {
    if (pending.length === 0) return;
    setPending((prev) =>
      prev.filter(
        (p) => !messages.some((m) => m.author?.isPatient && m.content.trim() === p.content.trim()),
      ),
    );
  }, [messages, pending.length]);

  const shown: Shown[] = [...messages, ...pending];

  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [shown.length]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || send.isPending) return;
    setError(null);
    const optimistic: Shown = {
      id: `sending-${Date.now()}`,
      content: text,
      createdAt: new Date().toISOString(),
      author: { id: "me", name: "You", isPatient: true },
      sending: true,
    };
    setDraft("");
    setPending((prev) => [...prev, optimistic]);
    try {
      await send.mutateAsync(text);
    } catch (err) {
      setPending((prev) => prev.filter((p) => p.id !== optimistic.id));
      setDraft(text);
      const e2 = err as { details?: { message?: string }; message?: string };
      setError(e2?.details?.message || "Your message couldn't be sent. Please try again.");
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.closest("form")?.requestSubmit();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <MessageSquare className="w-5 h-5" /> {title}
        </CardTitle>
        <p className="text-[12px] text-muted-foreground">
          <span className="font-mono">{messages.length}</span> {messages.length === 1 ? "message" : "messages"}
          {" · "}Your care team usually replies within one business day.
        </p>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={scrollRef}
          className="max-h-[55vh] min-h-[180px] space-y-4 overflow-y-auto border-t border-border bg-surface-2 px-4 py-4"
        >
          {isLoading ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : isError && shown.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-muted-foreground">
              Messages couldn&apos;t be loaded right now. They&apos;ll appear here shortly.
            </div>
          ) : shown.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-muted-foreground">
              {thread ? "No messages yet." : "No messages yet. Send your care team a message to start the conversation."}
            </div>
          ) : (
            shown.map((m) => <Bubble key={m.id} message={m} />)
          )}
        </div>

        {error && <div className="border-t border-border bg-red-50 px-4 py-2 text-[13px] text-red-700">{error}</div>}

        <form onSubmit={submit} className="flex items-end gap-2 border-t border-border bg-card p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={5000}
            placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
            className="min-h-[44px] max-h-[120px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            disabled={send.isPending}
          />
          <Button type="submit" disabled={!draft.trim() || send.isPending} className="h-11">
            <Send className="w-4 h-4" />
            {send.isPending ? "Sending..." : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
