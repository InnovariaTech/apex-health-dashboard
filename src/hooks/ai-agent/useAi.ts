import { useCallback, useRef, useState } from "react";
import { streamAiChatMessage } from "@/api/ai-agent/ai_chat";
import type {
  AiChatStreamHandlers,
  AiChatStreamResult,
  SendAiChatMessageBody,
} from "@/types/ai-agent/ai_chat";

export function useStreamAiChatMessage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (
      body: SendAiChatMessageBody,
      handlers: AiChatStreamHandlers = {}
    ): Promise<AiChatStreamResult> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setError(null);
      try {
        return await streamAiChatMessage(body, handlers, controller.signal);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { stream, cancel, isStreaming, error };
}
