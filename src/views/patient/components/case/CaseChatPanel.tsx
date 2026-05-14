// @ts-nocheck
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { CaseDetailsItem } from "@/types/care-validate/case_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  extractChatMessages,
  formatChatTime,
  getAttachmentMeta,
  type ChatAttachmentItem,
  type ChatMessageItem,
} from "@/views/patient/utils/caseChatUtils";
import { useCreateCaseComment } from "@/hooks/care-validate/useCommunications";

interface CaseChatPanelProps {
  caseDetails: CaseDetailsItem;
  caseId: string;
}

function downloadAttachment(attachment: ChatAttachmentItem) {
  const anchor = document.createElement("a");
  anchor.href = attachment.url;
  anchor.download = attachment.fileName;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function ChatAttachmentCard({
  attachment,
  onPreview,
}: {
  attachment: ChatAttachmentItem;
  onPreview: (attachment: ChatAttachmentItem) => void;
}) {
  const meta = getAttachmentMeta(attachment.fileName);
  const canPreview = meta.isPreviewable && attachment.url;

  return (
    <div className="flex items-center gap-3 border border-border rounded-[10px] p-2 bg-card max-w-md">
      <div className="w-9 h-9 rounded-md bg-secondary border border-border flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
        {meta.icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground truncate">{attachment.fileName}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            {meta.extension || "file"}
          </span>
          {attachment.isPHI && <Badge variant="warning">PHI</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {canPreview && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => onPreview(attachment)}
          >
            <Eye className="w-3 h-3" />
            View
          </Button>
        )}
        {attachment.url && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => downloadAttachment(attachment)}
          >
            <Download className="w-3 h-3" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  onPreviewAttachment,
}: {
  message: ChatMessageItem;
  onPreviewAttachment: (attachment: ChatAttachmentItem) => void;
}) {
  const isPatient = message.authorRole === "PATIENT";
  const isOptimistic =
    typeof message.id === "string" && message.id.startsWith("optimistic-");

  const bubbleClass = isPatient
    ? "bg-primary text-primary-foreground"
    : "bg-secondary text-foreground border border-border";
  const alignmentClass = isPatient ? "items-end" : "items-start";
  const roleStyle =
    message.authorRole === "PROVIDER"
      ? { color: "var(--opt)" }
      : message.authorRole === "CARE_TEAM"
        ? { color: "var(--info)" }
        : message.authorRole === "SUPPORT"
          ? { color: "var(--ink-3)" }
          : { color: "var(--apex-accent)" };

  return (
    <div className={`flex flex-col ${alignmentClass} gap-1`}>
      <div className="text-[12px] flex items-center gap-2">
        <span className="font-medium text-foreground">
          {isPatient ? "You" : message.authorName}
        </span>
        {!isPatient && (
          <span style={roleStyle}>({message.authorRoleLabel})</span>
        )}
        <span className="text-muted-foreground font-mono text-[11px]">
          {isOptimistic ? "Sending..." : formatChatTime(message.createdAt)}
        </span>
      </div>

      <div className={`rounded-[14px] px-4 py-2 max-w-[80%] ${bubbleClass} ${isOptimistic ? "opacity-70" : ""}`}>
        <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{message.text || "—"}</p>
      </div>

      {message.attachments.length > 0 && (
        <div className={`mt-1 flex flex-col gap-2 ${alignmentClass}`}>
          {message.attachments.map((attachment) => (
            <ChatAttachmentCard
              key={attachment.id}
              attachment={attachment}
              onPreview={onPreviewAttachment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChatPreviewDialog({
  attachment,
  onClose,
}: {
  attachment: ChatAttachmentItem | null;
  onClose: () => void;
}) {
  const meta = attachment ? getAttachmentMeta(attachment.fileName) : null;

  return (
    <Dialog open={Boolean(attachment)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl">
        {attachment && (
          <>
            <DialogHeader>
              <DialogTitle className="truncate pr-8">{attachment.fileName}</DialogTitle>
            </DialogHeader>

            <div className="max-h-[75vh] overflow-auto rounded-md border border-border">
              {meta?.isPdf && attachment.url && (
                <iframe
                  src={attachment.url}
                  title={attachment.fileName}
                  className="w-full h-[75vh] border-0"
                />
              )}
              {meta?.isImage && attachment.url && (
                <img
                  src={attachment.url}
                  alt={attachment.fileName}
                  className="max-w-full max-h-[75vh] mx-auto"
                />
              )}
              {!meta?.isPdf && !meta?.isImage && (
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Preview is not available for this file type.
                  </p>
                  {attachment.url && (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline"
                    >
                      Open file in new tab
                    </a>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function CaseChatPanel({ caseDetails, caseId }: CaseChatPanelProps) {
  const [previewAttachment, setPreviewAttachment] = useState<ChatAttachmentItem | null>(null);
  const [draft, setDraft] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessageItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(40);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const createCommentMutation = useCreateCaseComment();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousMessagesLengthRef = useRef(0);
  const previousScrollHeightRef = useRef(0);

  const realMessages = useMemo(
    () => extractChatMessages(caseDetails, { includeRestricted: false }),
    [caseDetails]
  );

  const mergedMessages = useMemo(() => {
    if (optimisticMessages.length === 0) return realMessages;

    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    const activeOptimistic = optimisticMessages.filter((optimistic) => {
      const optimisticTime = new Date(optimistic.createdAt).getTime();
      if (optimisticTime < twoMinutesAgo) return false;

      const matchedReal = realMessages.some(
        (real) =>
          real.authorRole === "PATIENT" &&
          real.text.trim() === optimistic.text.trim() &&
          new Date(real.createdAt).getTime() >= optimisticTime - 10_000
      );
      return !matchedReal;
    });

    return [...realMessages, ...activeOptimistic];
  }, [realMessages, optimisticMessages]);

  const displayedMessages = useMemo(
    () => mergedMessages.slice(-visibleCount),
    [mergedMessages, visibleCount]
  );
  const hasOlderMessages = mergedMessages.length > visibleCount;

  useEffect(() => {
    if (optimisticMessages.length === 0) return;
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    setOptimisticMessages((prev) =>
      prev.filter((optimistic) => {
        const optimisticTime = new Date(optimistic.createdAt).getTime();
        if (optimisticTime < twoMinutesAgo) return false;

        const matchedReal = realMessages.some(
          (real) =>
            real.authorRole === "PATIENT" &&
            real.text.trim() === optimistic.text.trim() &&
            new Date(real.createdAt).getTime() >= optimisticTime - 10_000
        );
        return !matchedReal;
      })
    );
  }, [optimisticMessages.length, realMessages]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (isLoadingOlder) {
      const heightDelta = container.scrollHeight - previousScrollHeightRef.current;
      container.scrollTop = Math.max(0, container.scrollTop + heightDelta);
      setIsLoadingOlder(false);
      previousMessagesLengthRef.current = displayedMessages.length;
      return;
    }

    const previousLength = previousMessagesLengthRef.current;
    const hasNewMessages = displayedMessages.length > previousLength;
    if (hasNewMessages) {
      const nearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      if (nearBottom || createCommentMutation.isSuccess) {
        container.scrollTop = container.scrollHeight;
      }
    }

    previousMessagesLengthRef.current = displayedMessages.length;
  }, [displayedMessages, isLoadingOlder, createCommentMutation.isSuccess]);

  const handleLoadOlder = () => {
    const container = scrollRef.current;
    if (!container) return;
    previousScrollHeightRef.current = container.scrollHeight;
    setIsLoadingOlder(true);
    setVisibleCount((prev) => prev + 40);
  };

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !caseId || createCommentMutation.isPending) return;

    const submitter = (caseDetails.raw?.submitter ?? {}) as Record<string, unknown>;
    const optimisticMessage: ChatMessageItem = {
      id: `optimistic-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      authorName: "You",
      authorRole: "PATIENT",
      authorRoleLabel: "Patient",
      isRestricted: false,
      attachments: [],
    };

    setDraft("");
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    try {
      await createCommentMutation.mutateAsync({
        caseId,
        text,
        body: {
          action: "ADD_COMMUNICATION",
          communication: {
            text,
            isRestricted: false,
            author: {
              email: String(submitter.email ?? ""),
              firstName: String(submitter.firstName ?? "Patient"),
              lastName: String(submitter.lastName ?? "User"),
            },
            webhookNotify: false,
          },
        },
      });

      await queryClient.invalidateQueries({
        queryKey: ["care-validate", "case-details", caseId],
      });
    } catch {
      setOptimisticMessages((prev) =>
        prev.filter((message) => message.id !== optimisticMessage.id)
      );
      setDraft(text);
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.closest("form");
      form?.requestSubmit();
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Case Messages</CardTitle>
          <p className="text-[12px] text-muted-foreground">
            <span className="font-mono">{mergedMessages.length}</span>{" "}
            {mergedMessages.length === 1 ? "message" : "messages"}
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {hasOlderMessages && (
            <div className="border-t border-border px-4 py-2 bg-card flex justify-center">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleLoadOlder}
                disabled={isLoadingOlder}
              >
                {isLoadingOlder ? "Loading older messages..." : "Load older messages"}
              </Button>
            </div>
          )}

          <div
            ref={scrollRef}
            className="max-h-[65vh] overflow-y-auto px-4 py-4 bg-surface-2 border-t border-border space-y-4"
          >
            {displayedMessages.length === 0 ? (
              <div className="text-center py-10 text-[13px] text-muted-foreground">
                No messages yet.
              </div>
            ) : (
              displayedMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onPreviewAttachment={setPreviewAttachment}
                />
              ))
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="border-t border-border bg-card p-3 flex items-end gap-2"
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
              className="min-h-[44px] max-h-[120px] flex-1 resize-none text-[13px]"
              disabled={createCommentMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!draft.trim() || createCommentMutation.isPending}
              className="h-11"
            >
              <Send className="w-4 h-4" />
              {createCommentMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ChatPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </>
  );
}

