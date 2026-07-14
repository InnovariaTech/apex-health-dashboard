// @ts-nocheck
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Plus,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  useSendMessage,
  useThreadMessages,
  useThreads,
} from "@/hooks/trainerize/useMessaging";
import {
  useTrainerizeLink,
  useTrainerizeProfile,
} from "@/hooks/trainerize/useLinkage";
import { readThreadId } from "@/types/trainerize/messaging_types";
import MessengerInboxPanel from "@/views/patient/components/trainer-chat/MessengerInboxPanel";
import MessengerConvoPanel from "@/views/patient/components/trainer-chat/MessengerConvoPanel";

/**
 * Trainerize messaging — patient ↔ trainer DMs, recomposed to mirror the
 * `New Ui/6 Trainer Messages` mockup.
 *
 * Layout:
 *   1. Page head — breadcrumb + "Trainer *messages*" title + subtitle +
 *      rounded red "New conversation" button
 *   2. Messenger grid — `316px 1fr` two-panel (mockup `.messenger`)
 *   3. Mobile — single column, inbox above conversation
 *
 * Data wiring is unchanged from the prior shadcn version (same hooks),
 * just the visual layer has been rebuilt to match the mockup tokens.
 *
 * See `docs/trainerize/messages_client-apis.md` — server resolves sender
 * from the session, never sent from the FE.
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

  const [activeThreadId, setActiveThreadId] = useState<number | undefined>(
    undefined,
  );
  const effectiveThreadId = activeThreadId ?? readThreadId(threads[0]);
  const activeThread = threads.find((t) => readThreadId(t) === effectiveThreadId);

  const [messageStart, setMessageStart] = useState(0);
  const messagesQuery = useThreadMessages(
    effectiveThreadId,
    messageStart,
    MESSAGES_PAGE_SIZE,
  );
  const messages = messagesQuery.data ?? [];

  const selfId = link.data?.trainerizeUserId;

  const [showCompose, setShowCompose] = useState(false);

  // Mobile flip — show convo when one was explicitly tapped; show inbox
  // otherwise. The desktop layout always shows both side-by-side.
  const [mobileShowConvo, setMobileShowConvo] = useState(false);
  useEffect(() => {
    if (activeThreadId !== undefined) setMobileShowConvo(true);
  }, [activeThreadId]);

  const trainerName = profile.data?.fullName ?? profile.data?.firstName ?? "";
  const showing =
    messages.length > 0
      ? `${messageStart + 1}–${messageStart + messages.length}`
      : "";

  return (
    <div className="p-4 md:p-9 max-w-[1280px] mx-auto bg-background text-foreground">
      {/* Page head */}
      <div
        className="mb-3"
        style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 500 }}
      >
        Apex Fit &nbsp;›&nbsp;{" "}
        <b style={{ color: "var(--ink-2)", fontWeight: 600 }}>
          Trainer Messages
        </b>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="apex-page-title">
            Trainer <em>messages</em>
          </h1>
          <p
            className="m-0 mt-2 flex items-center gap-1.5 flex-wrap"
            style={{ fontSize: 14, color: "var(--ink-3)" }}
          >
            <span>
              Conversations with your trainer
              {trainerName ? ` · ${trainerName}` : ""}
            </span>
          </p>
        </div>
        {/* New conversation button hidden for now.
        <button
          type="button"
          onClick={() => setShowCompose(true)}
          disabled={!trainerUserId}
          title={
            trainerUserId
              ? "Start a new conversation with your trainer"
              : "No trainer assigned yet — contact your admin"
          }
          className="inline-flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{
            background: "var(--apex-accent-bright)",
            color: "#FFFFFF",
            border: "none",
            fontWeight: 600,
            fontSize: 13.5,
            padding: "11px 18px",
            borderRadius: 100,
            boxShadow: "0 2px 10px rgba(225, 24, 22, 0.22)",
            cursor: trainerUserId ? "pointer" : "not-allowed",
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.2} />
          New conversation
        </button>
        */}
      </div>

      {/* Mobile — single column */}
      <div className="md:hidden mt-6">
        {effectiveThreadId !== undefined && mobileShowConvo ? (
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileShowConvo(false)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to inbox
            </Button>
            <div style={{ height: "calc(100vh - 240px)", minHeight: 500 }}>
              <MessengerConvoPanel
                thread={activeThread}
                threadId={effectiveThreadId}
                messages={messages}
                selfId={selfId}
                isLoading={messagesQuery.isLoading}
                isError={messagesQuery.isError}
                start={messageStart}
                pageSize={MESSAGES_PAGE_SIZE}
                onPrev={() =>
                  setMessageStart(Math.max(0, messageStart - MESSAGES_PAGE_SIZE))
                }
                onNext={() => setMessageStart(messageStart + MESSAGES_PAGE_SIZE)}
                showing={showing}
                trainerName={trainerName}
              />
            </div>
          </div>
        ) : (
          <div style={{ maxHeight: 480 }} className="overflow-hidden">
            <MessengerInboxPanel
              threads={threads}
              activeId={effectiveThreadId}
              selfId={selfId}
              isLoading={threadsQuery.isLoading}
              isError={threadsQuery.isError}
              start={threadStart}
              pageSize={THREADS_PAGE_SIZE}
              onSelect={(id) => {
                setActiveThreadId(id);
                setMessageStart(0);
                setMobileShowConvo(true);
              }}
              onPrev={() =>
                setThreadStart(Math.max(0, threadStart - THREADS_PAGE_SIZE))
              }
              onNext={() => setThreadStart(threadStart + THREADS_PAGE_SIZE)}
            />
          </div>
        )}
      </div>

      {/* Desktop — 316px / 1fr messenger grid */}
      <div
        className="hidden md:grid mt-7"
        style={{
          gridTemplateColumns: "316px 1fr",
          gap: 20,
          height: "calc(100vh - 250px)",
          minHeight: 560,
        }}
      >
        <MessengerInboxPanel
          threads={threads}
          activeId={effectiveThreadId}
          selfId={selfId}
          isLoading={threadsQuery.isLoading}
          isError={threadsQuery.isError}
          start={threadStart}
          pageSize={THREADS_PAGE_SIZE}
          onSelect={(id) => {
            setActiveThreadId(id);
            setMessageStart(0);
          }}
          onPrev={() =>
            setThreadStart(Math.max(0, threadStart - THREADS_PAGE_SIZE))
          }
          onNext={() => setThreadStart(threadStart + THREADS_PAGE_SIZE)}
        />
        <MessengerConvoPanel
          thread={activeThread}
          threadId={effectiveThreadId}
          messages={messages}
          selfId={selfId}
          isLoading={messagesQuery.isLoading}
          isError={messagesQuery.isError}
          start={messageStart}
          pageSize={MESSAGES_PAGE_SIZE}
          onPrev={() =>
            setMessageStart(Math.max(0, messageStart - MESSAGES_PAGE_SIZE))
          }
          onNext={() => setMessageStart(messageStart + MESSAGES_PAGE_SIZE)}
          showing={showing}
          trainerName={trainerName}
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
              setMobileShowConvo(true);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── New conversation dialog ────────────────────────────────────────────

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
