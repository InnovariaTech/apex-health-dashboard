// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCheck, Clock, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { useEnvironment } from "@/lib/EnvironmentContext";
import { useSearchParams } from "react-router-dom";
import {
  useCasesYearRolling,
  useLatestCaseId,
} from "@/hooks/care-validate/useCases";
import { ELIGIBLE_CASE_STATUSES } from "@/types/care-validate/case_types";
import { sanitizeCaseTitle } from "@/views/patient/utils/caseTitleUtils";
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
  // Pull 1 year of cases (6 parallel 2-month windows) and pre-filter on
  // the server to the 4 chat-eligible statuses so closed / rejected /
  // abandoned cases never enter the picker or the `latestCaseId` fallback.
  const { data: cases = [], isLoading: isCasesLoading } = useCasesYearRolling({
    status: ELIGIBLE_CASE_STATUSES,
  });
  const { data: latestCaseId = "" } = useLatestCaseId();
  // `latestCaseId` may resolve to a case that's no longer eligible (e.g.
  // it was just closed). Honor it only when it's still in the eligible
  // list — otherwise fall through to the first eligible case.
  const eligibleLatestCaseId =
    latestCaseId && cases.some((c) => c.id === latestCaseId)
      ? latestCaseId
      : "";
  const activeCaseIdResolved =
    activeCaseId || eligibleLatestCaseId || cases[0]?.id || "";
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

    // Latest-case fallback only fires when it points at an eligible case
    // (computed above). Closed/rejected latest IDs get dropped here so
    // the user lands on a chat-able conversation by default.
    if (!activeCaseId && eligibleLatestCaseId) {
      setActiveCaseId(eligibleLatestCaseId);
      return;
    }

    if (!activeCaseId && cases[0]?.id) {
      setActiveCaseId(cases[0].id);
      return;
    }

    if (!caseIdFromQuery && activeCase?.id && !activeCaseId) {
      setActiveCaseId(activeCase.id);
    }
  }, [caseIdFromQuery, eligibleLatestCaseId, cases, activeCase?.id, activeCaseId]);

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

  // Strip the patient's name out of the auto-generated case title before it
  // is shown in the chat header / subtitle (e.g. "Case for Muzammil Lone").
  const activeCaseTitle = activeCase
    ? sanitizeCaseTitle(activeCase.title)
    : "";

  const currentThreadConfig = {
    label: "Case Chat",
    sub: activeCase
      ? `Case #${activeCase.shortId} - ${activeCaseTitle}`
      : "Message your care team for this case",
    icon: Stethoscope,
    placeholder: "Message your provider...",
    badge: "Medical",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-4 md:px-9 py-5 bg-background flex-shrink-0">
        <div className="max-w-[1480px] mx-auto">
          <div className="apex-eyebrow mb-1.5">Care Team</div>
          <h1 className="apex-page-title">
            Care team <em>messages</em>
          </h1>
          <p className="text-[13px] text-ink-2 mt-1.5">
            Secure messaging with your medical team
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden max-w-[1480px] w-full mx-auto px-4 md:px-9 py-4 md:py-6">
          <div className="apex-card flex-1 flex flex-col overflow-hidden">
            {/* Recipient bar */}
            {activeCase && (
              <div className="border-b border-border px-5 py-3.5 bg-surface-2 flex items-center gap-3 flex-shrink-0">
                <Avatar className="w-9 h-9 border border-border">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {String(activeCase.title ?? "C").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activeCaseTitle || "Current Case"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentThreadConfig.sub}
                  </p>
                </div>
                <Badge variant="info">{currentThreadConfig.badge}</Badge>
              </div>
            )}

            {/* Messages */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-surface-2"
            >
              {!isCommentsPending && comments.length >= recordsPerPage && (
                <div className="flex justify-center mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadOlder}
                    disabled={isLoadingOlder || isCommentsLoading}
                  >
                    {isLoadingOlder ? "Loading older messages..." : "Load older messages"}
                  </Button>
                </div>
              )}

              {!activeCaseIdResolved ? (
                // No case exists yet (latest-case-id returned "" and the
                // cases list is empty). React Query keeps a disabled
                // comments query in `isPending: true` forever, which used
                // to show a perpetual spinner — render an explicit empty
                // state instead.
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div
                    className="w-16 h-16 rounded-[14px] flex items-center justify-center mb-4"
                    style={{ background: "var(--apex-accent-soft)" }}
                  >
                    <Stethoscope className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-foreground mb-1">
                    No case to chat against yet
                  </h3>
                  <p className="text-[13px] text-muted-foreground max-w-xs">
                    Once you submit a case from My Cases, your conversation
                    with the care team will appear here.
                  </p>
                </div>
              ) : isCommentsPending && comments.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : isCommentsError ? (
                <div
                  className="apex-card p-4 text-sm"
                  style={{ borderColor: "var(--att)", background: "var(--att-soft)", color: "var(--att)" }}
                >
                  Unable to load case messages right now.
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div
                    className="w-16 h-16 rounded-[14px] flex items-center justify-center mb-4"
                    style={{ background: "var(--apex-accent-soft)" }}
                  >
                    <currentThreadConfig.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-foreground mb-1">
                    Start a conversation
                  </h3>
                  <p className="text-[13px] text-muted-foreground max-w-xs">
                    {currentThreadConfig.sub}. Messages are reviewed during business hours.
                  </p>
                </div>
              ) : (
                comments.map((msg) => {
                  const isFromMe =
                    isCurrentUserComment(msg) || String(msg.id ?? "").startsWith("optimistic-");
                  const authorName = formatAuthorName(msg.author);
                  return (
                    <div key={msg.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                      {!isFromMe && (
                        <Avatar className="w-7 h-7 mr-2 mt-1 flex-shrink-0 border border-border">
                          <AvatarFallback className="bg-secondary text-ink-2 text-xs font-semibold">
                            {getAuthorInitial(msg)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="max-w-[72%]">
                        <div
                          className={`px-4 py-3 rounded-[14px] text-sm ${
                            isFromMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-card border border-border text-foreground rounded-bl-sm"
                          }`}
                        >
                          {!isFromMe && (
                            <p className="apex-eyebrow mb-1">{authorName}</p>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
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
                        <div
                          className={`flex items-center gap-1.5 mt-1 px-1 ${
                            isFromMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {String(msg.id ?? "").startsWith("optimistic-")
                              ? "Sending..."
                              : msg.createdAt
                                ? format(new Date(msg.createdAt), "MMM d, h:mm a")
                                : "—"}
                          </span>
                          {isFromMe &&
                            (msg.id ? (
                              <CheckCheck className="w-3 h-3 text-primary" />
                            ) : (
                              <Clock className="w-3 h-3 text-muted-foreground" />
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Disclaimer + Input */}
            <div className="border-t border-border px-4 py-3 bg-card flex-shrink-0">
              <p className="font-mono text-[10px] text-muted-foreground mb-2 text-center uppercase tracking-[0.06em]">
                For medical emergencies, call 911. This is not a crisis line.
              </p>
              {!activeCaseIdResolved ? (
                <p className="text-center text-sm text-muted-foreground py-2">
                  No active case selected.
                </p>
              ) : (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={currentThreadConfig.placeholder}
                    className="flex-1"
                    disabled={createCommentMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={createCommentMutation.isPending || !newMessage.trim()}
                    className="px-5"
                  >
                    {createCommentMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
