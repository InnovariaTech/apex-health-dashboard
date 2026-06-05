# Trainerize Client APIs — Frontend Reference

> **Audience:** Frontend developers integrating with the Apex Patient Portal backend.
> **Base path:** All routes are prefixed with `/api` (e.g. `GET /api/trainerize/me/link`).
> **Auth:** Every endpoint requires a valid session cookie (`apex_access_token`). A missing or invalid token returns `401`.
> **Response envelope:** All responses follow `{ success: true, data: ... }` on success and `{ success: false, message: "..." }` on error.

---

## Phase 1 — Profile & Settings

---

### `GET /trainerize/me/link`

Returns the Trainerize account linkage record for the currently authenticated user. Use this to check whether the user has a Trainerize account connected before making other calls.

**Auth:** Required

**Query params:** None

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
| `trainerUserId` | `number \| null` | Assigned trainer's Trainerize ID; `null` if not yet assigned |
| `assignmentStatus` | `string` | `"assigned"` \| `"pending"` \| `"unassigned"` |

**If not linked:** `data` will be `null`. Use this to gate the Trainerize onboarding flow.

---

### `GET /trainerize/me/profile`

Fetches and returns the authenticated user's Trainerize client profile. Makes a live call to the Trainerize Partner API to hydrate the latest profile data.

**Auth:** Required

**Query params:** None

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
| `email` | `string \| null` | Email on file in Trainerize |
| `firstName` | `string \| null` | First name |
| `lastName` | `string \| null` | Last name |
| `status` | `string \| null` | Account status (e.g. `"active"`) |

**If not linked:** `data` will be `null`.

---

### `GET /trainerize/me/settings`

Returns the authenticated user's Trainerize account settings, including unit preferences, notification preferences, and third-party connection statuses.

**Auth:** Required

**Query params:** None

**Response `data`:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "timezone": -5,
  "unitWeight": "lbs",
  "unitDistance": "miles",
  "unitBodystat": "inches",
  "reminderTime": 8,
  "level": 1,
  "trainerID": 29586519,
  "skypeEnabled": false,
  "withingsConnected": false,
  "mobileVideoQuality": 1,
  "fbLandingPage": "",
  "mfpConnected": false,
  "fitbitConnected": false,
  "mfpUsername": null,
  "hasMobileSetup": true,
  "hasMobileTrackerWizard": false,
  "hasMobileSwitchIntoWizard": false,
  "email": {
    "newMessage": true,
    "newUserGroupMessage": false,
    "comment": true,
    "reminders": true,
    "trainerUpdates": true,
    "clientDailySummary": false,
    "weeklyFollowup": false,
    "news": false,
    "paymentEvent": true,
    "zapierEvents": false,
    "clientFirstWorkout": false,
    "clientSubsequentWorkout": false,
    "clientMilestoneCardio": false,
    "clientAllCardio": false,
    "clientHitGoal": false
  },
  "notification": {
    "newMessage": true,
    "newUserGroupMessage": false,
    "comment": true,
    "paymentEvent": true,
    "reminders": true,
    "trainerUpdates": true,
    "clientPersonalBest": false,
    "clientFirstWorkout": false,
    "clientSubsequentWorkout": false,
    "clientMilestoneCardio": false,
    "clientAllCardio": false,
    "zapierEvents": false,
    "clientHitGoal": false
  },
  "timeline": {
    "showMissWorkout": true
  }
}
```

| Field | Type | Description |
|---|---|---|
| `unitWeight` | `string` | `"lbs"` or `"kg"` — use for all weight display |
| `unitDistance` | `string` | `"miles"` or `"km"` — use for all distance display |
| `unitBodystat` | `string` | `"inches"` or `"cm"` — use for body measurement display |
| `timezone` | `number` | UTC offset in hours |
| `trainerID` | `number` | Assigned trainer's Trainerize ID |
| `mfpUsername` | `string \| boolean \| null` | MyFitnessPal username if connected; can be a string or `null` (Trainerize inconsistency) |
| `email` | `object` | Per-event email notification toggles |
| `notification` | `object` | Per-event push notification toggles |
| `timeline` | `object` | Timeline display preferences |

> **Note on units:** The `unitWeight`, `unitDistance`, and `unitBodystat` values from this endpoint are the source of truth for how to display all Trainerize data to this user. Read these once on load and apply globally.

---

## Phase 2 — Calendar, Training Plans, Programs & Workout Defs

---

### `GET /trainerize/me/calendar`

Returns the client's Trainerize activity calendar for a given date range. Each entry in the response represents a scheduled or completed workout, cardio session, or rest day.

**Auth:** Required

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `startDate` | `string` | Yes | Start of range — format `YYYY-MM-DD` |
| `endDate` | `string` | Yes | End of range — format `YYYY-MM-DD` |
| `unitDistance` | `string` | Yes | `"miles"` or `"km"` |
| `unitWeight` | `string` | Yes | `"lbs"` or `"kg"` |

**Example request:**
```
GET /api/trainerize/me/calendar?startDate=2026-01-01&endDate=2026-01-31&unitDistance=miles&unitWeight=lbs
```

**Response `data`:** Raw Trainerize calendar payload. Each item typically includes a `date`, `type` (e.g. workout, cardio, rest), and associated workout/exercise details. Use `unitDistance` and `unitWeight` from `/me/settings` when populating these params.

---

### `GET /trainerize/me/training-plans`

Returns all training plans assigned to the authenticated client.

**Auth:** Required

**Query params:** None

**Response `data`:** Array of training plan objects from Trainerize. Each plan typically includes:

| Field | Description |
|---|---|
| `id` | Training plan ID — use this as `planId` for `/me/workout-defs` |
| `name` | Plan name |
| `startDate` | When the plan starts |
| `endDate` / `duration` | Plan end date or duration in weeks/months |
| `durationType` | `"specificDate"` \| `"week"` \| `"month"` \| `"notSpecified"` |

---

### `GET /trainerize/me/programs`

Returns all programs the authenticated client is currently enrolled in.

**Auth:** Required

**Query params:** None

**Response `data`:** Array of program objects from Trainerize. Each program typically includes an `id`, `name`, and associated training plan metadata.

> Programs are trainer-created curriculum structures. A client may be enrolled in one or more. Use the program `id` here as context for trainer-side program endpoints.

---

### `GET /trainerize/me/workout-defs`

Returns workout definitions (exercise library entries) for a specific training plan. Used to display available workouts within a plan.

**Auth:** Required

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `planId` | `number` | Yes | Training plan ID — from `/me/training-plans` response |
| `searchTerm` | `string` | No | Filter by workout name |
| `start` | `number` | No | Pagination offset; default `0` |
| `count` | `number` | No | Page size; default `10` |

**Example request:**
```
GET /api/trainerize/me/workout-defs?planId=456&start=0&count=10
```

**Response `data`:** Array of workout definition objects from Trainerize. Each entry includes the workout `id`, `name`, exercise list, and scheduling metadata.

> Use `planId` obtained from `GET /me/training-plans`. The `start` + `count` params support pagination — increment `start` by `count` to load the next page.

---

## Phase 3 — Messaging

---

### `GET /trainerize/me/message-threads`

Returns a paginated list of message threads for the authenticated client. Each thread represents a conversation — typically between the client and their trainer.

**Auth:** Required

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `view` | `string` | Yes | Filter threads by type. Use `"inbox"` for received messages |
| `start` | `number` | Yes | Pagination offset; start at `0` |
| `count` | `number` | Yes | Number of threads to return per page |

**Example request:**
```
GET /api/trainerize/me/message-threads?view=inbox&start=0&count=20
```

**Response `data`:** Array of message thread objects from Trainerize. Each thread typically includes:

| Field | Description |
|---|---|
| `id` | Thread ID — use this as `threadId` for `/me/message-threads/messages` |
| `subject` | Thread subject/title |
| `lastMessage` | Preview of the most recent message |
| `updatedAt` | Timestamp of the last activity |
| `unreadCount` | Number of unread messages in this thread |
| `participants` | List of users in the thread (client + trainer) |

> Paginate by incrementing `start` by `count`. Stop when the returned array length is less than `count`.

---

### `GET /trainerize/me/message-threads/messages`

Returns a paginated list of individual messages within a specific thread.

**Auth:** Required

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `threadId` | `number` | Yes | Thread ID — from `/me/message-threads` response |
| `start` | `number` | Yes | Pagination offset; start at `0` |
| `count` | `number` | Yes | Number of messages to return per page |

**Example request:**
```
GET /api/trainerize/me/message-threads/messages?threadId=98765&start=0&count=20
```

**Response `data`:** Array of message objects from Trainerize. Each message typically includes:

| Field | Description |
|---|---|
| `id` | Message ID |
| `threadId` | Parent thread ID |
| `body` | Message text content |
| `createdAt` | Timestamp the message was sent |
| `sender` | Sender user object (id, name) |
| `isRead` | Whether the authenticated user has read this message |

> Load the thread list first via `/me/message-threads`, then fetch messages for a selected thread using its `id`. Paginate messages oldest-first by starting at `start=0` or newest-first depending on your UI — Trainerize returns messages in insertion order.

---

## Phase 4 — Body Stats, Daily Cardio & Daily Workouts

---

### `GET /trainerize/me/bodystats`

Returns the client's body measurement record for a specific date.

**Auth:** Required

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | Yes | Format `YYYY-MM-DD` |
| `unitWeight` | `string` | Yes | `"lbs"` or `"kg"` |
| `unitBodystats` | `string` | Yes | `"inches"` or `"cm"` |

**Example request:**
```
GET /api/trainerize/me/bodystats?date=2026-01-15&unitWeight=lbs&unitBodystats=inches
```

**Response `data`:** Body stats record for the given date. Includes a `bodyMeasures` object with measurement keys such as `weight`, `bodyFat`, `waist`, `chest`, etc. Exact keys depend on what has been recorded.

---

### `POST /trainerize/me/bodystats`

Creates a new body stats record for the client on a given date.

**Auth:** Required

**Response status:** `201 Created`

**Request body:**

```json
{
  "date": "2026-01-15",
  "status": "recorded"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | Yes | Format `YYYY-MM-DD` |
| `status` | `string` | Yes | Record status — use `"recorded"` |

> This only creates the record entry. To save actual measurement values, follow up with `PUT /me/bodystats`.

---

### `PUT /trainerize/me/bodystats`

Updates body measurement values for the client on a given date. The `bodyMeasures` object accepts any measurement key-value pairs Trainerize supports.

**Auth:** Required

**Request body:**

```json
{
  "date": "2026-01-15",
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
| `date` | `string` | Yes | Format `YYYY-MM-DD` — must match an existing record |
| `unitWeight` | `string` | Yes | `"lbs"` or `"kg"` |
| `unitBodystats` | `string` | Yes | `"inches"` or `"cm"` |
| `bodyMeasures` | `object` | Yes | Key-value map of measurement fields and their values |

> A record for the given date must exist before calling this. Create it first with `POST /me/bodystats`.

---

### `DELETE /trainerize/me/bodystats`

Deletes the body stats record for the client on a given date.

**Auth:** Required

**Request body:**

```json
{
  "date": "2026-01-15"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | Yes | Format `YYYY-MM-DD` |

---

### `POST /trainerize/me/daily-cardio`

Logs a new cardio session for the client.

**Auth:** Required

**Response status:** `201 Created`

**Request body:**

```json
{
  "exerciseId": 1,
  "date": "2026-01-15",
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
| `target` | `string` | No | Target type — e.g. `"distance"`, `"time"`, `"calories"` |
| `targetDetail` | `object` | No | Breakdown of the target (see fields below) |
| `from` | `string` | No | Source of the entry — e.g. `"manual"` |

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

**Response `data`:** The created cardio entry. The `id` in the response is the `dailyCardioId` — save it to use with `GET` and `PUT`.

---

### `GET /trainerize/me/daily-cardio`

Returns the details of a specific cardio session.

**Auth:** Required

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `dailyCardioId` | `number` | Yes | ID from the `POST /me/daily-cardio` response |
| `unitDistance` | `string` | No | `"km"` or `"miles"` — controls distance display unit in response |

**Example request:**
```
GET /api/trainerize/me/daily-cardio?dailyCardioId=98765&unitDistance=km
```

---

### `PUT /trainerize/me/daily-cardio`

Updates an existing cardio session. All fields except `dailyCardioId` are optional — only send what you want to change.

**Auth:** Required

**Request body:**

```json
{
  "dailyCardioId": 1,
  "name": "Morning Run",
  "date": "2026-01-15",
  "startTime": "07:00:00",
  "endTime": "07:30:00",
  "workDuration": 1800,
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
  "notes": "Felt good",
  "status": "completed",
  "unitDistance": "km",
  "distance": 5.1,
  "time": 1823,
  "calories": 420,
  "activeCalories": 390,
  "level": 3,
  "speed": 10.0,
  "maxHeartRate": 165,
  "avgHeartRate": 148,
  "location": "Park",
  "comments": [
    {
      "comment": "Solid pace throughout",
      "rpe": 6
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `dailyCardioId` | `number` | Yes | ID of the cardio session to update |
| `name` | `string` | No | Session name/label |
| `date` | `string` | No | Format `YYYY-MM-DD` |
| `startTime` | `string` | No | Format `HH:MM:SS` |
| `endTime` | `string` | No | Format `HH:MM:SS` |
| `workDuration` | `number` | No | Total duration in seconds |
| `target` / `targetDetail` | `string` / `object` | No | Same shape as `POST` above |
| `notes` | `string` | No | Free-text notes |
| `status` | `string` | No | e.g. `"completed"` |
| `unitDistance` | `string` | No | `"km"` or `"miles"` |
| `distance` | `number` | No | Actual distance covered |
| `time` | `number` | No | Actual time in seconds |
| `calories` | `number` | No | Total calories burned |
| `activeCalories` | `number` | No | Active calories burned |
| `level` | `number` | No | Difficulty level |
| `speed` | `number` | No | Average speed |
| `maxHeartRate` | `number` | No | Max heart rate (bpm) |
| `avgHeartRate` | `number` | No | Average heart rate (bpm) |
| `location` | `string` | No | Where the session took place |
| `comments` | `array` | No | Array of `{ comment: string, rpe: number }` |

---

### `POST /trainerize/me/daily-workouts/query`

Fetches the full details of one or more daily workout entries by their IDs. IDs typically come from the calendar response.

**Auth:** Required

**Request body:**

```json
{
  "dailyWorkoutIds": [101, 102, 103]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `dailyWorkoutIds` | `number[]` | Yes | One or more daily workout IDs — from `/me/calendar` |

---

### `POST /trainerize/me/daily-workouts`

Creates or updates daily workout entries for the client. Send `id: 0` to create a new workout; send an existing ID to update it.

**Auth:** Required

**Request body:**

```json
{
  "unitWeight": "lbs",
  "unitDistance": "miles",
  "dailyWorkouts": [
    {
      "id": 0,
      "name": "Morning Strength",
      "date": "2026-01-15",
      "type": "strength",
      "status": "completed",
      "style": "regular",
      "startTime": "07:00:00",
      "endTime": "08:00:00",
      "workoutDuration": 3600,
      "instructions": "Focus on form",
      "hasOverride": false,
      "intervalProgress": 0,
      "rounds": 3,
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
            "name": "Barbell Back Squat",
            "description": "Compound lower body movement"
          },
          "sets": 3,
          "target": "reps",
          "targetDetail": "3x8",
          "side": "both",
          "restTime": 90,
          "recordType": "weight",
          "type": "strength",
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
| `dailyWorkouts` | `array` | Yes | One or more workout objects (min 1) |

**Each `dailyWorkouts` item:**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `number` | Yes | `0` to create new; existing ID to update |
| `name` | `string` | Yes | Workout name |
| `date` | `string` | Yes | Format `YYYY-MM-DD` |
| `type` | `string` | Yes | e.g. `"strength"`, `"cardio"` |
| `status` | `string` | Yes | e.g. `"completed"`, `"scheduled"` |
| `style` | `string` | Yes | e.g. `"regular"`, `"circuit"`, `"interval"` |
| `exercises` | `array` | Yes | List of exercise entries (see below) |
| `startTime` / `endTime` | `string` | No | Format `HH:MM:SS` |
| `workoutDuration` | `number` | No | Duration in seconds |
| `rounds` | `number` | No | Number of rounds (for circuits) |
| `comments` | `object` | No | `{ comment: string, rpe: number }` |
| `trackingStats` | `object` | No | `{ stats: { maxHeartRate, avgHeartRate, calories, activeCalories } }` |

**Each `exercises` item:**

| Field | Type | Required | Description |
|---|---|---|---|
| `dailyExerciseID` | `number` | Yes | `0` to create; existing ID to update |
| `def.id` | `number` | Yes | Trainerize exercise library ID |
| `def.name` | `string` | No | Exercise name |
| `sets` | `number` | No | Number of sets — should match length of `stats` |
| `target` | `string` | No | e.g. `"reps"`, `"time"`, `"distance"` |
| `targetDetail` | `string` | No | Human-readable target e.g. `"3x8"` |
| `restTime` | `number` | No | Rest between sets in seconds |
| `recordType` | `string` | No | e.g. `"weight"`, `"bodyweight"` |
| `stats` | `array` | No | Per-set performance data (see below) |

**Each `stats` item:**

| Field | Type | Description |
|---|---|---|
| `setID` | `number` | Set number (1-based) |
| `reps` | `number` | Reps completed |
| `weight` | `number` | Weight used |
| `distance` | `number` | Distance covered |
| `time` | `number` | Time in seconds |
| `calories` | `number` | Calories burned |
| `speed` | `number` | Speed |
| `level` | `number` | Difficulty level |
