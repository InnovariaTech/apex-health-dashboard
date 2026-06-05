# Trainerize Habits — Frontend API Reference

> **Audience:** Frontend developers integrating with the Apex Patient Portal backend.  
> **Base path:** All routes are prefixed with `/api`.  
> **Auth:** Session cookie `apex_access_token` with `credentials: 'include'`.  
> **Response envelope:** `{ success: true, data: ... }` or `{ success: false, message: "..." }`.

---

## Prerequisites

```
GET /api/trainerize/me/link
```

If `data` is `null`, complete Trainerize linking before calling habits APIs.

**Server-injected fields:** Do **not** send `userID` or `clientUserId`. The backend injects the linked Trainerize client ID on every call.

---

## Recommended UI flow

```
GET /me/habits?status=current  →  habit list + streaks
POST /me/habits  →  create habit (returns habit id)
GET /me/habits/daily-items?dailyItemId=  →  today’s item detail
PUT /me/habits/daily-items  →  mark tracked (streak / milestone in response)
DELETE /me/habits/daily-items  →  remove daily item
```

---

## Endpoints

### `GET /trainerize/me/habits`

List habits for the linked client.

| Query param | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | No | `"current"` (default on Trainerize), `"upcoming"`, `"past"` |
| `start` | `number` | No | Pagination offset |
| `count` | `number` | No | Page size |

**Example:**

```
GET /api/trainerize/me/habits?status=current&start=0&count=10
```

**Response `data`:** Object with `total` and `habits[]`. Each habit may include:

| Field | Description |
|---|---|
| `id` | Habit ID |
| `type` | Habit type (see add endpoint for enum) |
| `name` | Display name |
| `startDate` / `endDate` | `YYYY-MM-DD` |
| `currentStreak` / `longestStreak` | Streak counters |
| `totalItems` / `totalCompleted` | Progress in period |
| `repeatDetail.dayOfWeeks` | e.g. `["monday", "wednesday"]` |
| `habitsDetail.nutritionPortion` | Portion guide settings |

---

### `POST /trainerize/me/habits`

Create a habit for the linked client.

**Status:** `201 Created`

**Request body (JSON):**

```json
{
  "type": "customHabit",
  "name": "Drink 8 glasses of water",
  "startDate": "2026-06-01",
  "durationType": "week",
  "duration": 4,
  "repeatDetail": {
    "dayOfWeeks": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | **Yes** | Habit type (see below) |
| `name` | `string` | No | Required for `customHabit` |
| `customTypeId` | `number` | No | Custom type from Habits Master Library |
| `startDate` | `string` | No | `YYYY-MM-DD` |
| `durationType` | `string` | No | e.g. `"week"` |
| `duration` | `number` | No | Positive integer |
| `repeatDetail` | `object` | No | `{ dayOfWeeks?: string[] }` |
| `habitsDetail` | `object` | No | `{ nutritionPortion?: { numberOfMeals?, showHandPortionGuide?, carbs?, protein?, fat?, veggies? } }` |

**Common `type` values:** `customHabit`, `eatProtein`, `eatGoodFat`, `eatComplexCarb`, `eatVeggie`, `followPortionGuide`, `practiceEatingSlowly`, `eatUntilAlmostFull`, `prepareYourOwnMeal`, `drinkOnlyZeroCalorieDrink`, `abstainFromAlcohol`, `takeAMoreActiveRoute`, `makeItEasierToWorkout`, `doAnEnjoyableActivity`, `recruitSocialSupport`, `rewardYourselfAfterAWorkout`, `prioritizeSelfCare`, `celebrateAWin`, `digitalDetoxOneHourBeforeBed`, `practiceBedtimeRitual`.

**Response `data`:** Typically `{ id: number }` (new habit ID).

---

### `GET /trainerize/me/habits/daily-items`

Fetch one daily habit item.

| Query param | Type | Required | Description |
|---|---|---|---|
| `dailyItemId` | `number` | **Yes** | Daily item ID |

**Example:**

```
GET /api/trainerize/me/habits/daily-items?dailyItemId=456
```

**Response `data`:** Daily item with `id`, `date`, `status` (`scheduled` \| `tracked`), nested `habit[]`, etc.

---

### `PUT /trainerize/me/habits/daily-items`

Track (complete) a daily item.

**Request body (JSON):**

```json
{
  "dailyItemId": 456,
  "status": "tracked"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `dailyItemId` | `number` | **Yes** | Daily item ID |
| `status` | `string` | No | e.g. `"tracked"` |

**Response `data`:** Streak update object, e.g. `currentStreak`, `longestStreak`, `milestoneHabit`, `nextMilestone`, `streakBroken`.

---

### `DELETE /trainerize/me/habits/daily-items`

Delete a daily habit item.

**Note:** This route uses **DELETE with a JSON body** (not query params).

**Request body (JSON):**

```json
{
  "dailyItemId": 456
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `dailyItemId` | `number` | **Yes** | Daily item ID |

**Example (fetch):**

```typescript
await fetch('/api/trainerize/me/habits/daily-items', {
  method: 'DELETE',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ dailyItemId: 456 }),
})
```

**Response `data`:** Trainerize passthrough (often empty or status object).

---

## Error handling

| HTTP | When |
|---|---|
| `401` | No Apex session |
| `404` | No Trainerize link |
| `400` | Validation error (missing `type`, invalid IDs, etc.) |
| `502` | Trainerize upstream error |

---

## Related docs

- Partner reference: `Documentation/trainerize/api-reference/habits/`
- General client APIs: `Documentation/frontend/trainerize/client-apis.md`
