# Trainerize — Health Data (Frontend Reference)

> **Audience:** Frontend developers.
> **Base path:** `/api` prefix (e.g. `GET /api/trainerize/me/health-data`).
> **Auth:** Session cookie `apex_access_token` on every request. Missing/invalid token → `401`.
> **Envelope:** `{ success: true, data: ... }` on success; `{ success: false, message: "..." }` on error.
>
> **Prerequisite:** User must have a Trainerize link (`GET /trainerize/me/link` → `data` not `null`).

These endpoints proxy the Trainerize Partner API for the **linked client only**. Do **not** send Trainerize `userID` — the backend injects the linked client's ID.

**Upstream:** `POST /v03/healthData/getList` and `POST /v03/healthData/getListSleep` (read-only; data synced from wearables).

---

## Overview

Health data is **wearable-synced metrics** — steps, resting heart rate, sleep, blood pressure, and calorie burn. Clients connect Apple Health, Google Health Connect, Fitbit, or Withings in the **Trainerize mobile app**; the portal reads that data here.

| Concept | API | Writable? |
|---------|-----|-----------|
| Wearable-synced steps, HR, BP, calories | `GET /me/health-data` | No — read only |
| Wearable-synced sleep segments | `GET /me/health-data/sleep` | No — read only |
| Manually logged weight, body fat, BP | `PUT /me/bodystats` | Yes |
| Connection status hints | `GET /me/settings` | Read only |

---

## `GET /trainerize/me/health-data`

Returns daily health metric entries for a date range and metric type.

**Auth:** Required

**Query params:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `type` | `string` | No | `step` | Metric to fetch (see table below) |
| `startDate` | `string` | No | — | Range start, format `YYYY-MM-DD` |
| `endDate` | `string` | No | — | Range end, format `YYYY-MM-DD` |

### `type` values

| `type` | `data` fields in response | Typical source |
|--------|---------------------------|----------------|
| `step` | `steps` (integer) | Apple Health, Google Health Connect, Fitbit |
| `restingHeartRate` | `restingHeartRate` (bpm) | Wearable sync |
| `sleep` | **Use `/me/health-data/sleep` instead** | Wearable sync |
| `bloodPressure` | `systolic`, `diastolic` | Wearable sync |
| `calorieOut` | `restingEnergy`, `activeEnergy` (calories) | Wearable sync |

One `type` per request. To show steps and blood pressure, call the endpoint twice with different `type` values.

> **Sleep:** Do not use `type=sleep` on this route for production UI. Use **`GET /me/health-data/sleep`** below.

### Example requests (general metrics)

**Today's steps:**
```
GET /api/trainerize/me/health-data?type=step&startDate=2026-06-17&endDate=2026-06-17
```

**Weekly steps chart:**
```
GET /api/trainerize/me/health-data?type=step&startDate=2026-06-10&endDate=2026-06-17
```

**Resting heart rate (7 days):**
```
GET /api/trainerize/me/health-data?type=restingHeartRate&startDate=2026-06-10&endDate=2026-06-17
```

**Blood pressure:**
```
GET /api/trainerize/me/health-data?type=bloodPressure&startDate=2026-06-01&endDate=2026-06-17
```

**Calorie burn:**
```
GET /api/trainerize/me/health-data?type=calorieOut&startDate=2026-06-17&endDate=2026-06-17
```

### Response `data`

```json
{
  "isTracked": true,
  "healthData": [
    {
      "healthDataID": 98765,
      "type": "step",
      "date": "2026-06-17",
      "data": {
        "steps": 8432
      }
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `isTracked` | `boolean` | Whether this metric type is actively synced for the user |
| `healthData` | `array` | Daily entries in the requested range (may be empty) |

#### `healthData[]` entry

| Field | Type | Description |
|---|---|---|
| `healthDataID` | `number` | Unique entry ID |
| `type` | `string` | Same enum as query `type` |
| `date` | `string` | `YYYY-MM-DD` |
| `data` | `object` | Type-specific payload (only relevant keys populated) |

#### `data` by type

| `type` | `data` shape |
|--------|----------------|
| `step` | `{ "steps": 8432 }` |
| `restingHeartRate` | `{ "restingHeartRate": 62 }` |
| `bloodPressure` | `{ "systolic": 120, "diastolic": 80 }` |
| `calorieOut` | `{ "restingEnergy": 1800, "activeEnergy": 450 }` |
| `sleep` | Use **`GET /me/health-data/sleep`** — not this route |

### `isTracked: false`

When `isTracked` is `false`, `healthData` may be an empty array even if you pass a valid date range. This usually means:

- The user has not connected a wearable in the Trainerize app, or
- The specific metric type is not enabled in their Health Connect / Apple Health permissions.

**UI guidance:** Show an empty state with copy like “Connect Apple Health or Fitbit in the Trainerize app to sync steps” — not a hard error.

---

## `GET /trainerize/me/health-data/sleep`

Returns wearable-synced **sleep segments** for a datetime range (Trainerize `healthData/getListSleep`). Each row is a time range (`startTime` → `endTime`), not a daily rollup.

**Auth:** Required

**Query params:**

| Param | Type | Required | Format |
|---|---|---|---|
| `startTime` | `string` | No | Range start, `YYYY-MM-DD HH:MM:SS` |
| `endTime` | `string` | No | Range end, `YYYY-MM-DD HH:MM:SS` |

> Request range uses **`startTime`** + **`endTime`** (confirmed via live Partner API).

**Example — last 7 nights:**
```
GET /api/trainerize/me/health-data/sleep?startTime=2026-06-10%2000:00:00&endTime=2026-06-17%2023:59:59
```

**Response `data`:**

```json
{
  "isTracked": true,
  "healthData": [
    {
      "startTime": "2026-06-16 23:10:00",
      "endTime": "2026-06-17 06:45:00",
      "type": "asleep"
    }
  ]
}
```

| Field | Description |
|---|---|
| `isTracked` | Whether sleep sync is active for the user |
| `healthData[].startTime` | Segment start (`YYYY-MM-DD HH:MM:SS`) |
| `healthData[].endTime` | Segment end |
| `healthData[].type` | Sleep state, typically `asleep` |

**UI notes:**

- One night may have **multiple segments** (interrupted sleep) — sum `(endTime - startTime)` per local night for total sleep.
- No `healthDataID` — key list items by `startTime` + `endTime`.
- If `isTracked: false`, show connect-wearable empty state.

---

## Checking wearable connection (optional)

Before or alongside health-data calls, you can hint at sync status via settings:

```
GET /api/trainerize/me/settings
```

| Field | Meaning |
|---|---|
| `fitbitConnected` | Fitbit linked in Trainerize |
| `withingsConnected` | Withings linked in Trainerize |
| `mfpConnected` | MyFitnessPal (nutrition, not steps) |

`isTracked` on the health-data response is the **authoritative** flag per metric type.

---

## Suggested UI flows

### Today dashboard — steps card

```
1. GET /me/link          → gate Trainerize UI
2. GET /me/health-data?type=step&startDate={today}&endDate={today}
3. Display healthData[0]?.data.steps ?? "—"
```

### Weekly steps chart

```
GET /me/health-data?type=step&startDate={monday}&endDate={sunday}
→ map healthData[] to chart points by date
```

### Vitals overview (parallel loads)

```text
GET /me/health-data?type=step&startDate=today&endDate=today
GET /me/health-data?type=restingHeartRate&startDate=today&endDate=today
GET /me/health-data?type=bloodPressure&startDate={last7days}&endDate=today
GET /me/health-data/sleep?startTime={weekStart}%2000:00:00&endTime={weekEnd}%2023:59:59
GET /me/bodystats?date=today&unitWeight=kg&unitBodystats=cm   ← manual weight
```

Use **health-data** for synced vitals; **bodystats*http://localhost:5000* for user-entered weight/body fat.

---

## Health data vs bodystats

| Metric | Wearable sync (`/me/health-data`) | Manual log (`/me/bodystats`) |
|--------|-----------------------------------|------------------------------|
| Steps | `type=step` → `data.steps` | Not available |
| Resting HR | `type=restingHeartRate` | Not available |
| Blood pressure | `type=bloodPressure` | `bodyMeasures.bloodPressureSystolic/Diastolic` |
| Weight | May sync via Apple Health into Trainerize | `bodyMeasures.bodyWeight` |
| Body fat % | May sync via wearable | `bodyMeasures.bodyFatPercent` |
| Lean mass | Not on health-data | Computed in bodystats response only |
| Sleep | `GET /me/health-data/sleep` (segments) | Not available |

For weight goals, prefer **`PUT /me/bodystats`** — that drives Trainerize weight-goal progress.

For sleep charts, use **`GET /me/health-data/sleep`** — not `type=sleep` on `/me/health-data`.

---

## Error reference

| HTTP | Typical cause |
|---|---|
| `400` | Invalid query — bad `type` or date/datetime format |
| `401` | Missing or expired session |
| `404` | No Trainerize link (`GET /me/link` returns `null`) |
| `502` | Trainerize Partner API error |

---

## TypeScript-friendly shapes (reference)

```typescript
type HealthDataType =
  | 'step'
  | 'restingHeartRate'
  | 'sleep'
  | 'bloodPressure'
  | 'calorieOut'

interface HealthDataEntry {
  healthDataID: number
  type: HealthDataType
  date: string // YYYY-MM-DD
  data: {
    steps?: number
    restingHeartRate?: number
    systolic?: number
    diastolic?: number
    restingEnergy?: number
    activeEnergy?: number
    // sleep: extend after live response capture
  }
}

interface HealthDataResponse {
  isTracked: boolean
  healthData: HealthDataEntry[]
}

interface HealthDataSleepEntry {
  startTime: string // YYYY-MM-DD HH:MM:SS
  endTime: string
  type: string // e.g. 'asleep'
}

interface HealthDataSleepResponse {
  isTracked: boolean
  healthData: HealthDataSleepEntry[]
}
```

---

## Related documentation

| Document | Purpose |
|----------|---------|
| `Documentation/trainerize/api-reference/health-data/health-data-list.md` | Raw Trainerize Partner API reference |
| `Documentation/trainerize/api-reference/health-data/sleep-data.md` | Sleep segments (`getListSleep`) |
| `Documentation/frontend/trainerize/client-apis.md` | Full `/me/*` route index (includes health-data summary) |
| `Documentation/frontend/trainerize/nutrition-photos-appointments-apis.md` | Nutrition logging (separate from calorie burn) |
| `Documentation/trainerize/workflows/workflow-client-daily-hub.md` | Today view composition |
