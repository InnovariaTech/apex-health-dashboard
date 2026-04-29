# Zustand AI Chat Integration

## Goal

The AI chat (`AIAssistantBar`) needs two pieces of cross-component state that don't fit React Query (server state) or local component state:

1. **`sessionId`** — returned by the backend on the first chat response. Must be sent back on every subsequent call so the AI keeps conversation context across messages.
2. **`pendingPrompt`** — a one-shot message handed off from another page (e.g. the "Analyze with AI" button on a document tile) into the floating AI bar.

We chose **Zustand** (added in this change) over Redux Toolkit and over the existing Context API because:

- It's idiomatic for projects that already have **React Query** carrying server state — most of what's left is small slices of UI/session state, which Zustand handles with near-zero boilerplate.
- It ships a `persist` middleware that solves the `sessionStorage` requirement in one block of config (no manual `useEffect` plumbing).
- It scales horizontally — additional stores (`useUiStore`, etc.) can be dropped into `src/stores/` later without touching this one.

`AuthContext` and `EnvironmentContext` were left untouched. They can be migrated to Zustand later if/when the team decides to standardise.

---

## Files Added / Changed

| File | Change |
|---|---|
| `package.json` | `zustand@^5.0.12` added |
| `src/stores/aiChatStore.ts` | **New** — the store |
| `src/types/ai-agent/ai_chat.ts` | Added optional `sessionId` to `SendAiChatMessageBody` |
| `src/components/global/AIAssistantBar.tsx` | Reads/writes `sessionId`, consumes `pendingPrompt`, supports hidden messages |
| `src/views/patient/pages/Documents.tsx` | "Analyze with AI" now sets a `pendingPrompt` instead of calling `InvokeLLM` directly |

---

## The Store — `src/stores/aiChatStore.ts`

```ts
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
```

### Persistence design

The store is wrapped in `persist` middleware with two important details:

```ts
storage: createJSONStorage(() => sessionStorage),
partialize: (state) => ({ sessionId: state.sessionId }),
```

- **`sessionStorage` (not `localStorage`)** — chat sessions on the backend expire. Persisting forever would mean carrying a stale ID across days/weeks until the API rejects it. `sessionStorage` resets on tab close, which matches the natural lifetime of a chat session and avoids stale-token bugs. It still survives page refresh and route navigation within the tab — that's all we need.
- **`partialize`** — only `sessionId` is persisted. `pendingPrompt` is a transient hand-off (it should fire once and disappear); persisting it would cause the same prompt to re-fire on every page refresh.

### `consumePendingPrompt` — atomic read-and-clear

```ts
consumePendingPrompt: () => {
  const prompt = get().pendingPrompt;
  if (prompt) set({ pendingPrompt: null });
  return prompt;
}
```

Read and clear in one call. This prevents the consumer's `useEffect` from accidentally firing the same prompt twice (e.g. due to a re-render before the clear lands).

---

## Type Update — `src/types/ai-agent/ai_chat.ts`

```ts
export interface SendAiChatMessageBody {
  message: string;
  isHidden?: boolean;
  sessionId?: string;
}
```

`sessionId` is optional. The very first message in a session omits it; the backend returns one in the `done` SSE event, and every message after that includes it.

---

## `AIAssistantBar.tsx` Wiring

### 1. Reading the store

```ts
const sessionId = useAiChatStore((s) => s.sessionId);
const setSessionId = useAiChatStore((s) => s.setSessionId);
const pendingPrompt = useAiChatStore((s) => s.pendingPrompt);
const consumePendingPrompt = useAiChatStore((s) => s.consumePendingPrompt);
```

Each value is selected individually so a change to `sessionId` doesn't re-render code that only cares about `pendingPrompt`.

### 2. `sessionIdRef` — why a ref

```ts
const sessionIdRef = useRef(sessionId);
useEffect(() => {
  sessionIdRef.current = sessionId;
}, [sessionId]);
```

`handleSend` is called from event handlers (and from the pending-prompt effect) at arbitrary times. Reading `sessionId` directly inside `handleSend`'s closure would capture a stale value. The ref guarantees we always send the latest `sessionId` even if it was just written by the previous response's `onDone`.

### 3. Sending with `sessionId`

```ts
const currentSessionId = sessionIdRef.current;
const body = {
  message: question,
  isHidden,
  ...(currentSessionId ? { sessionId: currentSessionId } : {}),
};
```

The conditional spread keeps `sessionId` out of the body entirely on the first call (rather than sending `sessionId: null`). The backend treats absence as "start a new session."

### 4. Capturing `sessionId` from the stream

```ts
onDone: (newSessionId) => {
  if (newSessionId && newSessionId !== sessionIdRef.current) {
    setSessionId(newSessionId);
  }
}
```

The SSE stream ends with `data: {"type":"done","sessionId":"..."}`. The `useStreamAiChatMessage` hook surfaces this via the `onDone` handler. We write it to the store — which then persists it to `sessionStorage`.

The equality check avoids a redundant store write (and re-render) when the backend echoes back the same session ID we already sent.

### 5. `handleSend` with `isHidden`

```ts
const handleSend = async (text, options = {}) => {
  const { isHidden = false } = options;
  ...
  if (!isHidden) setInput("");
  setIsExpanded(true);
  const baseMessages = isHidden
    ? messages
    : [...messages, { role: "user", content: question }];
  if (!isHidden) setMessages(baseMessages);
  ...
};
```

When `isHidden` is true:
- The user-message bubble is **not** added to the visible chat (`messages` array is unchanged).
- The input box is **not** cleared (it was never typed in).
- The assistant response **does** stream in normally — it's appended to a placeholder seeded at `baseMessages.length`.

Result: the user sees a response appear without an accompanying "I sent this prompt" bubble — the prompt is logically issued but visually invisible.

### 6. Consuming `pendingPrompt`

```ts
const handleSendRef = useRef(handleSend);
useEffect(() => {
  handleSendRef.current = handleSend;
});

useEffect(() => {
  if (!pendingPrompt) return;
  const prompt = consumePendingPrompt();
  if (!prompt) return;
  handleSendRef.current?.(prompt.message, { isHidden: prompt.isHidden });
}, [pendingPrompt, consumePendingPrompt]);
```

Two effects here, working together:

- **The first effect** (no dependency array) re-assigns `handleSendRef.current` after every render so the ref always points to the latest `handleSend` closure (which captures fresh `messages`, `input`, etc.). This is the standard "latest ref" pattern.
- **The second effect** watches `pendingPrompt`. When it becomes non-null, it calls `consumePendingPrompt()` (atomic read-and-clear) and invokes the latest `handleSend` via the ref.

Why the ref dance? Because `handleSend` is defined *after* the effect in source order (and depends on local component state). Using a ref lets the effect call it without making `handleSend` itself a hook dep (which would re-fire the effect on every render).

### 7. Rules-of-Hooks fix

The original component had:

```ts
if (!environment.aiEnabled) return null;
```

…in the middle of the function body. This was safe before, but adding new `useEffect` calls after it would have violated Rules of Hooks (hook order would change when `aiEnabled` toggles). The early-return was moved down to sit *after* all hook calls.

---

## `Documents.tsx` Wiring

The "Analyze with AI" button used to call `api.integrations.Core.InvokeLLM` directly and write a summary back to the document record. That flow was replaced with the AI-chat hand-off:

```ts
const setPendingPrompt = useAiChatStore((s) => s.setPendingPrompt);

const handleAnalyze = (doc) => {
  setPendingPrompt({
    message: `I have requested a detailed analysis for lab report ${doc.id}. Please retrieve its full details and provide a comprehensive summary, explaining any out-of-range biomarkers in simple terms.`,
    isHidden: true,
    documentId: doc.id,
  });
  setSelectedDoc(null);
};
```

- The prompt format follows the spec given (with `doc.id` interpolated).
- `isHidden: true` so the prompt itself doesn't appear in the chat — only the AI's analysis does.
- `setSelectedDoc(null)` closes the document detail dialog so the floating AI bar (which sits at the bottom of the layout) is unobstructed.

The `isAnalyzing` local state and InvokeLLM-based flow were removed because the analysis now happens in the AI bar, which has its own loading state (`isLoading` + the streaming dots).

---

## End-to-End Flow

1. User clicks **Analyze with AI** on a document tile in `Documents.tsx`.
2. `setPendingPrompt({ message, isHidden: true, documentId })` writes to the Zustand store.
3. `AIAssistantBar`'s consume-effect fires (it's mounted in the global layout, so it's always listening). It calls `consumePendingPrompt()` to atomically take and clear the prompt.
4. `handleSend(message, { isHidden: true })` runs. The bar expands, no user bubble is shown, and a placeholder assistant message is seeded.
5. `streamAiChat({ message, isHidden: true })` is called — no `sessionId` yet on the very first request.
6. SSE chunks stream in, appending to the assistant message in real time.
7. The final `data: {"type":"done","sessionId":"..."}` triggers `onDone`, which writes the new `sessionId` to the store — and the `persist` middleware writes it to `sessionStorage`.
8. Now the user types a follow-up question in the bar's input.
9. `handleSend` runs again. This time `sessionIdRef.current` has a value, so the body includes `sessionId: "<the-uuid>"`. The backend uses it to recall context.
10. Refresh the page — `sessionStorage` rehydrates the store, `sessionId` is still there, and the next message continues the same conversation.
11. Close the tab — `sessionStorage` is cleared. Next time the user opens the app, a new session starts.

---

## Patterns to Reuse

If/when more global UI state shows up (sidebar collapsed/open, theme overrides not handled by `next-themes`, modal stacks, feature flags, etc.), follow the same shape:

- File per store under `src/stores/`, named `useXxxStore.ts`.
- Select fields individually with `useXxxStore((s) => s.field)` to keep re-renders narrow.
- Use `persist` + `partialize` if and only if the field genuinely needs to survive a refresh — and choose `sessionStorage` over `localStorage` unless there's a reason to keep the data across browser restarts.
- Use the **atomic consume** pattern for any one-shot message between components (read-and-clear in a single store action).
- Use the **latest-ref** pattern when an effect needs to call a closure defined later in the component or holding fresh state.
