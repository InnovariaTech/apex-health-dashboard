# Trainerize — Nutrition, Photos & Appointments (Frontend Reference)

> **Audience:** Frontend developers.
> **Base path:** `/api` prefix (e.g. `GET /api/trainerize/me/nutrition/logs`).
> **Auth:** Session cookie `apex_access_token` on every request. Missing/invalid token → `401`.
> **Envelope:** `{ success: true, data: ... }` on success; `{ success: false, message: "..." }` on error.
>
> **Prerequisite:** User must have a Trainerize link (`GET /trainerize/me/link` → `data` not `null`).

These endpoints proxy the Trainerize Partner API for the **linked client only**. Do **not** send Trainerize `userID` / `userId` — the backend injects the linked client's ID.

---

## Daily nutrition

### `GET /trainerize/me/nutrition/logs`

Nutrition log summaries for a date range (Trainerize `dailyNutrition/getList`).

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `startDate` | `string` | No | Start datetime, e.g. `2026-06-01 00:00:00` |
| `endDate` | `string` | No | End datetime, e.g. `2026-06-07 23:59:59` |

**Example:**
```
GET /api/trainerize/me/nutrition/logs?startDate=2026-06-01%2000:00:00&endDate=2026-06-07%2023:59:59
```

**Response `data`:** Trainerize payload — typically `{ nutrition: [...] }` with daily summaries (calories, macros, meal names; list view omits full food detail).

---

### `GET /trainerize/me/nutrition`

Single-day nutrition detail with meals and foods (Trainerize `dailyNutrition/get`).

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | No | Date, e.g. `2026-06-03` |
| `nutritionId` | `number` | No | Daily nutrition entry ID (alternative to `date`) |

Provide `date` and/or `nutritionId` (at least one recommended).

**Example:**
```
GET /api/trainerize/me/nutrition?date=2026-06-03
```

**Response `data`:** Trainerize payload — `{ nutrition: { ... } }` with `meals[]`, `foods[]`, goals, etc.

---

### `GET /trainerize/me/nutrition/custom-foods`

Paginated custom (and system) food library (Trainerize `dailyNutrition/getCustomFoodList`).

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `searchTerm` | `string` | No | Search keyword |
| `sort` | `string` | No | `lastModified` \| `name` \| `calories` |
| `start` | `number` | No | Pagination offset (default `0`) |
| `count` | `number` | No | Page size |
| `groupId` | `number` | No | Studio group ID (rare; usually omit) |

**Example:**
```
GET /api/trainerize/me/nutrition/custom-foods?start=0&count=20&sort=name
```

**Response `data`:** `{ foods: [...], total: number }`

---

### `POST /trainerize/me/nutrition/custom-foods`

Create a custom food (Trainerize `dailyNutrition/addCustomFood`).

**Response status:** `201 Created`

**Request body:**

```json
{
  "name": "Homemade protein shake",
  "barcode": "optional-unique-barcode",
  "serving": [
    {
      "name": "1 serving",
      "amount": 1,
      "nutrients": [
        { "nutrNo": 208, "nutrVal": 250 },
        { "nutrNo": 203, "nutrVal": 30 },
        { "nutrNo": 205, "nutrVal": 10 },
        { "nutrNo": 204, "nutrVal": 5 }
      ]
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | No | Food name |
| `barcode` | `string` | No | Must be unique within the studio group |
| `groupId` | `number` | No | Group-level food (usually omit) |
| `serving` | `array` | No | Serving definitions |
| `serving[].name` | `string` | No | Serving label |
| `serving[].amount` | `number` | No | Integer amount |
| `serving[].nutrients` | `array` | No | Nutrient rows |
| `serving[].nutrients[].nutrNo` | `number` | Yes* | USDA-style nutrient ID (Trainerize whitelist) |
| `serving[].nutrients[].nutrVal` | `number` | Yes* | Nutrient value |

\*Required when `nutrients` is present.

**Common `nutrNo` values:**

| `nutrNo` | Nutrient |
|---:|---|
| 208 | Calories (kcal) |
| 203 | Protein (g) |
| 204 | Total fat (g) |
| 205 | Carbohydrates (g) |
| 291 | Fiber (g) |
| 307 | Sodium (mg) |

Invalid `nutrNo` → **400** from Apex before Trainerize is called.

**Response `data`:** `{ foodId, code, message }`

---

### `PUT /trainerize/me/nutrition/custom-foods`

Update a custom food (Trainerize `dailyNutrition/setCustomFood`).

**Request body:**

```json
{
  "foodId": 12345,
  "name": "Updated shake name",
  "serving": [
    {
      "name": "1 serving",
      "amount": 1,
      "weight": 250,
      "nutrients": [
        { "nutrNo": 208, "nutrVal": 260 }
      ]
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `foodId` | `number` | Yes | Food ID from list or add response |
| `name` | `string` | No | Updated name |
| `barcode` | `string` | No | Updated barcode |
| `serving` | `array` | No | Same shape as POST; `weight` (grams) supported on set |

---

### `DELETE /trainerize/me/nutrition/custom-foods`

Delete a custom food (Trainerize `dailyNutrition/deleteCustomFood`).

**Request body:**

```json
{
  "foodId": 12345
}
```

| Field | Type | Required |
|---|---|---|
| `foodId` | `number` | Yes |

---

## Progress photos

Existing routes (for context):

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/trainerize/me/photos` | List photos by date range (`startDate`, `endDate`) |
| `POST` | `/trainerize/me/photos` | Upload photo (multipart: `file`, `date`, `pose`) |

### `GET /trainerize/me/photos/detail`

Fetch one progress photo by ID (Trainerize `photos/getByID`). Trainerize returns **binary**; Apex encodes it as **base64** in the standard envelope.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `photoId` | `number` | Yes | From `GET /photos` → `photos[].id` |
| `thumbnail` | `boolean` | No | `true` for thumbnail; default `false` |

**Example:**
```
GET /api/trainerize/me/photos/detail?photoId=12345&thumbnail=false
```

**Response `data`:**

```json
{
  "photoId": 12345,
  "thumbnail": false,
  "contentType": "image/jpeg",
  "base64": "/9j/4AAQSkZJRg..."
}
```

**Display in browser / React Native:**

```javascript
const src = `data:${data.contentType};base64,${data.base64}`;
// <img src={src} alt="Progress" />
```

Use `thumbnail=true` in grids; full size for detail view.

**Errors:** Unknown photo → **404**.

---

## Appointments

Existing read routes:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/trainerize/me/appointments` | List appointments (`startDate`, `endDate`) |
| `GET` | `/trainerize/me/appointment-types` | List bookable types |
| `GET` | `/trainerize/me/appointment-types/detail` | Type detail (`appointmentTypeId`) |

### `POST /trainerize/me/appointments`

Book an appointment (Trainerize `appointment/add`).

**Response status:** `201 Created`

**Request body:**

```json
{
  "userId": 29586519,
  "startDate": "2026-06-10T14:00:00",
  "endDate": "2026-06-10T15:00:00",
  "appointmentTypeId": 123,
  "notes": "Initial consult",
  "attendents": [
    { "userId": 12345678 }
  ],
  "actionInfo": {
    "isVideoCall": true,
    "isRecurring": false
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `userId` | `number` | Yes | **Trainer's** Trainerize ID — use `trainerID` from `GET /me/settings` |
| `startDate` | `string` | Yes | UTC datetime |
| `endDate` | `string` | Yes | UTC datetime |
| `appointmentTypeId` | `number` | Yes | From appointment types list |
| `notes` | `string` | No | Appointment notes |
| `attendents` | `{ userId }[]` | No | Attendees — client should use linked `trainerizeUserId` from `/me/link` |
| `actionInfo` | `object` | No | Video call, recurrence, etc. |

**Validation (server):**

- `userId` must match the client's assigned trainer (`settings.trainerID`).
- Each `attendents[].userId` must equal the linked client's Trainerize ID.

**Response `data`:** `{ id: number }` — new appointment ID.

**Optional recurrence (`actionInfo.recurrencePattern`):**

```json
{
  "actionInfo": {
    "isRecurring": true,
    "recurrencePattern": {
      "frequency": "weekly",
      "duration": 4,
      "totalCount": 4,
      "repeatWeekly": {
        "every": 1,
        "weekDays": ["monday", "wednesday"]
      }
    }
  }
}
```

---

## Error reference

| HTTP | Typical cause |
|---|---|
| `400` | Invalid query/body (Zod), invalid `nutrNo`, appointment validation |
| `401` | Missing or expired session |
| `404` | No Trainerize link; photo/appointment not found |
| `502` | Trainerize Partner API error |

---

## Suggested UI flows

**Nutrition journal:** `GET /nutrition/logs` (range) → tap day → `GET /nutrition?date=...`

**Log custom food:** `GET /nutrition/custom-foods` → create → `POST /nutrition/custom-foods` → edit → `PUT` → delete → `DELETE`

**Progress photos:** `GET /photos?startDate&endDate` → grid with `thumbnail=true` on detail endpoint → full view with `thumbnail=false`

**Book appointment:** `GET /appointment-types` → pick type → `POST /appointments` with trainer + client IDs from settings/link
