# Trainerize — Accomplishment Stats (Frontend Reference)

> **Audience:** Frontend developers building personal records / PR stats UI.
> **Base path:** `/api` prefix (e.g. `GET {{baseUrl}}/api/trainerize/me/accomplishments/stats`).
> **Auth:** Session cookie `apex_access_token` on every request. Missing/invalid token → `401`.
> **Envelope:** `{ success: true, data: ... }` on success; `{ success: false, message: "..." }` on error.
>
> **Prerequisite:** User must have a Trainerize link (`GET /trainerize/me/link` → `data` not `null`).

This endpoint proxies Trainerize `POST /v03/accomplishment/getStatsList` for the **linked client only**. The backend injects the client's Trainerize user ID — **do not send `userID` / `userId`**.

Use this for a **personal records / bests summary** (aggregated by record type per exercise). For a chronological trophy feed of individual events, use [`GET /trainerize/me/accomplishments`](./client-apis.md) (accomplishment list) instead.

**Related workflow:** [`../../trainerize/workflows/workflow-accomplishments-feed.md`](../../trainerize/workflows/workflow-accomplishments-feed.md)

---

## `GET /trainerize/me/accomplishments/stats`

Returns paginated accomplishment **stats** for the authenticated client, optionally filtered by category.

### Example request

```
GET {{baseUrl}}/api/trainerize/me/accomplishments/stats?category=workoutBrokenRecord&start=0&count=10
```

### Query parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category` | `string` | No | *(all categories)* | Filter by accomplishment stats category |
| `start` | `integer` | No | `0` | Pagination offset (0-based) |
| `count` | `integer` | No | Trainerize default | Page size (positive integer) |

#### `category` values

| Value | Use for |
|-------|---------|
| `workoutBrokenRecord` | Strength / workout personal records (PRs) |
| `cardioBrokenRecord` | Cardio personal records |
| `workoutMilestone` | Cumulative workout milestones (distance/time totals) |
| `cardioMilestone` | Cardio / habit streak milestones |
| `goalHabit` | Goal/habit-related stats |

For a **personal records** screen focused on lifting and workout PRs, start with `category=workoutBrokenRecord`.

---

### Success response

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "accomplishmentID": 511486070,
        "userID": 29812593,
        "itemDate": "2026-06-10 12:57:34",
        "category": "workoutBrokenRecord",
        "type": "maxReps",
        "total": 5,
        "data": {
          "dailyExerciseID": 7950673924,
          "exerciseID": 7211070,
          "exerciseName": "Band Standing Row",
          "recordType": "endurance",
          "brokenRecordType": "maxReps",
          "data": 12,
          "dataChange": 2,
          "unit": "reps"
        }
      },
      {
        "accomplishmentID": 511486069,
        "userID": 29812593,
        "itemDate": "2026-06-10 12:57:34",
        "category": "workoutBrokenRecord",
        "type": "maxLoad",
        "total": 3,
        "data": {
          "dailyExerciseID": 7950673923,
          "exerciseID": 651,
          "exerciseName": "Superband Shoulder Press",
          "recordType": "strength",
          "brokenRecordType": "maxLoad",
          "data": 432,
          "dataChange": 132,
          "unit": "lbs"
        }
      },
      {
        "accomplishmentID": 511486068,
        "userID": 29812593,
        "itemDate": "2026-06-10 12:57:34",
        "category": "workoutBrokenRecord",
        "type": "maxWeight",
        "total": 1,
        "data": {
          "dailyExerciseID": 7950673923,
          "exerciseID": 651,
          "exerciseName": "Superband Shoulder Press",
          "recordType": "strength",
          "brokenRecordType": "maxWeight",
          "data": 12,
          "dataChange": 2,
          "unit": "lbs"
        }
      },
      {
        "accomplishmentID": 511485332,
        "userID": 29812593,
        "itemDate": "2026-06-10 12:55:49",
        "category": "workoutBrokenRecord",
        "type": "tenRepMax",
        "total": 3,
        "data": {
          "dailyExerciseID": 7949771413,
          "exerciseID": 14196612,
          "exerciseName": "AFPC - TRX FIGURE 4 STRETCH",
          "recordType": "strength",
          "brokenRecordType": "tenRepMax",
          "data": 10,
          "dataChange": 5.45,
          "unit": "kg"
        }
      }
    ],
    "total": 4
  }
}
```

---

### Response `data` fields

| Field | Type | Description |
|-------|------|-------------|
| `stats` | `array` | Page of stat rows (see below) |
| `total` | `number` | Total matching rows (for pagination UI) |

### Each `stats[]` item

| Field | Type | Description |
|-------|------|-------------|
| `accomplishmentID` | `number` | Trainerize accomplishment / stat row ID |
| `userID` | `number` | Trainerize client user ID |
| `itemDate` | `string` | When the record was set — `YYYY-MM-DD HH:MM:SS` (UTC) |
| `category` | `string` | Same as request filter, e.g. `workoutBrokenRecord` |
| `type` | `string` | Record stat type — mirrors `data.brokenRecordType` for PR rows (e.g. `maxLoad`, `maxWeight`, `maxReps`, `tenRepMax`) |
| `total` | `number` | Trainerize aggregate count for this stat row (meaning varies by category; treat as opaque unless product defines otherwise) |
| `data` | `object` | Type-specific payload — for PRs, see `data` object below |

### `stats[].data` (workout / cardio broken record)

Present when `category` is `workoutBrokenRecord` or `cardioBrokenRecord`.

| Field | Type | Description |
|-------|------|-------------|
| `dailyExerciseID` | `number` | Daily exercise instance ID from the workout session |
| `exerciseID` | `number` | Trainerize exercise library ID |
| `exerciseName` | `string` | Display name for the exercise |
| `recordType` | `string` | Logging model — e.g. `strength`, `endurance`, `cardio`, `timedLongerBetter`, `timedFasterBetter` |
| `brokenRecordType` | `string` | Which PR metric was broken (see table below) |
| `data` | `number` | **Current best value** for this record type |
| `dataChange` | `number` | Improvement vs previous best (delta) |
| `unit` | `string` | Unit for `data` — e.g. `lbs`, `kg`, `reps`, `miles` |
| `time` | `number` | Optional — time in seconds (when applicable) |
| `weight` | `number` | Optional — weight value (when applicable) |

#### Common `brokenRecordType` / `type` values

| Category | `brokenRecordType` | Typical meaning |
|----------|-------------------|-----------------|
| Strength | `oneRepMax`, `threeRepMax`, `fiveRepMax`, `tenRepMax` | Rep-max estimates |
| Strength | `maxWeight`, `maxLoad` | Heaviest weight / load |
| Endurance | `maxReps` | Most reps in a set |
| Cardio | `maxSpeed`, `maxDistance` | Speed / distance PRs |
| Timed | `maxTime`, `minTime` | Longer-is-better / faster-is-better |
| Timed strength | `maxLoadTimeWeight` | Combined load/time/weight |

Same exercise can appear **multiple times** with different `type` / `brokenRecordType` (e.g. `maxLoad` and `maxWeight` for Superband Shoulder Press in the sample above).

---

## Pagination

Use `start` + `count` with `data.total`:

```typescript
const pageSize = 10
let start = 0
let allStats: StatRow[] = []

while (start < total) {
  const res = await fetch(
    `${baseUrl}/api/trainerize/me/accomplishments/stats?category=workoutBrokenRecord&start=${start}&count=${pageSize}`,
    { credentials: 'include' },
  )
  const { data } = await res.json()
  allStats = allStats.concat(data.stats ?? [])
  total = data.total
  start += pageSize
}
```

For infinite scroll, increment `start` by the number of rows returned in the previous page.

---

## UI notes

| Goal | Endpoint |
|------|----------|
| **PR stats / bests list** | `GET /me/accomplishments/stats?category=workoutBrokenRecord` (this doc) |
| **“New PR!” feed / trophy case** | `GET /me/accomplishments` — chronological events |
| **Immediate PR toast after workout** | `POST /me/daily-workouts` response → `brokenRecords[]` (no extra fetch) |

**Display tips:**

- Primary label: `data.exerciseName`
- Sub-label: humanize `data.brokenRecordType` (e.g. `tenRepMax` → “10 rep max”)
- Value: `data.data` + `data.unit`
- Optional badge: `+${data.dataChange} ${data.unit}` when `dataChange > 0`
- Date: parse `itemDate` as UTC

**Gate:** If `GET /me/link` returns `data: null`, hide Trainerize PR UI or show connect/onboarding.

---

## Errors

| HTTP | `message` (typical) | Cause |
|------|---------------------|-------|
| `401` | Unauthorized | Missing or expired session |
| `400` | Validation error | Invalid `category`, negative `start`, etc. |
| `404` / integration errors | Trainerize not linked or upstream failure | No `auth_external_token` Trainerize row for user |

Invalid `category` values are rejected by the backend (must be one of the enum values listed above).

---

## TypeScript sketch

```typescript
type AccomplishmentStatsCategory =
  | 'goalHabit'
  | 'workoutBrokenRecord'
  | 'workoutMilestone'
  | 'cardioBrokenRecord'
  | 'cardioMilestone'

interface WorkoutBrokenRecordData {
  dailyExerciseID: number
  exerciseID: number
  exerciseName: string
  recordType: string
  brokenRecordType: string
  data: number
  dataChange: number
  unit: string
  time?: number
  weight?: number
}

interface AccomplishmentStatRow {
  accomplishmentID: number
  userID: number
  itemDate: string
  category: AccomplishmentStatsCategory
  type: string
  total: number
  data: WorkoutBrokenRecordData // narrow by category in app code
}

interface AccomplishmentStatsResponse {
  success: true
  data: {
    stats: AccomplishmentStatRow[]
    total: number
  }
}
```

---

## See also

| Doc | Topic |
|-----|-------|
| [`daily-workouts-flows.md`](./daily-workouts-flows.md) | Workout completion + immediate `brokenRecords` |
| [`../../trainerize/workflows/workflow-accomplishments-feed.md`](../../trainerize/workflows/workflow-accomplishments-feed.md) | Accomplishments vs stats |
| [`../../trainerize/api-reference/accomplishment/getStatsList.md`](../../trainerize/api-reference/accomplishment/getStatsList.md) | Upstream Trainerize API notes |
