import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getThreadMessages,
  listMessageThreads,
  markThreadRead,
  replyToThread,
  sendFirstMessage,
} from "@/api/healthie/messages";
import { queryKeys } from "@/hooks/queryKeys";
import type { MessageThread } from "@/types/healthie/messages_types";

/**
 * The patient's conversation with their care team. One thread per patient — created by their
 * first message. There is no live push from Healthie, so an open conversation polls.
 */

const THREADS_POLL_MS = 30_000;
const MESSAGES_POLL_MS = 15_000;

/** Healthie auto-creates an unnamed, empty thread; it is not a conversation anyone had. */
function pickCareTeamThread(threads: MessageThread[]): MessageThread | null {
  const real = threads.filter((t) => t.name !== null || t.lastMessage !== null);
  return real.find((t) => t.name) ?? real[0] ?? null;
}

/**
 * Just the thread list and unread count — for a list page that shows "2 unread" without loading
 * (or polling) the messages themselves.
 */
export function useCareTeamThreads() {
  const query = useQuery({
    queryKey: queryKeys.healthie.threads(),
    queryFn: listMessageThreads,
    refetchInterval: THREADS_POLL_MS,
    retry: false,
  });
  return {
    thread: pickCareTeamThread(query.data?.threads ?? []),
    unreadCount: query.data?.unreadCount ?? 0,
    isLoading: query.isLoading,
  };
}

export function useCareTeamMessages() {
  const qc = useQueryClient();

  const threadsQuery = useQuery({
    queryKey: queryKeys.healthie.threads(),
    queryFn: listMessageThreads,
    refetchInterval: THREADS_POLL_MS,
    retry: false,
  });
  const thread = useMemo(() => pickCareTeamThread(threadsQuery.data?.threads ?? []), [threadsQuery.data]);

  const messagesQuery = useQuery({
    queryKey: queryKeys.healthie.messages(thread?.id ?? ""),
    queryFn: () => getThreadMessages(thread!.id),
    enabled: Boolean(thread?.id),
    refetchInterval: MESSAGES_POLL_MS,
    retry: false,
  });

  // Oldest first for a chat view; the API answers newest first.
  const messages = useMemo(() => [...(messagesQuery.data ?? [])].reverse(), [messagesQuery.data]);

  // Mark read when opened, and again whenever new messages arrive while it's open.
  const newest = messagesQuery.data?.[0]?.id;
  useEffect(() => {
    if (!thread?.id || !newest) return;
    markThreadRead(thread.id)
      .then(() => qc.invalidateQueries({ queryKey: queryKeys.healthie.threads() }))
      .catch(() => undefined);
  }, [thread?.id, newest, qc]);

  const send = useMutation({
    mutationFn: async (content: string) => {
      if (thread?.id) return replyToThread(thread.id, content);
      return sendFirstMessage(content);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.healthie.threads() });
      if (thread?.id) await qc.invalidateQueries({ queryKey: queryKeys.healthie.messages(thread.id) });
    },
  });

  return {
    thread,
    messages,
    isLoading: threadsQuery.isLoading || (Boolean(thread?.id) && messagesQuery.isLoading),
    isError: threadsQuery.isError || messagesQuery.isError,
    send,
  };
}
