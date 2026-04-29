import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AiChatPendingPrompt {
  message: string;
  isHidden: boolean;
  documentId?: string;
}

interface AiChatState {
  sessionId: string | null;
  pendingPrompt: AiChatPendingPrompt | null;
  setSessionId: (sessionId: string | null) => void;
  clearSessionId: () => void;
  setPendingPrompt: (prompt: AiChatPendingPrompt) => void;
  consumePendingPrompt: () => AiChatPendingPrompt | null;
}

export const useAiChatStore = create<AiChatState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      pendingPrompt: null,
      setSessionId: (sessionId) => set({ sessionId }),
      clearSessionId: () => set({ sessionId: null }),
      setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),
      consumePendingPrompt: () => {
        const prompt = get().pendingPrompt;
        if (prompt) set({ pendingPrompt: null });
        return prompt;
      },
    }),
    {
      name: "apex-ai-chat",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ sessionId: state.sessionId }),
    }
  )
);
