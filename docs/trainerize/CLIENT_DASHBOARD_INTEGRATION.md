# Client — Patient Dashboard Integration Guide

> **Audience:** Frontend agent building the Client-Facing Patient Dashboard.
> **Base path:** All routes are prefixed with `/api` (e.g. `GET /api/trainerize/me/link`).
> **Auth:** Every request must include the session cookie `apex_access_token`. A missing or invalid token returns `401`.
> **Response envelope:**
> - Success → `{ success: true, data: ... }`
> - Error → `{ success: false, message: "..." }`

---

## Entry Point — Always Check Linkage First

Before rendering any Trainerize features in the client dashboard, check whether the user has a linked Trainerize account.

### `GET /api/trainerize/me/link`

**Purpose:** Check if the authenticated client has a connected Trainerize account.

**Request:**
```
GET /api/trainerize/me/link
```

**Response `data`:**
```json
{
  "authUserId": "uuid-string",
  "trainerizeUserId": 12345678,
  "groupId": "studio-group-id",
  "trainerUserId": 29586519,
  "assignmentStatus": "assigned"
}
```

| Field | Type | Description |
|---|---|---|
| `authUserId` | `string` | Internal Apex user ID |
| `trainerizeUserId` | `number` | Trainerize user ID for this client |
| `groupId` | `string` | Trainerize studio/group ID |
| `trainerUserId` | `number \| null` | Assigned trainer's ID; `null` if not yet assigned |
| `assignmentStatus` | `string` | `"assigned"` `"pending"` `"unassigned"` |

> If `data` is `null` → the client has no Trainerize account. Show an onboarding prompt or contact-admin message. Do not load any other Trainerize endpoints.

---

## Section 1 — Profile & Settings

---

### Get Client Profile

**`GET /api/trainerize/me/profile`**

**Purpose:** Display the client's Trainerize profile — name, email, account status.

**Request:**
```
GET /api/trainerize/me/profile
```

**Response `data`:**
```json
{
  "trainerizeUserId": 12345678,
  "email": "patient@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "status": "active"
}
```

| Field | Type | Description |
|---|---|---|
| `trainerizeUserId` | `number` | Trainerize user ID |
| `email` | `string \| null` | Email on file |
| `firstName` | `string \| null` | First name |
| `lastName` | `string \| null` | Last name |
| `status` | `string \| null` | e.g. `"active"` |

> If `data` is `null`, the user is not linked — fall back to the linkage check.

---

### Get Account Settings

**`GET /api/trainerize/me/settings`**

**Purpose:** Fetch unit preferences, notification preferences, and third-party connection statuses. Call once on dashboard load and store in app state — these values drive all unit display throughout the dashboard.

**Request:**
```
GET /api/trainerize/me/settings
```

**Response `data` — key fields:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "timezone": -5,
  "unitWeight": "lbs",
  "unitDistance": "miles",
  "unitBodystat": "inches",
  "reminderTime": 8,
  "trainerID": 29586519,
  "email": {
    "newMessage": true,
    "reminders": true,
    "paymentEvent": true
  },
  "notification": {
    "newMessage": true,
    "reminders": true,
    "paymentEvent": true
  },
  "timeline": {
    "showMissWorkout": true
  }
}
```

| Field | Description |
|---|---|
| `unitWeight` | `"lbs"` or `"kg"` — use for all weight display across the dashboard |
| `unitDistance` | `"miles"` or `"km"` — use for all distance display |
| `unitBodystat` | `"inches"` or `"cm"` — use for all body measurement display |
| `timezone` | UTC offset in hours |
| `trainerID` | Assigned trainer's Trainerize ID |
| `email` | Per-event email notification toggles |
| `notification` | Per-event push notification toggles |
| `timeline.showMissWorkout` | Whether to show missed workouts on timeline |

> **Important:** Always pass `unitWeight`, `unitDistance`, and `unitBodystat` from this response as query params to `/me/calendar`, `/me/bodystats`, and other endpoints that accept unit params.

---

## Section 2 — Calendar, Training Plans & Programs

---

### Get Activity Calendar

**`GET /api/trainerize/me/calendar`**

**Purpose:** Display the client's workout/cardio/rest schedule for a date range. Use for the main calendar view.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `startDate` | `string` | Yes | Format `YYYY-MM-DD` |
| `endDate` | `string` | Yes | Format `YYYY-MM-DD` |
| `unitDistance` | `string` | Yes | `"miles"` or `"km"` — from `/me/settings` |
| `unitWeight` | `string` | Yes | `"lbs"` or `"kg"` — from `/me/settings` |

**Example request:**
```
GET /api/trainerize/me/calendar?startDate=2026-05-01&endDate=2026-05-31&unitDistance=miles&unitWeight=lbs
```

**Response `data`:** Array of calendar entries. Each entry includes `date`, `type` (workout/cardio/rest), and associated exercise details.

> Use `dailyWorkoutIds` from calendar entries as input to `POST /me/daily-workouts/query` to load full workout details.

---

### Get Training Plans

**`GET /api/trainerize/me/training-plans`**

**Purpose:** Show all training plans assigned to the client.

**Request:**
```
GET /api/trainerize/me/training-plans
```

**Response `data`:** Array of training plan objects.

| Field | Description |
|---|---|
| `id` | Training plan ID — use as `planId` for `/me/workout-defs` |
| `name` | Plan name |
| `startDate` | When the plan starts |
| `endDate` / `duration` | Plan end or duration in weeks/months |
| `durationType` | `"specificDate"` `"week"` `"month"` `"notSpecified"` |

---

### Get Enrolled Programs

**`GET /api/trainerize/me/programs`**

**Purpose:** Display programs the client is currently enrolled in.

**Request:**
```
GET /api/trainerize/me/programs
```

**Response `data`:** Array of program objects — each includes `id`, `name`, and associated training plan metadata.

---

### Get Workout Definitions for a Training Plan

**`GET /api/trainerize/me/workout-defs`**

**Purpose:** List workouts available within a specific training plan.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `planId` | `number` | Yes | Training plan ID — from `/me/training-plans` |
| `searchTerm` | `string` | No | Filter by workout name |
| `start` | `number` | No | Pagination offset — default `0` |
| `count` | `number` | No | Page size — default `10` |

**Example request:**
```
GET /api/trainerize/me/workout-defs?planId=456&start=0&count=10
```

**Response `data`:** Array of workout definition objects — each includes workout `id`, `name`, exercise list, and scheduling metadata.

**Pagination:** Increment `start` by `count` to load the next page. Stop when returned array length < `count`.

---

## Section 3 — Messaging

---

### List Message Threads

**`GET /api/trainerize/me/message-threads`**

**Purpose:** Show the client's inbox — list of conversations with their trainer.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `view` | `string` | Yes | `"inbox"` for received messages |
| `start` | `number` | Yes | Pagination offset — start at `0` |
| `count` | `number` | Yes | Threads per page |

**Example request:**
```
GET /api/trainerize/me/message-threads?view=inbox&start=0&count=20
```

**Response `data`:** Array of thread objects.

| Field | Description |
|---|---|
| `id` | Thread ID — use as `threadId` for messages endpoint |
| `subject` | Thread subject/title |
| `lastMessage` | Preview of most recent message |
| `updatedAt` | Last activity timestamp |
| `unreadCount` | Unread message count |
| `participants` | Users in the thread (client + trainer) |

**Pagination:** Increment `start` by `count`. Stop when returned array length < `count`.

---

### Get Messages in a Thread

**`GET /api/trainerize/me/message-threads/messages`**

**Purpose:** Load the full message history for a selected thread.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `threadId` | `number` | Yes | Thread ID — from `/me/message-threads` |
| `start` | `number` | Yes | Pagination offset — start at `0` |
| `count` | `number` | Yes | Messages per page |

**Example request:**
```
GET /api/trainerize/me/message-threads/messages?threadId=98765&start=0&count=20
```

**Response `data`:** Array of message objects.

| Field | Description |
|---|---|
| `id` | Message ID |
| `threadId` | Parent thread ID |
| `body` | Message text content |
| `createdAt` | Sent timestamp |
| `sender` | Sender object (id, name) |
| `isRead` | Whether the client has read this message |

---

## Section 4 — Body Stats

---

### Get Body Stats for a Date

**`GET /api/trainerize/me/bodystats`**

**Purpose:** Show body measurements recorded on a specific date.

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | Yes | Format `YYYY-MM-DD` |
| `unitWeight` | `string` | Yes | `"lbs"` or `"kg"` — from `/me/settings` |
| `unitBodystats` | `string` | Yes | `"inches"` or `"cm"` — from `/me/settings` |

**Example request:**
```
GET /api/trainerize/me/bodystats?date=2026-05-15&unitWeight=lbs&unitBodystats=inches
```

**Response `data`:** Body stats record. Includes a `bodyMeasures` object with keys like `weight`, `bodyFat`, `waist`, `chest`, etc.

---

### Create a Body Stats Record

**`POST /api/trainerize/me/bodystats`**

**Purpose:** Create the record entry for a date before saving measurements.

**Response status:** `201 Created`

**Request body:**
```json
{
  "date": "2026-05-15",
  "status": "recorded"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | Yes | Format `YYYY-MM-DD` |
| `status` | `string` | Yes | Always use `"recorded"` |

> This only creates the empty record. Follow up with `PUT /me/bodystats` to save actual values.

---

### Update Body Measurements

**`PUT /api/trainerize/me/bodystats`**

**Purpose:** Save the actual measurement values for an existing record.

**Request body:**
```json
{
  "date": "2026-05-15",
  "unitWeight": "lbs",
  "unitBodystats": "inches",
  "bodyMeasures": {
    "weight": 180,
    "bodyFat": 18.5,
    "chest": 40,
    "waist": 32,
    "hips": 38,
    "neck": 15,
    "shoulders": 46,
    "bicep": 14,
    "forearm": 11,
    "thigh": 22,
    "calf": 14
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | Yes | Must match an existing record |
| `unitWeight` | `string` | Yes | `"lbs"` or `"kg"` |
| `unitBodystats` | `string` | Yes | `"inches"` or `"cm"` |
| `bodyMeasures` | `object` | Yes | Key-value map of measurement fields and their values |

> The record for this date must already exist. Always call `POST /me/bodystats` first.

---

### Delete a Body Stats Record

**`DELETE /api/trainerize/me/bodystats`**

**Request body:**
```json
{ "date": "2026-05-15" }
```

| Field | Type | Required |
|---|---|---|
| `date` | `string` | Yes |

---

## Section 5 — Cardio Sessions

---

### Log a Cardio Session

**`POST /api/trainerize/me/daily-cardio`**

**Response status:** `201 Created`

**Request body:**
```json
{
  "exerciseId": 1,
  "date": "2026-05-15",
  "target": "distance",
  "targetDetail": {
    "type": 1,
    "distance": 5,
    "distanceUnit": "km",
    "time": 1800,
    "text": "5km easy run",
    "zone": 2,
    "unitDistance": "km"
  },
  "from": "manual"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `exerciseId` | `number` | Yes | Trainerize exercise definition ID |
| `date` | `string` | Yes | Format `YYYY-MM-DD` |
| `target` | `string` | No | `"distance"` `"time"` `"calories"` |
| `targetDetail` | `object` | No | See fields below |
| `from` | `string` | No | Source — e.g. `"manual"` |

**`targetDetail` fields:**

| Field | Type | Description |
|---|---|---|
| `type` | `number` | Target type code |
| `distance` | `number` | Target distance value |
| `distanceUnit` | `string` | `"km"` or `"miles"` |
| `time` | `number` | Target time in seconds |
| `text` | `string` | Free-text target description |
| `zone` | `number` | Heart rate zone |
| `unitDistance` | `string` | Display unit for distance |

**Response `data`:** The created cardio entry. Save the `id` as `dailyCardioId` for `GET` and `PUT`.

---

### Get a Cardio Session

**`GET /api/trainerize/me/daily-cardio`**

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `dailyCardioId` | `number` | Yes | ID from `POST /me/daily-cardio` response |
| `unitDistance` | `string` | No | `"km"` or `"miles"` |

**Example request:**
```
GET /api/trainerize/me/daily-cardio?dailyCardioId=98765&unitDistance=km
```

---

### Update a Cardio Session

**`PUT /api/trainerize/me/daily-cardio`**

**Purpose:** Update an existing cardio session. Only send fields you want to change.

**Request body:**
```json
{
  "dailyCardioId": 98765,
  "name": "Morning Run",
  "date": "2026-05-15",
  "startTime": "07:00:00",
  "endTime": "07:30:00",
  "workDuration": 1800,
  "status": "completed",
  "unitDistance": "km",
  "distance": 5.1,
  "time": 1823,
  "calories": 420,
  "activeCalories": 390,
  "avgHeartRate": 148,
  "maxHeartRate": 165,
  "notes": "Felt good"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `dailyCardioId` | `number` | Yes | ID of the session to update |
| `name` | `string` | No | Session label |
| `date` | `string` | No | Format `YYYY-MM-DD` |
| `startTime` / `endTime` | `string` | No | Format `HH:MM:SS` |
| `workDuration` | `number` | No | Total duration in seconds |
| `status` | `string` | No | e.g. `"completed"` |
| `unitDistance` | `string` | No | `"km"` or `"miles"` |
| `distance` | `number` | No | Actual distance covered |
| `time` | `number` | No | Actual time in seconds |
| `calories` | `number` | No | Total calories burned |
| `activeCalories` | `number` | No | Active calories burned |
| `avgHeartRate` | `number` | No | Average heart rate (bpm) |
| `maxHeartRate` | `number` | No | Max heart rate (bpm) |
| `notes` | `string` | No | Free-text notes |

---

## Section 6 — Daily Workouts

---

### Fetch Full Workout Details

**`POST /api/trainerize/me/daily-workouts/query`**

**Purpose:** Load full details for one or more workouts identified from the calendar.

**Request body:**
```json
{
  "dailyWorkoutIds": [101, 102, 103]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `dailyWorkoutIds` | `number[]` | Yes | IDs from `/me/calendar` response |

---

### Create or Update Daily Workouts

**`POST /api/trainerize/me/daily-workouts`**

**Purpose:** Log a completed workout or update an existing one. Send `id: 0` to create; send an existing ID to update.

**Request body:**
```json
{
  "unitWeight": "lbs",
  "unitDistance": "miles",
  "dailyWorkouts": [
    {
      "id": 0,
      "name": "Morning Strength",
      "date": "2026-05-15",
      "type": "strength",
      "status": "completed",
      "style": "regular",
      "startTime": "07:00:00",
      "endTime": "08:00:00",
      "workoutDuration": 3600,
      "instructions": "Focus on form",
      "comments": {
        "comment": "Great session",
        "rpe": 7
      },
      "trackingStats": {
        "stats": {
          "maxHeartRate": 160,
          "avgHeartRate": 135,
          "calories": 350,
          "activeCalories": 320
        }
      },
      "exercises": [
        {
          "dailyExerciseID": 0,
          "def": {
            "id": 101,
            "name": "Barbell Back Squat"
          },
          "sets": 3,
          "target": "reps",
          "targetDetail": "3x8",
          "restTime": 90,
          "recordType": "weight",
          "stats": [
            { "setID": 1, "reps": 8, "weight": 135 },
            { "setID": 2, "reps": 8, "weight": 135 },
            { "setID": 3, "reps": 7, "weight": 135 }
          ]
        }
      ]
    }
  ]
}
```

**Top-level fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `unitWeight` | `string` | No | `"lbs"` or `"kg"` |
| `unitDistance` | `string` | No | `"miles"` or `"km"` |
| `dailyWorkouts` | `array` | Yes | One or more workout objects |

**Each `dailyWorkouts` item:**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `number` | Yes | `0` = create new; existing ID = update |
| `name` | `string` | Yes | Workout name |
| `date` | `string` | Yes | Format `YYYY-MM-DD` |
| `type` | `string` | Yes | `"strength"` `"cardio"` etc. |
| `status` | `string` | Yes | `"completed"` `"scheduled"` |
| `style` | `string` | Yes | `"regular"` `"circuit"` `"interval"` |
| `exercises` | `array` | Yes | Exercise entries (see below) |
| `startTime` / `endTime` | `string` | No | Format `HH:MM:SS` |
| `workoutDuration` | `number` | No | Duration in seconds |
| `rounds` | `number` | No | Number of rounds (for circuits) |
| `comments` | `object` | No | `{ comment: string, rpe: number }` |
| `trackingStats` | `object` | No | `{ stats: { maxHeartRate, avgHeartRate, calories, activeCalories } }` |

**Each `exercises` item:**

| Field | Type | Required | Description |
|---|---|---|---|
| `dailyExerciseID` | `number` | Yes | `0` = create; existing ID = update |
| `def.id` | `number` | Yes | Trainerize exercise library ID |
| `def.name` | `string` | No | Exercise name |
| `sets` | `number` | No | Number of sets — should match length of `stats` |
| `target` | `string` | No | `"reps"` `"time"` `"distance"` |
| `targetDetail` | `string` | No | Human-readable target e.g. `"3x8"` |
| `restTime` | `number` | No | Rest between sets in seconds |
| `recordType` | `string` | No | `"weight"` `"bodyweight"` |
| `stats` | `array` | No | Per-set performance data |

**Each `stats` item:**

| Field | Type | Description |
|---|---|---|
| `setID` | `number` | Set number (1-based) |
| `reps` | `number` | Reps completed |
| `weight` | `number` | Weight used |
| `distance` | `number` | Distance covered |
| `time` | `number` | Time in seconds |
| `calories` | `number` | Calories burned |

---

## API Flow Diagrams

### Dashboard Load Flow

```
Client logs in
  └── GET /me/link
        ├── data = null       → Show "contact your trainer" prompt, stop here
        └── data present      → Proceed to load dashboard
              ├── GET /me/settings   → Store unitWeight, unitDistance, unitBodystat in app state
              ├── GET /me/profile    → Display name/status in header
              └── GET /me/calendar?startDate=X&endDate=Y&unitWeight=...&unitDistance=...
```

### View a Workout from Calendar

```
Client taps a calendar entry
  └── POST /me/daily-workouts/query  { dailyWorkoutIds: [id] }
        └── Display full workout details
              └── Client logs result → POST /me/daily-workouts  { id: existingId, status: "completed", exercises: [...] }
```

### Log Body Stats Flow

```
Client opens body stats form
  └── GET /me/bodystats?date=today&unitWeight=...&unitBodystats=...
        ├── Record exists → PUT /me/bodystats  (update measurements)
        └── No record     → POST /me/bodystats { date, status: "recorded" }
                               └── PUT /me/bodystats  (save measurements)
```

### Log a Cardio Session Flow

```
Client opens cardio log
  └── POST /me/daily-cardio  { exerciseId, date, target, targetDetail }
        └── Save returned id as dailyCardioId
              └── If editing later → PUT /me/daily-cardio  { dailyCardioId, ...updates }
```

### Messaging Flow

```
Client opens messages
  └── GET /me/message-threads?view=inbox&start=0&count=20
        └── Client selects a thread
              └── GET /me/message-threads/messages?threadId=X&start=0&count=20
```

---

## Error Reference

| HTTP Status | Meaning | Action |
|---|---|---|
| `400` | Bad request / missing required field | Read `message` field for details |
| `401` | Missing or invalid `apex_access_token` | Redirect to login |
| `404` | Resource not found | Show not-found state |
| `201` | Resource created successfully | Use returned `data` for next step |

---

## Unit Display Rules (Global)

These values come from `GET /me/settings` and must be applied consistently:

| Setting | Applies to |
|---|---|
| `unitWeight` | All weight fields — workouts, body stats, cardio |
| `unitDistance` | All distance fields — cardio sessions, calendar |
| `unitBodystat` | All body measurement fields — waist, chest, hips, etc. |

Always pass these as query params to every endpoint that accepts them. Source them from settings on load — do not hardcode.
