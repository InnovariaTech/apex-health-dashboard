import { axiosService } from "@/api/http/axiosInstance";
import type {
  AiChatStreamHandlers,
  AiChatStreamResult,
  SendAiChatMessageBody,
} from "@/types/ai-agent/ai_chat";

const AI_CHAT_ENDPOINT = "/api/chat";
const DEBUG_AI_STREAM = true;

type SseEvent =
  | { type: "text"; content?: string }
  | { type: "status"; content?: string }
  | { type: "done"; sessionId?: string }
  | { type: "error"; message?: string };

function parseSseEvent(payload: string): SseEvent | null {
  try {
    const parsed = JSON.parse(payload) as SseEvent;
    if (parsed && typeof parsed.type === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function streamAiChatMessage(
  body: SendAiChatMessageBody,
  handlers: AiChatStreamHandlers = {},
  signal?: AbortSignal
): Promise<AiChatStreamResult> {
  let fullText = "";
  let sessionId: string | null = null;
  let streamError: string | null = null;
  let processedIndex = 0;

  const handleEvent = (evt: SseEvent) => {
    if (DEBUG_AI_STREAM) console.debug("[ai-chat] event", evt);
    switch (evt.type) {
      case "text":
        if (typeof evt.content === "string") {
          fullText += evt.content;
          handlers.onText?.(evt.content);
        }
        break;
      case "status":
        if (typeof evt.content === "string") {
          handlers.onStatus?.(evt.content);
        }
        break;
      case "done":
        if (typeof evt.sessionId === "string") {
          sessionId = evt.sessionId;
          handlers.onDone?.(evt.sessionId);
        }
        break;
      case "error":
        streamError = evt.message ?? "Unknown stream error";
        handlers.onError?.(streamError);
        break;
    }
  };

  // Process any complete `data:` lines that have arrived since the last call.
  const processIncrementally = (responseText: string) => {
    let cursor = processedIndex;
    while (cursor < responseText.length) {
      const newlineIdx = responseText.indexOf("\n", cursor);
      if (newlineIdx === -1) break;
      const line = responseText.slice(cursor, newlineIdx).trim();
      cursor = newlineIdx + 1;
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      const evt = parseSseEvent(payload);
      if (evt) handleEvent(evt);
    }
    processedIndex = cursor;
  };

  if (DEBUG_AI_STREAM) console.debug("[ai-chat] POST", AI_CHAT_ENDPOINT, body);

  const config: import("axios").AxiosRequestConfig = {
    responseType: "text",
    timeout: 0, // streaming response — do not enforce the global 50s timeout
    headers: { Accept: "text/event-stream" },
    onDownloadProgress: (progressEvent) => {
      const target = (progressEvent.event?.currentTarget ??
        progressEvent.event?.target) as XMLHttpRequest | undefined;
      const responseText = target?.responseText;
      if (typeof responseText === "string" && responseText.length > processedIndex) {
        if (DEBUG_AI_STREAM) {
          console.debug(
            "[ai-chat] progress",
            "loaded:",
            progressEvent.loaded,
            "buffered chars:",
            responseText.length
          );
        }
        processIncrementally(responseText);
      }
    },
  };
  if (signal) config.signal = signal;

  try {
    const response = await axiosService.client.post<string>(AI_CHAT_ENDPOINT, body, config);

    // Final flush in case the last line(s) didn't trigger an in-flight progress event.
    if (typeof response.data === "string" && response.data.length > processedIndex) {
      processIncrementally(response.data);
    }
  } catch (err) {
    if (DEBUG_AI_STREAM) console.error("[ai-chat] request failed", err);
    throw err;
  }

  if (streamError) throw new Error(streamError);
  if (DEBUG_AI_STREAM) {
    console.debug("[ai-chat] done", { fullTextLength: fullText.length, sessionId });
  }
  return { fullText, sessionId };
}
