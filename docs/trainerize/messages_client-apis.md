# Trainerize Messages — Frontend API Reference

> **Audience:** Frontend developers integrating with the Apex Patient Portal backend.  
> **Base path:** All routes are prefixed with `/api` (e.g. `GET /api/trainerize/me/message-threads`).  
> **Auth:** Valid session cookie (`apex_access_token`). Send requests with `credentials: 'include'`. Missing or invalid session → `401`.  
> **Response envelope:** Success → `{ success: true, data: ... }`. Error → `{ success: false, message: "..." }`.

---

## Prerequisites

1. User must be logged in (Apex session cookie).
2. User must have a Trainerize account link. Check first:

```
GET /api/trainerize/me/link
```

If `data` is `null`, do not call the endpoints below — complete Trainerize onboarding (`POST /api/trainerize/me/add-user` or `POST /api/trainerize/me/attach`). See `Documentation/frontend/trainerize/lookup-and-provisioning-apis.md`.

**Server-injected fields:** The backend resolves the linked Trainerize client ID. Do **not** send `userID`, `senderUserId`, or `ownerUserId` from the frontend.

---

## Recommended UI flow

```
GET /me/link  →  linked?
GET /me/message-threads  →  pick thread
GET /me/message-threads/messages?threadId=  →  list messages
GET /me/messages?messageId=  →  single message detail (optional)
POST /me/messages/send  →  new conversation
POST /me/messages/reply  →  reply in thread
```

---

## Endpoints

### `GET /trainerize/me/message-threads`

Paginated inbox (or other view) for the authenticated client.

| Query param | Type | Required | Description |
|---|---|---|---|
| `view` | `string` | **Yes** | Thread filter. Use `"inbox"` for the main inbox. |
| `start` | `number` | **Yes** | Pagination offset. Start at `0`. |
| `count` | `number` | **Yes** | Page size (positive integer). |

**Example:**

```
GET /api/trainerize/me/message-threads?view=inbox&start=0&count=20
```

**Response `data`:** Trainerize thread list (passthrough). Typical fields per thread:

| Field | Description |
|---|---|
| `threadID` / `id` | Use as `threadId` for messages endpoint |
| `subject` | Thread subject |
| `lastMessage` | Latest message preview |
| `unreadCount` | Unread count |
| `participants` | Users in the thread |

Paginate: increase `start` by `count` until a page returns fewer than `count` items.

---

### `GET /trainerize/me/message-threads/messages`

Messages inside one thread.

| Query param | Type | Required | Description |
|---|---|---|---|
| `threadId` | `number` | **Yes** | From thread list |
| `start` | `number` | **Yes** | Pagination offset |
| `count` | `number` | **Yes** | Page size |

**Example:**

```
GET /api/trainerize/me/message-threads/messages?threadId=98765&start=0&count=20
```

**Response `data`:** Array of message objects (Trainerize shape). Common fields: `id`, `body`, `sentTime`, `sender`, `type`, `isRead`.

---

### `GET /trainerize/me/messages`

Full detail for a single message.

| Query param | Type | Required | Description |
|---|---|---|---|
| `messageId` | `number` | **Yes** | Message ID |

**Example:**

```
GET /api/trainerize/me/messages?messageId=12345
```

**Response `data`:** Single message object. May include nested `sender`, `attachment`, `linkInfo`, `productInfo`, `workoutInfo`, `reactions`, `appearRoom`. `body` is HTML-encoded from Trainerize.

---

### `POST /trainerize/me/messages/send`

Starts a new thread. Sender is the linked client.

**Status:** `201 Created`

**Request body (JSON):**

```json
{
  "recipients": [29586519],
  "subject": "Question about my program",
  "body": "Hi coach, I had a question about...",
  "threadType": "mainThread",
  "conversationType": "single",
  "type": "text"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `recipients` | `number[]` | **Yes** | Trainerize user IDs (e.g. assigned trainer). Min length 1. |
| `subject` | `string` | **Yes** | Thread subject |
| `body` | `string` | **Yes** | Message body |
| `threadType` | `string` | No | `"mainThread"` \| `"otherThread"` |
| `conversationType` | `string` | No | `"single"` \| `"group"` |
| `type` | `string` | No | `"text"` \| `"appear"` |
| `appearRoom` | `string` | No | Required when `type` is `"appear"` |

**Response `data`:** Typically includes `threadID` and/or `threads[]` with `threadID`, `messageID`.

---

### `POST /trainerize/me/messages/reply`

Replies in an existing thread.

**Status:** `200 OK`

**Request body (JSON):**

```json
{
  "threadId": 98765,
  "body": "Thanks for the update!",
  "type": "text"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `threadId` | `number` | **Yes** | Parent thread ID |
| `body` | `string` | **Yes** | Reply text |
| `type` | `string` | No | `"text"` \| `"appear"` |
| `appearRoom` | `string` | No | When `type` is `"appear"` |

**Response `data`:** Typically `messageID` and optional `linkInfo`.

---

## Error handling

| HTTP | When |
|---|---|
| `401` | No valid Apex session |
| `404` | No Trainerize link for this user |
| `400` | Invalid query/body (Zod validation) |
| `502` | Trainerize Partner API failure (message in `message`) |

---

## TypeScript fetch example

```typescript
const res = await fetch('/api/trainerize/me/message-threads?view=inbox&start=0&count=20', {
  credentials: 'include',
})
const json = await res.json()
if (!json.success) throw new Error(json.message)
const threads = json.data
```

---

## Related docs

- Provisioning: `Documentation/frontend/trainerize/lookup-and-provisioning-apis.md`
- Broader client surface: `Documentation/frontend/trainerize/client-apis.md` (Phases 1–4)
