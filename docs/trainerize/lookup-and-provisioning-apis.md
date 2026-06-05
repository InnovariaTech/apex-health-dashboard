# Trainerize Lookup & Provisioning APIs — Frontend Reference

> **Audience:** Frontend developers handling Trainerize onboarding and admin flows.
> **Base path:** All routes are prefixed with `/api` (e.g. `GET /api/trainerize/org/group-id`).
> **Auth:** Every endpoint requires a valid session cookie (`apex_access_token`). A missing or invalid token returns `401`.
> **Response envelope:** All responses follow `{ success: true, data: ... }` on success and `{ success: false, message: "..." }` on error.

---

## Typical Onboarding Flow

These endpoints are typically called in sequence during patient onboarding:

```
1. GET  /trainerize/org/group-id         → confirm studio is configured
2. GET  /trainerize/users/lookup         → check if patient already exists in Trainerize
3a. POST /trainerize/me/add-user         → create new Trainerize account (if not found)
3b. POST /trainerize/me/attach           → link existing Trainerize account (if already exists)
4. POST /trainerize/me/trainer-assignment → assign a trainer to the patient
```

---

## Phase 7 — Lookup & Provisioning

---

### `GET /trainerize/org/group-id`

Returns the Trainerize studio group ID configured for this organisation. Use this to verify that the studio is properly set up before initiating any provisioning.

**Auth:** Required

**Query params:** None

**Response `data`:**

```json
{
  "groupId": "studio-group-id-string"
}
```

| Field | Type | Description |
|---|---|---|
| `groupId` | `string \| null` | Trainerize group ID; `null` if not configured for this org |

> If `groupId` is `null`, Trainerize integration is not configured for this organisation. Do not proceed with provisioning until an admin sets the org token.

---

### `GET /trainerize/users/lookup`

Searches for users in Trainerize by email or name. Use this before creating a new account to check whether the patient already exists in Trainerize.

**Auth:** Required

**Query params (at least one of `email` or `text` is required):**

| Param | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | One of | Exact email address to search — must be a valid email format |
| `text` | `string` | One of | Name or keyword search term |
| `start` | `number` | No | Pagination offset; default `0` |
| `count` | `number` | No | Page size; default `10` |
| `view` | `string` | No | Search view context; default `"recipient"` |

**Example requests:**
```
GET /api/trainerize/users/lookup?email=jane@example.com
GET /api/trainerize/users/lookup?text=Jane+Doe&start=0&count=10
```

**Response `data`:** Array of matching user profile objects. Each item:

```json
[
  {
    "id": 12345678,
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "type": "client",
    "status": "active",
    "role": "client",
    "profileName": "Jane Doe",
    "trainerID": 29586519,
    "latestSignedIn": "2026-01-10T08:30:00Z",
    "profileIconUrl": "https://...",
    "profileIconVersion": 3,
    "trialStatus": "none"
  }
]
```

| Field | Description |
|---|---|
| `id` | Trainerize user ID — use as `trainerizeUserId` in `/me/attach` |
| `firstName` / `lastName` | User's name |
| `email` | Email on file |
| `type` | `"client"` or `"trainer"` |
| `status` | Account status — e.g. `"active"` |
| `role` | Role within the studio |
| `trainerID` | Assigned trainer's Trainerize ID |
| `latestSignedIn` | Last login timestamp |

> Empty array means no match — safe to proceed with `POST /me/add-user`. If a match is found, use `POST /me/attach` instead to link the existing account.

---

### `POST /trainerize/me/add-user`

Creates a new Trainerize account for the authenticated user and links it to their Apex portal account. The user's name, email, and date of birth are pulled automatically from their Apex profile — you only need to specify the account type.

**Auth:** Required

**Response status:** `201 Created`

**Request body — creating a client:**

```json
{
  "type": "client",
  "trainerUserId": 29586519
}
```

**Request body — creating a trainer:**

```json
{
  "type": "trainer",
  "role": "admin",
  "locationId": 100
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `"client" \| "trainer"` | Yes | Account type to create |
| `trainerUserId` | `number` | No (client only) | Trainerize ID of the trainer to assign at creation; omit to create an unassigned client |
| `role` | `string` | No (trainer only) | Trainer role — defaults to `"admin"` if omitted |
| `locationId` | `number` | No (trainer only) | Studio location ID to associate the trainer with |

**Response `data`:**

```json
{
  "trainerizeUserId": 12345678
}
```

> Calling this when the user already has a linked Trainerize account returns a `400` error. Check `/me/link` first, or use `/me/attach` if the account already exists in Trainerize.

---

### `POST /trainerize/me/attach`

Links an existing Trainerize account to the authenticated user's Apex portal account. Use this when the patient already exists in Trainerize (found via `/users/lookup`) instead of creating a duplicate account.

**Auth:** Required

**Request body:**

```json
{
  "trainerizeUserId": 12345678,
  "trainerUserId": 29586519
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `trainerizeUserId` | `number` | Yes | Existing Trainerize user ID — from `/users/lookup` response |
| `trainerUserId` | `number \| null` | No | Trainerize ID of the trainer to associate; `null` to attach without a trainer |

**Response `data`:** None — returns `{ success: true }` on success.

> This only creates the portal ↔ Trainerize linkage record. It does not create a new Trainerize account or send any calls to Trainerize. To assign a trainer after attaching, call `POST /me/trainer-assignment`.

---

### `POST /trainerize/me/trainer-assignment`

Assigns (or reassigns) a trainer to the authenticated user's linked Trainerize account. Calls Trainerize's `switchTrainer` API and updates the assignment record in the portal.

**Auth:** Required

**Request body:**

```json
{
  "trainerUserId": 29586519
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `trainerUserId` | `number` | Yes | Trainerize ID of the trainer to assign — from `/trainer/studio-trainers` |

**Response `data`:** None — returns `{ success: true }` on success.

> The user must already have a linked Trainerize account (`POST /me/add-user` or `POST /me/attach`) before calling this. If no link exists, the server returns `400` with the message `"Trainerize profile is not linked for this user; add a user or attach first."`.
>
> Use `GET /trainer/studio-trainers` to get the list of available trainer IDs to present in the assignment UI.
