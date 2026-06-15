// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Send,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import TrainerizeGate from "@/components/trainerize/TrainerizeGate";
import {
  useReplyMessage,
  useSendMessage,
  useThreadMessages,
  useThreads,
} from "@/hooks/trainerize/useMessaging";
import {
  useTrainerizeLink,
  useTrainerizeProfile,
} from "@/hooks/trainerize/useLinkage";
import {
  getThreadDisplayName,
  readMessageSentAt,
  readSenderId,
  readThreadId,
  readThreadPreview,
  readThreadUnreadCount,
  readThreadUpdatedAt,
} from "@/types/trainerize/messaging_types";

/**
 * Trainerize messaging — inbox / per-thread view with **send & reply**.
 * See `docs/trainerize/messages_client-apis.md`.
 *
 * Endpoints used (server resolves sender from the session — never sent here):
 *   GET  /me/message-threads
 *   GET  /me/message-threads/messages
 *   POST /me/messages/send
 *   POST /me/messages/reply
 *
 * `readThreadId` / `readMessageSentAt` / `readSenderId` are the doc-revision
 * aliases that paper over `threadID`↔`id`, `sentTime`↔`createdAt`, and
 * `sender.id`↔`sender.userID`.
 */

const THREADS_PAGE_SIZE = 20;
const MESSAGES_PAGE_SIZE = 50;

export default function TrainerChat() {
  return (
    <TrainerizeGate>
      <TrainerChatInner />
    </TrainerizeGate>
  );
}

function TrainerChatInner() {
  const link = useTrainerizeLink();
  const profile = useTrainerizeProfile();
  const trainerUserId = link.data?.trainerUserId ?? null;

  const [threadStart, setThreadStart] = useState(0);
  const threadsQuery = useThreads("inbox", threadStart, THREADS_PAGE_SIZE);
  const threads = threadsQuery.data ?? [];

  const [activeThreadId, setActiveThreadId] = useState<number | undefined>(undefined);
  const effectiveThreadId =
    activeThreadId ?? readThreadId(threads[0]);

  const [messageStart, setMessageStart] = useState(0);
  const messagesQuery = useThreadMessages(
    effectiveThreadId,
    messageStart,
    MESSAGES_PAGE_SIZE,
  );
  const messages = messagesQuery.data ?? [];

  const selfId = link.data?.trainerizeUserId;

  // New conversation dialog state
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6 pb-5 border-b-2 border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Trainer Messages
            </h1>
            <p className="text-sm text-muted-foreground">
              Conversations with your trainer
              {profile.data?.firstName ? ` (${profile.data.firstName}'s inbox)` : ""}.
            </p>
          </div>
          <Button
            onClick={() => setShowCompose(true)}
            disabled={!trainerUserId}
            className="gap-2"
            title={
              trainerUserId
                ? "Start a new conversation with your trainer"
                : "No trainer assigned yet — contact your admin to assign one."
            }
          >
            <Plus className="w-4 h-4" /> New conversation
          </Button>
        </div>
      </div>

      {/* Mobile: show either the list or the active thread, not both */}
      <div className="md:hidden">
        {effectiveThreadId && activeThreadId ? (
          <div className="space-y-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveThreadId(undefined)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to inbox
            </Button>
            <MessagesPane
              threadId={effectiveThreadId}
              messages={messages}
              isLoading={messagesQuery.isLoading}
              isError={messagesQuery.isError}
              start={messageStart}
              setStart={setMessageStart}
              selfId={selfId}
            />
          </div>
        ) : (
          <ThreadList
            threads={threads}
            activeId={effectiveThreadId}
            selfId={selfId}
            isLoading={threadsQuery.isLoading}
            isError={threadsQuery.isError}
            start={threadStart}
            setStart={setThreadStart}
            onSelect={(id) => {
              setActiveThreadId(id);
              setMessageStart(0);
            }}
          />
        )}
      </div>

      {/* Desktop two-pane */}
      <div className="hidden md:grid md:grid-cols-[340px_1fr] gap-6">
        <ThreadList
          threads={threads}
          activeId={effectiveThreadId}
          isLoading={threadsQuery.isLoading}
          isError={threadsQuery.isError}
          start={threadStart}
          setStart={setThreadStart}
          onSelect={(id) => {
            setActiveThreadId(id);
            setMessageStart(0);
          }}
        />
        <MessagesPane
          threadId={effectiveThreadId}
          messages={messages}
          isLoading={messagesQuery.isLoading}
          isError={messagesQuery.isError}
          start={messageStart}
          setStart={setMessageStart}
          selfId={selfId}
        />
      </div>

      {showCompose && (
        <ComposeDialog
          trainerUserId={trainerUserId as number}
          onClose={() => setShowCompose(false)}
          onSent={(newThreadID) => {
            setShowCompose(false);
            if (newThreadID) {
              setActiveThreadId(newThreadID);
              setMessageStart(0);
              setThreadStart(0);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Thread list ───────────────────────────────────────────────────────────

function ThreadList({
  threads,
  activeId,
  selfId,
  isLoading,
  isError,
  start,
  setStart,
  onSelect,
}: {
  threads: any[];
  activeId: number | undefined;
  selfId: number | undefined;
  isLoading: boolean;
  isError: boolean;
  start: number;
  setStart: (n: number) => void;
  onSelect: (id: number) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Inbox
          </p>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setStart(Math.max(0, start - THREADS_PAGE_SIZE))}
              disabled={start === 0}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setStart(start + THREADS_PAGE_SIZE)}
              disabled={threads.length < THREADS_PAGE_SIZE}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-4 text-sm text-destructive">
            Couldn't load threads.
          </div>
        ) : threads.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {threads.map((t) => {
              const id = readThreadId(t);
              const displayName = getThreadDisplayName(t, selfId);
              const preview = readThreadPreview(t);
              const updatedAt = readThreadUpdatedAt(t);
              const unread = readThreadUnreadCount(t);
              return (
                <li key={id ?? displayName}>
                  <button
                    onClick={() => id && onSelect(id)}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                      id === activeId ? "bg-muted/70" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {preview || "—"}
                        </p>
                      </div>
                      {unread > 0 && (
                        <Badge
                          variant="default"
                          className="text-[10px] h-5 min-w-[1.25rem] flex items-center justify-center px-1"
                        >
                          {unread}
                        </Badge>
                      )}
                    </div>
                    {updatedAt && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {safeFormat(updatedAt, "MMM d, h:mm a")}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Messages pane (with reply composer) ───────────────────────────────────

function MessagesPane({
  threadId,
  messages,
  isLoading,
  isError,
  start,
  setStart,
  selfId,
}: {
  threadId: number | undefined;
  messages: any[];
  isLoading: boolean;
  isError: boolean;
  start: number;
  setStart: (n: number) => void;
  selfId: number | undefined;
}) {
  /**
   * Auto-scroll: pin the chat to the bottom whenever the message list
   * changes — on poll ticks that bring a new message, on send/reply
   * success (which triggers a cache refetch), on thread switch, and on
   * initial load. Uses raw `scrollTop = scrollHeight` because it's more
   * reliable cross-browser than `scrollIntoView` (which can no-op when
   * the parent's scrollHeight hasn't been recomputed yet).
   *
   * The double-pass (rAF + 50ms timeout) catches the case where bubbles
   * grow taller after the first measure — e.g. avatar images loading.
   */
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    if (messages.length === 0) return;
    const pin = () => {
      const el = scrollContainerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    };
    const rafId = requestAnimationFrame(pin);
    const timeoutId = setTimeout(pin, 50);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [threadId, lastMessageId, messages.length]);

  if (!threadId) {
    return (
      <Card>
        <CardContent className="py-20 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold mb-1">Select a thread</p>
          <p className="text-sm text-muted-foreground">
            Pick a conversation from the inbox to read its messages.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Messages
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {messages.length > 0 && (
              <span>
                Showing {start + 1}–{start + messages.length}
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setStart(Math.max(0, start - MESSAGES_PAGE_SIZE))}
              disabled={start === 0}
              aria-label="Newer page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => setStart(start + MESSAGES_PAGE_SIZE)}
              disabled={messages.length < MESSAGES_PAGE_SIZE}
              aria-label="Older page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-4 text-sm text-destructive">
            Couldn't load messages.
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No messages in this thread yet — send the first one below.
            </p>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="p-4 space-y-3 max-h-[60vh] overflow-y-auto"
          >
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isSelf={readSenderId(m.sender) === selfId}
              />
            ))}
          </div>
        )}

        {/* Reply composer */}
        <ReplyComposer threadId={threadId} />
      </CardContent>
    </Card>
  );
}

// ─── Reply composer ────────────────────────────────────────────────────────

function ReplyComposer({ threadId }: { threadId: number }) {
  const [body, setBody] = useState("");
  const reply = useReplyMessage();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset textarea when switching threads.
  useEffect(() => {
    setBody("");
  }, [threadId]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await reply.mutateAsync({ threadId, body: trimmed, type: "text" });
      setBody("");
      textareaRef.current?.focus();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Couldn't send reply",
        description: err?.message ?? "Try again in a moment.",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter sends. Plain Enter keeps inserting a newline.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a reply… (⌘/Ctrl+Enter to send)"
          rows={2}
          className="resize-none flex-1 min-h-[60px]"
          disabled={reply.isPending}
        />
        <Button
          onClick={() => void handleSend()}
          disabled={reply.isPending || !body.trim()}
          className="gap-2 shrink-0"
        >
          {reply.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send
        </Button>
      </div>
    </div>
  );
}

// ─── New conversation dialog ───────────────────────────────────────────────

function ComposeDialog({
  trainerUserId,
  onClose,
  onSent,
}: {
  trainerUserId: number;
  onClose: () => void;
  onSent: (newThreadID: number | undefined) => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const send = useSendMessage();

  const handleSend = async () => {
    setError("");
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (!trimmedSubject) {
      setError("Add a subject before sending.");
      return;
    }
    if (!trimmedBody) {
      setError("Write a message before sending.");
      return;
    }
    try {
      const result = await send.mutateAsync({
        recipients: [trainerUserId],
        subject: trimmedSubject,
        body: trimmedBody,
        threadType: "mainThread",
        conversationType: "single",
        type: "text",
      });
      toast({ title: "Message sent", description: trimmedSubject });
      const newThreadId =
        result?.threadID ?? result?.threads?.[0]?.threadID;
      onSent(typeof newThreadId === "number" ? newThreadId : undefined);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't send. Try again in a moment.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Sending to your assigned trainer (user {trainerUserId}).
          </p>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="apex-eyebrow mb-1.5 block">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Question about my program"
              disabled={send.isPending}
            />
          </div>
          <div>
            <label className="apex-eyebrow mb-1.5 block">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi coach, …"
              rows={6}
              className="resize-none"
              disabled={send.isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={send.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSend()}
            disabled={send.isPending || !subject.trim() || !body.trim()}
            className="gap-2"
          >
            {send.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────

function MessageBubble({ message, isSelf }: { message: any; isSelf: boolean }) {
  const senderName =
    message.sender?.name || (isSelf ? "You" : "Trainer");
  const sentAt = readMessageSentAt(message);
  const initials = useMemo(() => {
    if (!senderName) return "?";
    const parts = String(senderName).trim().split(/\s+/);
    return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  }, [senderName]);

  return (
    <div className={`flex gap-3 ${isSelf ? "flex-row-reverse" : ""}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="text-xs">
          {initials.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[75%] ${isSelf ? "text-right" : ""}`}>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-semibold">{senderName}</span>
          {sentAt && (
            <span className="text-[10px] text-muted-foreground">
              {safeFormat(sentAt, "MMM d, h:mm a")}
            </span>
          )}
        </div>
        <div
          className={`inline-block p-3 rounded-lg text-sm whitespace-pre-wrap ${
            isSelf
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          {message.body || "—"}
        </div>
      </div>
    </div>
  );
}

function safeFormat(value: string, fmt: string): string {
  try {
    return format(parseISO(value), fmt);
  } catch {
    return value;
  }
}
