export interface SendAiChatMessageBody {
  message: string;
  isHidden?: boolean;
  sessionId?: string;
}

export interface AiChatStreamHandlers {
  onText?: (chunk: string) => void;
  onStatus?: (status: string) => void;
  onDone?: (sessionId: string) => void;
  onError?: (message: string) => void;
}

export interface AiChatStreamResult {
  fullText: string;
  sessionId: string | null;
}
