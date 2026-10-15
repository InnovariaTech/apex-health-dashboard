import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useCareTeamMessages } from "@/hooks/healthie/useCareTeamMessages";
import { Initials } from "@/views/patient/components/treatments/CaseBits";
import type { CareTeamMessage } from "@/types/healthie/messages_types";

/**
 * The care-team conversation in the "My cases" design: day separators, avatars, bubbles, and a
 * compose box. One conversation per patient today, so every treatment shows the same thread.
 * No attachments or typing indicator — the messages API carries text only and has no live push.
 */

function toPlainText(content: string): string {
  if (!/[<&]/.test(content)) return content;
  const withBreaks = content.replace(/<\s*(br|\/p|\/div|\/li)\s*\/?>/gi, "\n");
  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

const dayLabel = (d: Date) =>
  isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "EEEE, MMM d");

type Shown = CareTeamMessage & { sending?: boolean };

export default function CaseConversation() {
  const { messages, isLoading, isError, send } = useCareTeamMessages();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Shown[]>([]);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pending.length === 0) return;
    setPending((prev) =>
      prev.filter((p) => !messages.some((m) => m.author?.isPatient && m.content.trim() === p.content.trim())),
    );
  }, [messages, pending.length]);

  const shown: Shown[] = [...messages, ...pending];
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown.length]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
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
    setPending((p) => [...p, optimistic]);
    try {
      await send.mutateAsync(text);
    } catch (err) {
      setPending((p) => p.filter((x) => x.id !== optimistic.id));
      setDraft(text);
      const e2 = err as { details?: { message?: string } };
      setError(e2?.details?.message || "Your message couldn't be sent. Please try again.");
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  let lastDay = "";
  return (
    <div className="apex-card flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-[22px] pt-[18px]">
        <span
          className="grid h-[34px] w-[34px] place-items-center rounded-[9px]"
          style={{ background: "var(--apex-accent-soft)", color: "var(--apex-accent-bright)" }}
        >
          <MessageSquare className="w-4 h-4" />
        </span>
        <h4 className="text-[14.5px] font-bold text-foreground">Conversation</h4>
        <span className="ml-auto rounded-full bg-[var(--surface-2)] px-2 py-1 font-mono text-[11px] font-semibold leading-[1.2] text-ink-2">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </span>
      </div>

      <div ref={threadRef} className="flex max-h-[560px] min-h-[260px] flex-col gap-3 overflow-y-auto px-[22px] py-[18px]">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-ink-2">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : isError && shown.length === 0 ? (
          <p className="m-auto text-center text-[13px] text-ink-2">Messages couldn&apos;t be loaded right now.</p>
        ) : shown.length === 0 ? (
          <div className="m-auto max-w-xs text-center">
            <MessageSquare className="mx-auto w-8 h-8 text-ink-2/60" />
            <p className="mt-2 font-semibold text-foreground">No messages yet</p>
            <p className="text-[13px] text-ink-2">Your care team will reply here. You can add details any time.</p>
          </div>
        ) : (
          shown.map((m) => {
            const d = new Date(m.createdAt);
            const key = Number.isNaN(d.getTime()) ? "" : d.toDateString();
            const sep =
              key && key !== lastDay ? (
                <div className="my-1 flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--mute)]">
                  <span className="h-px flex-1 bg-border" />
                  {dayLabel(d)}
                  <span className="h-px flex-1 bg-border" />
                </div>
              ) : null;
            if (key) lastDay = key;
            const when = m.sending ? "Sending…" : Number.isNaN(d.getTime()) ? "" : format(d, "h:mm a");
            const text = toPlainText(m.content) || "—";

            if (!m.author) {
              return (
                <Fragment key={m.id}>
                  {sep}
                  <p className="text-center text-[12px] text-ink-2">{text}</p>
                </Fragment>
              );
            }
            if (m.author.isPatient) {
              return (
                <Fragment key={m.id}>
                  {sep}
                  <div
                    className={`ml-auto max-w-[78%] rounded-[14px] rounded-br-[4px] px-3.5 py-[11px] text-[13.5px] leading-[1.55] text-white ${m.sending ? "opacity-70" : ""}`}
                    style={{ background: "var(--apex-accent-bright)" }}
                  >
                    <p className="whitespace-pre-wrap">{text}</p>
                    <span className="mt-1 block font-mono text-[10.5px] opacity-60">{when}</span>
                  </div>
                </Fragment>
              );
            }
            return (
              <Fragment key={m.id}>
                {sep}
                <div className="flex max-w-[86%] items-end gap-2.5">
                  <Initials name={m.author.name} />
                  <div className="rounded-[14px] rounded-bl-[4px] bg-[var(--surface-2)] px-3.5 py-[11px] text-[13.5px] leading-[1.55] text-foreground">
                    <span className="mb-[3px] block text-[11px] font-semibold opacity-70">
                      {m.author.name}
                    </span>
                    <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
                    <span className="mt-1 block font-mono text-[10.5px] opacity-60">{when}</span>
                  </div>
                </div>
              </Fragment>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="border-t border-border bg-card px-[22px] pt-4 pb-[18px]">
        {error && <p className="mb-2 text-[12.5px] text-red-600">{error}</p>}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          maxLength={5000}
          placeholder="Write to your care team…"
          className="min-h-[72px] w-full resize-y rounded-[10px] border border-border bg-card px-3 py-2.5 text-[14px] outline-none transition focus:border-[var(--apex-accent-bright)] focus:shadow-[0_0_0_3px_var(--apex-accent-soft)]"
          disabled={send.isPending}
        />
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="hidden text-[11.5px] text-[var(--mute)] sm:inline">
            Replies within 1 business day · not for emergencies
          </span>
          <button
            type="submit"
            disabled={!draft.trim() || send.isPending}
            className="ml-auto inline-flex items-center gap-2 rounded-[10px] px-[15px] py-[9px] text-[13px] font-semibold text-white hover:brightness-[1.08] disabled:opacity-50"
            style={{ background: "var(--apex-accent-bright)" }}
          >
            <Send className="w-4 h-4" /> {send.isPending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
