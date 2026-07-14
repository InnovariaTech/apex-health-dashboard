# Structured Chat Response — Frontend Integration Guide

> **Audience:** Frontend developers rendering the **ApexAI patient chat**.
> **Endpoint:** `POST {{baseUrl}}/api/chat` — **Server-Sent Events (SSE)** stream.
> **Auth:** Patient session cookie on every request (`credentials: 'include'`).
> **What changed:** `/chat` no longer streams free-text markdown. When structured output is enabled, it streams a **typed sequence of blocks** you render as styled cards.

The AI now returns a **closed vocabulary of block types** (`intro`, `section`, `lab_snapshot`, `priority`, `phase_plan`, `callout`, `product_rec`, `markdown`). The AI dynamically chooses which blocks, how many, and in what order — but every block is one of these known types, so you have exactly one renderer per type. A `markdown` block is the fallback for anything free-form. `product_rec` carries **supplement suggestions** (see §4a).

The block shapes match the ApexAI mockup `renderer.js` — if you're using that renderer, blocks render unchanged.

---

## 1. Request

```
POST /api/chat
Content-Type: application/json
Cookie: <patient session>        // fetch: credentials: 'include'
```

```jsonc
{
  "message": "What should I do in the gym based on my labs?",  // required, non-empty
  "sessionId": "3f1c...-uuid",   // optional — omit to start a new session
  "isHidden": false              // optional
}
```

- **New session:** omit `sessionId`. The server creates one; the id comes back in the final `done` event — store it and send it on subsequent turns.
- **Rate limit:** 20 requests / minute per patient.

---

## 2. Response — the SSE event stream

`Content-Type: text/event-stream`. Each event is a single line:

```
data: {"type":"...", ...}\n\n
```

Parse each `data:` line as JSON. The `type` field discriminates the chunk.

### Chunk types (structured mode)

| `type` | When | Shape | What to do |
|---|---|---|---|
| `status` | during tool use / before formatting | `{ type, content }` | Show a transient status line (e.g. "Analyzing your bloodwork…") |
| `meta` | once, before any block | `{ type, schemaVersion, disclaimer }` | Render the disclaimer; note the version (see §5) |
| `block` | one per block, as it completes | `{ type, block }` | **Append** and render the block card |
| `done` | end of turn | `{ type, sessionId }` | Finalize; persist `sessionId` |
| `error` | failure | `{ type, message }` | Show an error state |

**Guaranteed order:** `status* → meta → block* → done`. Blocks arrive **progressively** — render each as it lands for a live, card-by-card feel. Treat `block` events as **append-only**.

> **Legacy note:** if the backend feature flag `CHAT_STRUCTURED_OUTPUT` is **off**, the stream is the old format instead — `{ type: 'text', content }` deltas + `done`, no `meta`/`block`. Handle `text` if you need to support both during rollout; otherwise you can assume structured mode once the flag is on.

---

## 3. Consuming the stream

```ts
type Marker = { name: string; value: string; note?: string }

type ResponseBlock =
  | { type: 'intro'; text: string }
  | { type: 'section'; label: string }
  | {
      type: 'lab_snapshot'
      eyebrow?: string; title?: string; tag?: string; watchLabel?: string
      strengths: Marker[]
      watch: Marker[]
    }
  | {
      type: 'priority'
      num: string; title: string; strategyLabel?: string
      driver?: { markers: { label: string; value: string }[]; note?: string }
      strategy: { status: 'ok' | 'warn'; text: string }[]
      workouts: { badge: { kind: 'freq' | 'label'; value: string }; text: string; sub?: string }[]
    }
  | {
      type: 'phase_plan'
      eyebrow?: string; title?: string; tag?: string
      phases: {
        num: string; weeks: string; name: string; goal: string; retest?: boolean
        items: {
          cat: 'strength' | 'cardio' | 'nutrition' | 'hydration' | 'recovery'
          text: string; freq?: string; sub?: string
        }[]
      }[]
    }
  | { type: 'callout'; text: string }
  | {
      type: 'product_rec'          // supplement suggestions for ONE category
      label: string                // category name, e.g. "Cardiovascular"
      items: {
        name: string               // supplement name (generic, never a brand)
        dose?: string              // e.g. "1–2 g combined EPA/DHA daily"
        rationale?: string         // why it may help, tied to the markers
        caution?: string           // key caution / interaction to surface
      }[]
    }
  | { type: 'markdown'; text: string }

type ChatChunk =
  | { type: 'status'; content: string }
  | { type: 'meta'; schemaVersion: string; disclaimer: string }
  | { type: 'block'; block: ResponseBlock }
  | { type: 'done'; sessionId: string }
  | { type: 'error'; message: string }
  | { type: 'text'; content: string } // legacy path only

async function sendChat(message: string, sessionId: string | undefined, onChunk: (c: ChatChunk) => void) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message, sessionId }),
  })
  if (!res.body) throw new Error('no stream')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by a blank line.
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? '' // keep the trailing partial

    for (const evt of events) {
      const line = evt.split('\n').find((l) => l.startsWith('data:'))
      if (!line) continue
      onChunk(JSON.parse(line.slice(5).trim()) as ChatChunk)
    }
  }
}
```

Driving the UI:

```ts
const blocks: ResponseBlock[] = []
let disclaimer = ''

await sendChat(text, sessionId, (chunk) => {
  switch (chunk.type) {
    case 'status':   setStatus(chunk.content); break
    case 'meta':     disclaimer = chunk.disclaimer; break
    case 'block':    blocks.push(chunk.block); renderBlocks(blocks); break
    case 'done':     sessionId = chunk.sessionId; setStatus(''); break
    case 'error':    showError(chunk.message); break
    case 'text':     appendLegacyText(chunk.content); break // only if supporting legacy
  }
})
```

---

## 4. Block reference

Each block is one card. Fields marked `?` are optional and may be absent.

| `type` | Fields | Renders as |
|---|---|---|
| `intro` | `text` | Opening framing paragraph |
| `section` | `label` | Section header / eyebrow between blocks |
| `lab_snapshot` | `strengths[]`, `watch[]`, `eyebrow?`, `title?`, `tag?`, `watchLabel?` | Two-column panel: strengths vs. markers to watch. Each marker is `{ name, value, note? }` — e.g. `{ name: "HDL", value: "73 mg/dL", note: "higher is better" }` |
| `priority` | `num`, `title`, `driver?`, `strategy[]`, `workouts[]`, `strategyLabel?` | A numbered priority card. `driver.markers` are `{ label, value }`; `strategy` items have `status: 'ok' \| 'warn'`; `workouts` carry a `badge` |
| `phase_plan` | `phases[]`, `eyebrow?`, `title?`, `tag?` | A multi-week plan timeline. Each phase has `items` tagged by `cat` |
| `callout` | `text` | Highlighted note / "follow up with your physician" line |
| `product_rec` | `label`, `items[]` | **Supplement suggestions for one category** (see §4a). `label` is the category; each item is `{ name, dose?, rationale?, caution? }` |
| `markdown` | `text` | **Fallback.** Render the markdown string. Always safe |

`text`/`note`/`label` values may contain lightweight inline markdown (`**bold**`) — render them the same way the mockup `renderer.js` does.

> **Forward compatibility:** if you ever receive a block `type` you don't recognize (e.g. a future addition before your renderer is updated), **render nothing for it** rather than crashing — and check `meta.schemaVersion` (§5). In practice the backend only emits the types above.

---

## 4a. Supplement suggestions (`product_rec`)

When the patient asks about supplements — or has out-of-range markers that warrant one — the AI suggests supplements from a **curated, tool-backed catalog**. These arrive as `product_rec` blocks, always in a consistent layout:

1. A **`section` block** with `label: "Supplement Suggestions"` — the group header.
2. **Immediately after it**, one **`product_rec` block per category** (`Cardiovascular`, `Micronutrients`, `Metabolic`, …). Nothing is emitted between the section header and the first `product_rec`.

So the supplement portion of a response always looks like:

```
section("Supplement Suggestions")
product_rec("Cardiovascular")     ← one card group per category
product_rec("Micronutrients")
product_rec("Metabolic")
```

### `product_rec` shape

```jsonc
{
  "type": "product_rec",
  "label": "Cardiovascular",          // category = group heading
  "items": [
    {
      "name": "Omega-3 (EPA/DHA fish oil)",              // required
      "dose": "1–2 g combined EPA/DHA daily",            // optional
      "rationale": "May support a healthier lipid profile when LDL or triglycerides are elevated.",  // optional
      "caution": "Can thin the blood; important if you take anticoagulants — confirm with your doctor." // optional
    }
  ]
}
```

### Rendering guidance

- Render each `product_rec` block as a **titled group** (`label`) containing one **card per item**.
- Within a card, surface the fields as **distinct elements** — `name` as the title, `dose` as a pill/subtitle, `rationale` as body text, `caution` as a warning line. Do **not** concatenate them into one string; they're separate so you can style them.
- `dose`, `rationale`, and `caution` are each **optional** — guard for their absence.
- Treat the `section("Supplement Suggestions")` header as the anchor for the whole group (e.g. to render a bordered container around the following `product_rec` blocks).

### Safety / product notes

- **Never render a supplement the stream didn't send.** The backend is the sole source; the model cannot invent items, doses, or brands. Do not add your own.
- Names are **generic** (no brands). If you link to a store/product, map it on your side — don't infer brands from the name.
- Some markers **intentionally return no supplements** (e.g. kidney/liver markers). In that case there is simply **no `product_rec` block** and usually a `callout`/`markdown` deferring to a physician — this is expected, not an error.
- The medical `disclaimer` from `meta` still applies to the whole response, supplements included.

> **Breaking change vs. earlier drafts:** `items` was previously `string[]`. It is now an **array of objects** (`{ name, dose?, rationale?, caution? }`). If your renderer was reading items as strings, update it to read the object fields.

---

## 5. Disclaimer & schema version

- **`meta.disclaimer`** is the medical disclaimer, controlled by the backend (single source of truth for compliance wording). Render it once per response, or keep your existing persistent disclaimer banner — **the disclaimer must be visible to the patient somewhere on the chat surface.**
- **`meta.schemaVersion`** (currently `"1"`) identifies the block-contract version. If it's higher than the version your renderer was built for, fall back to a safe rendering (e.g. render only `markdown`/`intro`/`callout` text) and prompt an app update, rather than mis-rendering unknown shapes.

---

## 6. Fallback behavior (what "degraded" looks like)

If the backend's formatting step fails for any reason, it **never** fails the request — it returns the answer as a **single `markdown` block** with the disclaimer. So a valid response can legitimately be just:

```
meta  → { schemaVersion: "1", disclaimer: "..." }
block → { type: "markdown", text: "<the full answer as markdown>" }
done  → { sessionId: "..." }
```

Your renderer must handle a markdown-only response gracefully — it's the guaranteed floor.

---

## 7. Example — full stream for one turn

```
data: {"type":"status","content":"Analyzing your bloodwork..."}

data: {"type":"meta","schemaVersion":"1","disclaimer":"This is educational information based on your lab data and is not a substitute for medical advice, diagnosis, or treatment. Discuss any changes with your doctor."}

data: {"type":"block","block":{"type":"intro","text":"Based on your recent labs, here's what stands out."}}

data: {"type":"block","block":{"type":"section","label":"Positive Findings"}}

data: {"type":"block","block":{"type":"lab_snapshot","strengths":[{"name":"HDL","value":"73 mg/dL","note":"higher is better"},{"name":"LDL","value":"95 mg/dL","note":"optimal"}],"watch":[{"name":"Creatinine","value":"1.31 mg/dL","note":"slightly elevated"}]}}

data: {"type":"block","block":{"type":"section","label":"Supplement Suggestions"}}

data: {"type":"block","block":{"type":"product_rec","label":"Cardiovascular","items":[{"name":"Omega-3 (EPA/DHA fish oil)","dose":"1–2 g combined EPA/DHA daily","rationale":"May support a healthier lipid profile when LDL or triglycerides are elevated.","caution":"Can thin the blood; important if you take anticoagulants — confirm with your doctor."}]}}

data: {"type":"block","block":{"type":"product_rec","label":"Micronutrients","items":[{"name":"Vitamin D3 (cholecalciferol)","dose":"1,000–2,000 IU daily","rationale":"Supports raising a low vitamin D level toward the optimal range.","caution":"High doses can cause calcium buildup; confirm the dose with your doctor."}]}}

data: {"type":"block","block":{"type":"callout","text":"Confirm any new supplement with your physician before starting."}}

data: {"type":"done","sessionId":"3f1c9c2e-...-uuid"}
```

---

## 8. Sessions

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/chat` | Send a message; SSE stream back (this doc) |
| `GET`  | `/api/chat/sessions` | List the patient's chat sessions |

> **History rendering:** there is **no message-history endpoint wired yet.** Stored assistant messages keep the plain-text answer in `content` and the structured payload in `metadata.structured` (`{ schemaVersion, disclaimer, blocks }`). When a history endpoint is added, render past assistant messages from `metadata.structured.blocks` using the same block renderer; fall back to `content` (plain text) if `structured` is absent (older messages).

---

## 9. Rollout note

Structured output is gated by the backend flag `CHAT_STRUCTURED_OUTPUT`. During rollout the stream may still be the legacy `text` format. The safest client handles both: render `text` deltas if present, otherwise consume `meta`/`block`. Once the flag is permanently on, you can drop the legacy `text` branch.

---

**Related:** backend design & contract — [`../ai-chat/structured-output.md`](../ai-chat/structured-output.md).
