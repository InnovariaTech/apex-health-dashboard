import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMessage,
  listThreadMessages,
  listThreads,
  replyMessage,
  sendMessage,
} from "@/api/trainerize/messaging";
import { queryKeys } from "@/hooks/queryKeys";
import type {
  ReplyMessagePayload,
  SendMessagePayload,
} from "@/types/trainerize/messaging_types";

/**
 * Polling cadence for the chat surfaces. Trainerize doesn't push, so we
 * poll on a fixed interval to surface new messages without a manual
 * refresh. Background tabs stop polling (`refetchIntervalInBackground`
 * defaults to false), so this costs no traffic when the user isn't
 * looking. Re-focusing the tab triggers an immediate refetch.
 */
const THREADS_POLL_MS = 30 * 1000;
const THREAD_MESSAGES_POLL_MS = 15 * 1000;

export function useThreads(view = "inbox", start = 0, count = 20) {
  return useQuery({
    queryKey: queryKeys.trainerize.threads(view, start, count),
    queryFn: () => listThreads({ view, start, count }),
    staleTime: 30 * 1000,
    refetchInterval: THREADS_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useThreadMessages(
  threadId: number | undefined,
  start = 0,
  count = 50,
) {
  return useQuery({
    queryKey: queryKeys.trainerize.threadMessages(threadId ?? 0, start, count),
    queryFn: () =>
      listThreadMessages({ threadId: threadId as number, start, count }),
    enabled: typeof threadId === "number" && threadId > 0,
    staleTime: 15 * 1000,
    refetchInterval: THREAD_MESSAGES_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/**
 * Single-message detail — Trainerize `GET /me/messages?messageId=`.
 * Optional surface; not used by the inbox/thread view but available for a
 * future message-detail drawer (attachments, links, reactions).
 */
export function useMessage(messageId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.trainerize.message(messageId ?? 0),
    queryFn: () => getMessage({ messageId: messageId as number }),
    enabled: typeof messageId === "number" && messageId > 0,
    staleTime: 60 * 1000,
  });
}

function invalidateMessaging(qc: ReturnType<typeof useQueryClient>) {
  // Threads list shows last-message preview & unread count, so a new send/
  // reply changes both. Per-thread messages also need to refresh.
  qc.invalidateQueries({ queryKey: ["trainerize", "threads"] });
  qc.invalidateQueries({ queryKey: ["trainerize", "thread-messages"] });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => sendMessage(payload),
    onSuccess: () => invalidateMessaging(qc),
  });
}

export function useReplyMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReplyMessagePayload) => replyMessage(payload),
    onSuccess: () => invalidateMessaging(qc),
  });
}
