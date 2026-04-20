import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye } from "lucide-react";
import type { CaseDetailsItem } from "@/types/care-validate/case_types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface CaseChatPanelProps {
  caseDetails: CaseDetailsItem;
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
    <div className="flex items-center gap-3 border border-border rounded-lg p-2 bg-background max-w-md">
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
        {meta.icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{attachment.fileName}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[10px] uppercase text-muted-foreground">{meta.extension || "file"}</span>
          {attachment.isPHI && (
            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">
              PHI
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {canPreview && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => onPreview(attachment)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        )}
        {attachment.url && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => downloadAttachment(attachment)}
          >
            <Download className="w-3 h-3 mr-1" />
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

  const bubbleClass = isPatient
    ? "bg-primary text-primary-foreground"
    : "bg-muted text-foreground";
  const alignmentClass = isPatient ? "items-end" : "items-start";
  const roleColorClass =
    message.authorRole === "PROVIDER"
      ? "text-emerald-700"
      : message.authorRole === "CARE_TEAM"
        ? "text-violet-700"
        : message.authorRole === "SUPPORT"
          ? "text-muted-foreground"
          : "text-primary";

  return (
    <div className={`flex flex-col ${alignmentClass} gap-1`}>
      <div className="text-xs flex items-center gap-2">
        <span className="font-semibold text-foreground">
          {isPatient ? "You" : message.authorName}
        </span>
        {!isPatient && (
          <span className={`${roleColorClass}`}>({message.authorRoleLabel})</span>
        )}
        <span className="text-muted-foreground">{formatChatTime(message.createdAt)}</span>
      </div>

      <div className={`rounded-2xl px-4 py-2 max-w-[80%] ${bubbleClass}`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text || "—"}</p>
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

export default function CaseChatPanel({ caseDetails }: CaseChatPanelProps) {
  const [previewAttachment, setPreviewAttachment] = useState<ChatAttachmentItem | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messages = useMemo(
    () => extractChatMessages(caseDetails, { includeRestricted: false }),
    [caseDetails]
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  return (
    <>
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold text-foreground">Case Messages</CardTitle>
          <p className="text-xs text-muted-foreground">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <div ref={scrollRef} className="max-h-[65vh] overflow-y-auto px-4 py-4 bg-muted/20 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                No messages yet.
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onPreviewAttachment={setPreviewAttachment}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ChatPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </>
  );
}

