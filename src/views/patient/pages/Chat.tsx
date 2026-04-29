// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, CheckCheck, Clock, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { useSearchParams } from "react-router-dom";
import {
  useCases,
  useLatestCaseId,
} from "@/hooks/care-validate/useCases";
import { getCasesDateRange } from "@/views/patient/utils/casesDateRange";
import {
  useCaseCommentsByID,
  useCreateCaseComment,
} from "@/hooks/care-validate/useCommunications";
import { findPatientAuthor, formatAuthorName } from "@/lib/careValidateIdentity";

export default function Chat() {
  const { environment } = useEnvironment();
  const [searchParams] = useSearchParams();
  const caseIdFromQuery = searchParams.get("caseId") ?? "";
  const [currentUser, setCurrentUser] = useState(null);
  const [activeCaseId, setActiveCaseId] = useState(caseIdFromQuery || "");
  const [newMessage, setNewMessage] = useState("");
  const [recordsPerPage, setRecordsPerPage] = useState(100);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const createCommentMutation = useCreateCaseComment();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const previousCommentCountRef = useRef(0);
  const previousScrollHeightRef = useRef(0);
  const dateRange = React.useMemo(() => getCasesDateRange(), []);
  const { data: cases = [], isLoading: isCasesLoading } = useCases({
    startTime: dateRange.startTime,
    endTime: dateRange.endTime,
  });
  const { data: latestCaseId = "" } = useLatestCaseId();
  const activeCaseIdResolved = activeCaseId || latestCaseId || cases[0]?.id || "";
  const activeCase = cases.find((caseItem) => caseItem.id === activeCaseIdResolved) ?? null;
  const {
    data: comments = [],
    isLoading: isCommentsLoading,
    isPending: isCommentsPending,
    isError: isCommentsError,
  } = useCaseCommentsByID(activeCaseIdResolved, { recordsPerPage, sortOrder: "ASC" });

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (caseIdFromQuery) {
      setActiveCaseId(caseIdFromQuery);
      return;
    }

    if (!activeCaseId && latestCaseId) {
      setActiveCaseId(latestCaseId);
      return;
    }

    if (!activeCaseId && cases[0]?.id) {
      setActiveCaseId(cases[0].id);
      return;
    }

    if (!caseIdFromQuery && activeCase?.id && !activeCaseId) {
      setActiveCaseId(activeCase.id);
    }
  }, [caseIdFromQuery, latestCaseId, cases, activeCase?.id, activeCaseId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isLoadingOlder) {
      const heightDelta = container.scrollHeight - previousScrollHeightRef.current;
      container.scrollTop = Math.max(0, container.scrollTop + heightDelta);
      setIsLoadingOlder(false);
      previousCommentCountRef.current = comments.length;
      return;
    }

    const previousCount = previousCommentCountRef.current;
    const hasNewMessages = comments.length > previousCount;
    if (hasNewMessages) {
      const nearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      if (nearBottom || createCommentMutation.isSuccess) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }

    previousCommentCountRef.current = comments.length;
  }, [comments, isLoadingOlder, createCommentMutation.isSuccess]);

  const loadCurrentUser = async () => {
    const user = await api.auth.me();
    setCurrentUser(user);
  };

  const patientAuthor = React.useMemo(() => findPatientAuthor(comments), [comments]);
  const patientAuthorId = patientAuthor?.id ?? "";

  const getAuthorInitial = useCallback((comment) => {
    const firstInitial = String(comment?.author?.firstName ?? "")
      .trim()
      .charAt(0)
      .toUpperCase();
    const lastInitial = String(comment?.author?.lastName ?? "")
      .trim()
      .charAt(0)
      .toUpperCase();
    return `${firstInitial}${lastInitial}`.trim() || "T";
  }, []);

  const isCurrentUserComment = useCallback(
    (comment) => {
      if (!patientAuthorId) return false;
      return String(comment?.author?.id ?? "") === patientAuthorId;
    },
    [patientAuthorId]
  );

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !activeCaseIdResolved || !currentUser) return;

    const fullName = String(currentUser.full_name ?? "").trim();
    const parts = fullName.split(" ").filter(Boolean);
    const firstName =
      parts[0] || String(currentUser.first_name ?? currentUser.firstName ?? "Patient");
    const lastName =
      parts.slice(1).join(" ") ||
      String(currentUser.last_name ?? currentUser.lastName ?? "User");

    setNewMessage("");
    try {
      await createCommentMutation.mutateAsync({
        caseId: activeCaseIdResolved,
        text,
        body: {
          action: "ADD_COMMUNICATION",
          communication: {
            text,
            isRestricted: false,
            author: {
              email: String(currentUser.email ?? ""),
              firstName,
              lastName,
            },
            webhookNotify: false,
          },
        },
        optimisticAuthor: patientAuthor ?? {
          id: "optimistic-patient",
          firstName,
          lastName,
        },
        recordsPerPage,
        sortOrder: "ASC",
      });
    } catch {
      setNewMessage(text);
    }
  };

  const handleLoadOlder = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    previousScrollHeightRef.current = container.scrollHeight;
    setIsLoadingOlder(true);
    setRecordsPerPage((prev) => prev + 100);
  }, []);

  if (!currentUser || isCasesLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentThreadConfig = {
    label: "Case Chat",
    sub: activeCase
      ? `Case #${activeCase.shortId} - ${activeCase.title}`
      : "Message your care team for this case",
    icon: Stethoscope,
    color: "#2563eb",
    placeholder: "Message your provider...",
    badge: "Medical",
    badgeColor: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-card flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: environment.primaryColor }}>
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Care Team Messages</h1>
            <p className="text-xs text-muted-foreground font-medium">Secure messaging with your medical team</p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Recipient bar */}
        {activeCase && (
          <div className="border-b px-6 py-3 bg-muted/30 flex items-center gap-3 flex-shrink-0">
            <Avatar className="w-9 h-9 border-2" style={{ borderColor: currentThreadConfig.color }}>
              <AvatarFallback className="text-white text-sm font-bold" style={{ backgroundColor: currentThreadConfig.color }}>
                {String(activeCase.title ?? "C").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{activeCase.title || "Current Case"}</p>
              <p className="text-xs text-muted-foreground">{currentThreadConfig.sub}</p>
            </div>
            <Badge className={`text-xs font-bold border-none ${currentThreadConfig.badgeColor}`}>
              {currentThreadConfig.badge}
            </Badge>
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-muted/10"
        >
          {!isCommentsPending && comments.length >= recordsPerPage && (
            <div className="flex justify-center mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadOlder}
                disabled={isLoadingOlder || isCommentsLoading}
                className="text-xs"
              >
                {isLoadingOlder ? "Loading older messages..." : "Load older messages"}
              </Button>
            </div>
          )}

          {isCommentsPending && comments.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isCommentsError ? (
            <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              Unable to load case messages right now.
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: currentThreadConfig.color + "18" }}>
                <currentThreadConfig.icon className="w-8 h-8" style={{ color: currentThreadConfig.color }} />
              </div>
              <h3 className="font-bold text-foreground mb-1">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-xs">{currentThreadConfig.sub}. Messages are reviewed during business hours.</p>
            </div>
          ) : (
            comments.map((msg) => {
              const isFromMe =
                isCurrentUserComment(msg) || String(msg.id ?? "").startsWith("optimistic-");
              const authorName = formatAuthorName(msg.author);
              return (
                <div key={msg.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                  {!isFromMe && (
                    <Avatar className="w-7 h-7 mr-2 mt-1 flex-shrink-0 border" style={{ borderColor: currentThreadConfig.color }}>
                      <AvatarFallback className="text-white text-xs font-bold" style={{ backgroundColor: currentThreadConfig.color }}>
                        {getAuthorInitial(msg)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="max-w-[72%]">
                    <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${
                      isFromMe
                        ? "text-white rounded-br-sm"
                        : "bg-card border border-border text-foreground rounded-bl-sm"
                    }`}
                    style={isFromMe ? { backgroundColor: currentThreadConfig.color } : {}}
                    >
                      {!isFromMe && (
                        <p className="text-[10px] font-semibold mb-1 opacity-80">{authorName}</p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((attachment, index) => (
                            <a
                              key={attachment.id || `${msg.id}-attachment-${index}`}
                              href={attachment.url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs underline opacity-90"
                            >
                              {attachment.fileName || "Attachment"}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1 px-1 ${isFromMe ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {String(msg.id ?? "").startsWith("optimistic-")
                          ? "Sending..."
                          : msg.createdAt
                            ? format(new Date(msg.createdAt), "MMM d, h:mm a")
                            : "—"}
                      </span>
                      {isFromMe && (msg.id
                        ? <CheckCheck className="w-3 h-3" style={{ color: currentThreadConfig.color }} />
                        : <Clock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer + Input */}
        <div className="border-t px-4 py-3 bg-card flex-shrink-0">
          <p className="text-[10px] text-muted-foreground font-medium mb-2 text-center">
            ⚠️ For medical emergencies, call 911. This is not a crisis line.
          </p>
          {!activeCaseIdResolved ? (
            <p className="text-center text-sm text-muted-foreground font-semibold py-2">
              No active case selected.
            </p>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={currentThreadConfig.placeholder}
                className="flex-1 border-2 focus:border-primary font-medium"
                disabled={createCommentMutation.isPending}
              />
              <Button
                type="submit"
                disabled={createCommentMutation.isPending || !newMessage.trim()}
                className="px-5 font-bold text-white"
                style={{ backgroundColor: currentThreadConfig.color }}
              >
                {createCommentMutation.isPending
                  ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  : <Send className="w-4 h-4" />
                }
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
