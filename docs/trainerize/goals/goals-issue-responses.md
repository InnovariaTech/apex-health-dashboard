# Goals Issues — Backend Responses

> **Audience:** Frontend developers integrating the Progress → Goals tab.  
> **Source questions:** `Documentation/goals_clarification.md`  
> **Related docs:** `Documentation/trainerize/api-reference/goals/`, `Documentation/trainerize/workflows/workflow-goals-and-progress.md`

Answers map each open question to **portal routes** and **Trainerize upstream** endpoints.

---

## Portal route index

| Method | Portal route | Trainerize upstream |
|--------|--------------|---------------------|
| `GET` | `/api/trainerize/me/goals/list` | `POST /v03/goal/getList` |
| `GET` | `/api/trainerize/me/goals/detail` | `POST /v03/goal/get` |
| `POST` | `/api/trainerize/me/goals` | `POST /v03/goal/add` |
| `PUT` | `/api/trainerize/me/goals` | `POST /v03/goal/set` |
| `PUT` | `/api/trainerize/me/goals/progress` | `POST /v03/goal/setProgress` |
| `DELETE` | `/api/trainerize/me/goals` | `POST /v03/goal/delete` |
| `PUT` | `/api/trainerize/me/bodystats` | `POST /v03/bodystats/set` — weight goal progress (related) |
| `GET` | `/api/trainerize/me/accomplishments` | `POST /v03/accomplishment/getList` — goal achievements (related) |

All routes require auth + linked Trainerize account. Client `userID` is injected server-side on list/add/set.

---

## §1 — How does `PUT /goals` target a specific goal? 🚧

**Status:** Resolved — **updates by `type`, not by `goalId`**

| Portal route | Trainerize upstream | Identifies goal by |
|--------------|---------------------|-------------------|
| `PUT /trainerize/me/goals` | `goal/set` | **`userID` + `type`** — no `id` / `goalId` on wire |
| `PUT /trainerize/me/goals/progress` | `goal/setProgress` | **`goalId`** → wire `id` |
| `DELETE /trainerize/me/goals` | `goal/delete` | **`goalId`** → wire `id` |
| `GET /trainerize/me/goals/detail` | `goal/get` | **`goalId`** → wire `id` |

**Answers:**

1. **`PUT /goals` does not accept `goalId`.** Apex schema is the same shape as POST (discriminated union on `type` only). Unknown keys are stripped by Zod — do not send `goalId` on PUT expecting an update-by-id.
2. Trainerize `goal/set` updates the client's goal for that **`type`** (`textGoal`, `weightGoal`, `nutritionGoal`). Treat as **one updatable slot per type**, not per list row.
3. If `getList` returns **multiple goals of the same `type`**, `PUT /goals` is **unsafe** for editing a specific row — it may overwrite the type-level goal Trainerize considers active.
4. There is **no** `PUT /goals/:goalId` route today.

**FE guidance by goal type:**

| Goal type | Safe edit path |
|-----------|----------------|
| `textGoal` | Change text → `PUT /goals` with `type: textGoal` (only if one text goal, or accept type-level update). Update % → `PUT /goals/progress` with **`goalId`**. |
| `weightGoal` | Change targets → `PUT /goals` with `type: weightGoal`. Update current weight → `PUT /me/bodystats` (not goals API). |
| `nutritionGoal` | Change macros/calories → `PUT /goals` with `type: nutritionGoal`. |

**Ship Edit (`PUT /goals`)** when editing **weight** or **nutrition** config, or **text content** with at most one goal of that type visible. Use **`PUT /goals/progress`** for text goal progress bars (always includes `goalId`).

---

## §2 — Does `PUT /goals/progress` apply to non-text goals? 🚧

**Status:** Resolved — **text goals only in FE**

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `PUT /trainerize/me/goals/progress` | `goal/setProgress` |

**Request body:**

```json
{
  "goalId": 12345,
  "progress": 75
}
```

| Field | Portal | Trainerize wire |
|-------|--------|-----------------|
| `goalId` | Required | `id` |
| `progress` | Optional in Zod; send for updates | `progress` — **percentage** (Trainerize doc: 0–100) |

**Answers:**

1. **Only expose progress UI on `textGoal`.** Weight progress comes from `bodystats`; nutrition from daily nutrition vs targets. Calling progress on other types — upstream behavior **unverified**; expect error or no-op.
2. **`progress` is 0–100 percentage** for text goals.
3. **`progress >= 100`** triggers `achieved: true` server-side and can generate a **`hitTextGoal`** accomplishment (see §3).

---

## §3 — How is `achieved` set / flipped? 🚧

**Status:** Resolved — **read-only in API; no manual “mark achieved” write**

| Goal type | How `achieved` flips | Portal action |
|-----------|----------------------|---------------|
| `textGoal` | `PUT /goals/progress` → `progress: 100` | `PUT /trainerize/me/goals/progress` |
| `weightGoal` | Current weight crosses target (via bodystats) | `PUT /trainerize/me/bodystats` |
| `nutritionGoal` | Ongoing daily compliance — **`achieved` often not meaningful** | No dedicated flip |

**Answers:**

1. **`achieved` is not writable** — not in add/set/progress request bodies as a field you set directly.
2. **No “Mark achieved” button** backed by a dedicated endpoint. For text goals: set progress to **100**. Otherwise delete the goal or leave it active.
3. Filter **`achieved=true|false`** on list/detail is a **read filter** only (`GET /goals/list`, `GET /goals/detail` query).

**Related read endpoint after achievement:**

| Portal route | When |
|--------------|------|
| `GET /trainerize/me/accomplishments` | `hitTextGoal`, `hitWeightGoal` entries appear in feed |

---

## §4 — `goal-detail` authorization ⚠️

**Status:** Partial — Apex link check only; ownership on Trainerize side assumed

| Portal route | Trainerize upstream | `userID` sent? |
|--------------|---------------------|----------------|
| `GET /trainerize/me/goals/list` | `goal/getList` | Yes (injected) |
| `POST /trainerize/me/goals` | `goal/add` | Yes (injected) |
| `PUT /trainerize/me/goals` | `goal/set` | Yes (injected) |
| `GET /trainerize/me/goals/detail` | `goal/get` | **No** — only `goalId` (+ optional filters) |
| `PUT /trainerize/me/goals/progress` | `goal/setProgress` | **No** — only `goalId` |
| `DELETE /trainerize/me/goals` | `goal/delete` | **No** — only `goalId` |

**Answers:**

1. Apex requires a **Trainerize account link** for all goal routes (`requireTrainerizeAccountLink`).
2. Apex does **not** verify that `goalId` belongs to the linked client before calling Trainerize on get/delete/progress — relies on **Trainerize Partner API** to reject cross-user access (403).
3. FE must only use `goalId` values from the authenticated user's own list responses.

---

## §5 — `unitWeight` and `achieved` query semantics ⚠️

**Status:** Partial — passthrough to Trainerize

| Portal route | Query params |
|--------------|--------------|
| `GET /trainerize/me/goals/list` | `unitWeight`, `achieved`, `start`, `count` |
| `GET /trainerize/me/goals/detail` | `goalId` (required), `unitWeight`, `achieved` |

**Answers:**

1. **`unitWeight`** (`kg` or `lbs`) — passed to Trainerize; intended to **convert/display** weight goal numeric fields (`weightGoal`, `currentWeight`, `startWeight`) in that unit. Not a filter.
2. **Default when omitted** — Trainerize/user default; align with `GET /me/settings` `unitWeight` when available.
3. **`achieved`** — boolean **filter** on list/detail (`true` / `false` as query strings `achieved=true|false`). Behavior for nutrition goals with no achieved concept — **unverified**.

**FE example:**

```
GET /api/trainerize/me/goals/list?achieved=false&unitWeight=kg&start=0&count=20
GET /api/trainerize/me/goals/detail?goalId=12345&unitWeight=lbs
```

---

## §6 — `nutritionGoal` validation rules ⚠️

**Status:** Partial — Apex validates shape and enums only; no macro math or cross-field rules

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `POST /trainerize/me/goals` | `goal/add` |
| `PUT /trainerize/me/goals` | `goal/set` |

**Related read (day compliance, not goal settings):**

| Portal route | Purpose |
|--------------|---------|
| `GET /trainerize/me/nutrition?date=` | Today's logged intake vs **`nutrition.goal`** in response |
| `GET /trainerize/me/meal-plan` | Prescriptive menu — separate from nutrition goal |

---

### What a nutrition goal is

A **`nutritionGoal`** sets the client's **daily macro/calorie targets** (the scoreboard). It does **not** log food. Logging happens in Trainerize app / MFP / Fitbit; the portal reads results via `GET /nutrition`.

Updating targets uses **`PUT /goals`** with `type: nutritionGoal` (by type, not `goalId` — see §1).

---

### Request fields

| Field | Type | Apex required | Description |
|-------|------|---------------|-------------|
| `type` | `"nutritionGoal"` | **Yes** | Discriminator |
| `trackingType` | `string` | No | How intake is tracked (see enum below) |
| `caloricGoal` | `number` | No | Daily calorie target (kcal) |
| `carbsGrams` | `number` | No | Carbohydrate target (grams) |
| `carbsPercent` | `number` | No | Carbohydrate target (% of calories) |
| `proteinGrams` | `number` | No | Protein target (grams) |
| `proteinPercent` | `number` | No | Protein target (% of calories) |
| `fatGrams` | `number` | No | Fat target (grams) |
| `fatPercent` | `number` | No | Fat target (% of calories) |

**`trackingType` values (Apex enum):**

| Value | Meaning |
|-------|---------|
| `noTracking` | Goal exists; client logs in Trainerize or portal read-only |
| `trackWithMFP` | MyFitnessPal sync expected |
| `trackWithFitbit` | Fitbit sync expected |

Trainerize `userID` is injected server-side — do not send from FE.

---

### What Apex validates vs does not

| Validated by Apex | Not validated by Apex |
|-------------------|------------------------|
| `type` must be `nutritionGoal` | Percents sum to 100 |
| `trackingType` must be one of 3 enum values | Grams match `caloricGoal` (4/4/9 rule) |
| All numeric fields are numbers if present | Conflicting grams vs percents |
| Unknown keys stripped (default Zod object) | Minimum/maximum calorie ranges |

Invalid `trackingType` → **400** from portal. Invalid macro math → may pass Apex and fail or be silently adjusted by Trainerize (**unverified**).

---

### Gram ↔ calorie reference (for FE derivation)

Standard macro energy density (use if FE computes grams from percents client-side):

| Macro | kcal per gram |
|-------|---------------|
| Protein | 4 |
| Carbohydrate | 4 |
| Fat | 9 |

**Example:** `caloricGoal: 2200`, macros 45% / 30% / 25% (carbs / protein / fat):

| Macro | Percent | kcal | Grams (rounded) |
|-------|---------|------|-----------------|
| Carbs | 45% | 990 | 247.5 → **248** |
| Protein | 30% | 660 | 165 |
| Fat | 25% | 550 | 61 |

Formula: `grams = (caloricGoal × percent / 100) / kcalPerGram`

Apex does **not** run this math — FE may pre-fill grams before POST if using a percent-based form.

---

### Recommended FE strategies

Pick **one** representation per save to avoid sending conflicting grams and percents.

#### Strategy A — Percent-based (recommended for simple UI)

Send calories + percents only; omit gram fields (or derive grams client-side and send one set only).

**`POST /trainerize/me/goals`:**

```json
{
  "type": "nutritionGoal",
  "trackingType": "noTracking",
  "caloricGoal": 2200,
  "carbsPercent": 45,
  "proteinPercent": 30,
  "fatPercent": 25
}
```

#### Strategy B — Gram-based

Send calories + gram targets; omit percent fields.

```json
{
  "type": "nutritionGoal",
  "trackingType": "trackWithMFP",
  "caloricGoal": 2200,
  "carbsGrams": 248,
  "proteinGrams": 165,
  "fatGrams": 61
}
```

#### Strategy C — Calories only (minimal)

```json
{
  "type": "nutritionGoal",
  "trackingType": "noTracking",
  "caloricGoal": 2200
}
```

Trainerize may apply default macro split — **unverified**.

---

### Update (`PUT /goals`)

Same body shapes as POST. Updates the client's **`nutritionGoal` slot by type** (no `goalId`).

```json
{
  "type": "nutritionGoal",
  "trackingType": "noTracking",
  "caloricGoal": 2000,
  "carbsPercent": 40,
  "proteinPercent": 35,
  "fatPercent": 25
}
```

Send the **full target set** you want active after save (not a delta), because partial-update semantics on Trainerize are unverified.

---

### Response objects

**`POST /goals` — create:**

```json
{
  "success": true,
  "data": {
    "id": 1003
  }
}
```

**`GET /goals/list` or `GET /goals/detail` — read back:**

```json
{
  "id": 1003,
  "type": "nutritionGoal",
  "achieved": false,
  "trackingType": "noTracking",
  "caloricGoal": 2200,
  "carbsGrams": 250,
  "carbsPercent": 45,
  "proteinGrams": 150,
  "proteinPercent": 30,
  "fatGrams": 70,
  "fatPercent": 25
}
```

Trainerize may return **both** grams and percents populated even if you only sent one set.

---

### Relationship to `GET /nutrition` → `goal`

When viewing **today's compliance**, use the goal embedded in the nutrition day response (not a separate goals fetch):

```json
{
  "nutrition": {
    "calories": 1840,
    "carbsGrams": 210,
    "proteinGrams": 140,
    "fatGrams": 55,
    "goal": {
      "nutritionDeviation": 10,
      "caloricGoal": 2200,
      "carbsGrams": 250,
      "proteinGrams": 150,
      "fatGrams": 70
    }
  }
}
```

| Source | Use for |
|--------|---------|
| `GET /goals/list` (`nutritionGoal`) | Settings / edit nutrition targets |
| `GET /nutrition` → `nutrition.goal` | **Today** consumed vs target rings |
| `GET /me/meal-plan` | What to eat (guidance) |

After `PUT /goals` changes targets, refresh `GET /nutrition` for updated day rings.

---

### FE form validation (recommended client-side)

| Rule | Recommendation |
|------|----------------|
| Percents sum | Enforce **100%** (±0.5 tolerance) when using percent mode |
| Calories | Require `caloricGoal > 0` |
| Grams | Require `>= 0` when using gram mode |
| Dual send | Avoid sending both `carbsPercent` and conflicting `carbsGrams` in one payload |
| `trackingType` | Default `noTracking` unless MFP/Fitbit connected |

---

### Open / unverified

1. Trainerize rejects percents not summing to 100 — **unknown error shape**.
2. Grams-only without `caloricGoal` — accepted or rejected — **unverified**.
3. Whether `achieved` is meaningful for nutrition goals — treat as **informational only** on list filter.
4. One active nutrition goal per user vs multiple in list — see §8.

---

## §7 — `weightGoal` required fields ⚠️

**Status:** Partial — Apex minimal; Trainerize upstream loose

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `POST /trainerize/me/goals` | `goal/add` |
| `PUT /trainerize/me/goals` | `goal/set` |

**Apex optional fields:** `unitWeight`, `weightGoal`, `weeklyWeightGoal`, `clientActiveLevel`, `startDate`, `startWeight`, `currentWeight`.

**FE minimum recommended for create:**

| Field | Recommended |
|-------|-------------|
| `type` | `weightGoal` |
| `unitWeight` | `kg` or `lbs` |
| `weightGoal` | Target weight |
| `startWeight` / `currentWeight` | Starting point |

`clientActiveLevel` enum: `sedentary`, `lightlyActive`, `moderatelyActive`, `veryActive`, `extraActive`.

### Weight goal — request objects

**`POST /trainerize/me/goals`** (create):

```json
{
  "type": "weightGoal",
  "unitWeight": "kg",
  "weightGoal": 78,
  "weeklyWeightGoal": 0.5,
  "clientActiveLevel": "moderatelyActive",
  "startDate": "2026-06-01",
  "startWeight": 85,
  "currentWeight": 85
}
```

| Field | Type | FE required | Description |
|-------|------|-------------|-------------|
| `type` | `"weightGoal"` | Yes | Discriminator |
| `unitWeight` | `string` | Yes | `kg` or `lbs` |
| `weightGoal` | `number` | Yes | Target weight |
| `weeklyWeightGoal` | `number` | Recommended | Weekly change target |
| `clientActiveLevel` | `string` | Recommended | Activity level enum (see above) |
| `startDate` | `string` | Recommended | `YYYY-MM-DD` |
| `startWeight` | `number` | Recommended | Weight at goal start |
| `currentWeight` | `number` | Recommended | Current weight at create |

**`PUT /trainerize/me/goals`** (update config — by `type`, not `goalId`):

```json
{
  "type": "weightGoal",
  "unitWeight": "kg",
  "weightGoal": 77,
  "weeklyWeightGoal": 0.5,
  "clientActiveLevel": "moderatelyActive",
  "startDate": "2026-06-01",
  "startWeight": 85,
  "currentWeight": 82
}
```

To update **current weight only** (progress toward goal), prefer **`PUT /trainerize/me/bodystats`** instead of goals:

```json
{
  "date": "2026-06-04",
  "unitWeight": "kg",
  "unitBodystats": "cm",
  "bodyMeasures": {
    "bodyWeight": 82
  }
}
```

**On update:** `PUT /goals` with `type: weightGoal` replaces type-level config — send fields you want to change plus `type`; partial semantics follow Trainerize `goal/set` (no `goalId`).

---

## §8 — Maximum goals per user / per type ⚠️

**Status:** Open

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `POST /trainerize/me/goals` | `goal/add` |

**Answers:**

1. No documented cap in repo. List can return **multiple** goals including multiple of same `type`.
2. **`goal/set` is per-type** — adding another goal of the same type may create a new row while set updates the type slot — **live behavior unverified**.
3. On cap exceeded — expect Trainerize error in `{ success: false, message }` envelope; no specific Apex error code.

**FE:** Do not hard-gate Add unless product confirms one-per-type; surface upstream error message on failure.

---

## §9 — `progress` field on read ⚠️

**Status:** Resolved — not in Apex wire types; may exist in live JSON

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `GET /trainerize/me/goals/list` | `goal/getList` |
| `GET /trainerize/me/goals/detail` | `goal/get` |
| `PUT /trainerize/me/goals/progress` | `goal/setProgress` |

**Answers:**

1. After `PUT /goals/progress`, re-fetch list/detail — Trainerize return `progress` on text goal objects. Not declared in `TrainerizeWireGoalListItem` yet — **verify with live call**.
2. Expected key: **`progress`** (number, 0–100).
3. If absent after refresh, show last known progress from PUT response or prompt user to re-open detail.

See **§3 response examples** below for list/detail shapes.

---

## §10 — DELETE with JSON body ⚠️

**Status:** Partial — supported in Fastify; infra unverified

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `DELETE /trainerize/me/goals` | `goal/delete` |

**Request body:**

```json
{ "goalId": 12345 }
```

**Answers:**

1. DELETE with body is the required pattern (maps to Trainerize `id`).
2. No `?goalId=` query fallback on portal today.
3. Gateway stripping DELETE bodies — **unverified**; habits use same pattern.

---

## §11 — Accomplishments adjacency ℹ️

**Status:** Informational — separate FE ticket recommended

| Portal route | Purpose |
|--------------|---------|
| `GET /trainerize/me/accomplishments` | Trophy feed (`hitTextGoal`, `hitWeightGoal`, …) |
| `GET /trainerize/me/accomplishments/stats` | Aggregates by category (`goalHabit`, …) |

**Answer:** Goals tab can ship without accomplishments. Add a “Recent wins” tile in a follow-up ticket using `/me/accomplishments`.

---

## §3 — Response objects (list & detail)

Backend passthrough: `{ success: true, data: <Trainerize payload> }`.

### `GET /trainerize/me/goals/list` — response object

```json
{
  "success": true,
  "data": {
    "total": 3,
    "goals": [
      {
        "id": 1001,
        "type": "textGoal",
        "achieved": false,
        "text": "Run a 5K under 25 minutes",
        "progress": 60
      },
      {
        "id": 1002,
        "type": "weightGoal",
        "achieved": false,
        "unitWeight": "kg",
        "weightGoal": 78,
        "weeklyWeightGoal": 0.5,
        "clientActiveLevel": "moderatelyActive",
        "startDate": "2026-06-01",
        "startWeight": 85,
        "currentWeight": 82
      },
      {
        "id": 1003,
        "type": "nutritionGoal",
        "achieved": false,
        "trackingType": "trackWithMFP",
        "caloricGoal": 2200,
        "carbsGrams": 250,
        "carbsPercent": 45,
        "proteinGrams": 150,
        "proteinPercent": 30,
        "fatGrams": 70,
        "fatPercent": 25
      }
    ]
  }
}
```

**Notes:**

- `progress` on text goals — **may** be present after `setProgress`; not guaranteed in types yet.
- `achieved` — boolean on each goal.
- Pagination: query `start`, `count` → response `total`.

---

### `GET /trainerize/me/goals/detail` — response object

Same shape as a single list item (Trainerize `goal/get` returns one goal):

```json
{
  "success": true,
  "data": {
    "id": 1002,
    "type": "weightGoal",
    "achieved": false,
    "unitWeight": "kg",
    "weightGoal": 78,
    "weeklyWeightGoal": 0.5,
    "clientActiveLevel": "moderatelyActive",
    "startDate": "2026-06-01",
    "startWeight": 85,
    "currentWeight": 82
  }
}
```

**Query:** `goalId` required → Trainerize wire `id`.

---

### `POST /trainerize/me/goals` — response object

```json
{
  "success": true,
  "data": {
    "id": 1004
  }
}
```

Use returned `id` for `GET /detail`, `PUT /progress`, `DELETE`.

---

## Request body reference by endpoint

### `POST /goals` — add (examples)

**Text:**

```json
{ "type": "textGoal", "text": "Run a 5K under 25 minutes" }
```

**Weight:**

```json
{
  "type": "weightGoal",
  "unitWeight": "kg",
  "weightGoal": 78,
  "weeklyWeightGoal": 0.5,
  "clientActiveLevel": "moderatelyActive",
  "startDate": "2026-06-01",
  "startWeight": 85,
  "currentWeight": 85
}
```

**Nutrition:**

```json
{
  "type": "nutritionGoal",
  "trackingType": "noTracking",
  "caloricGoal": 2200,
  "carbsPercent": 45,
  "proteinPercent": 30,
  "fatPercent": 25
}
```

### `PUT /goals` — set (same shapes as POST; no `goalId`)

Updates by **`type`** — see §1.

### `PUT /goals/progress`

```json
{ "goalId": 1001, "progress": 100 }
```

### `DELETE /goals`

```json
{ "goalId": 1001 }
```

---

## Summary table

| # | Topic | Endpoint(s) | Status |
|---|--------|-------------|--------|
| 1 | PUT targeting | `PUT /goals` vs `PUT /goals/progress` | Resolved — by `type` vs by `goalId` |
| 2 | Progress on non-text | `PUT /goals/progress` | Resolved — text only in UI |
| 3 | `achieved` flip | progress / bodystats / read filter | Resolved — no manual mark |
| 4 | Authorization | all `/goals/*` | Partial — link check + Trainerize 403 |
| 5 | `unitWeight` / `achieved` query | `GET /goals/list`, `/detail` | Partial |
| 6 | Nutrition validation | `POST/PUT /goals` | Partial — passthrough |
| 7 | Weight required fields | `POST/PUT /goals` | Partial — FE minimums documented |
| 8 | Goal cap | `POST /goals` | Open |
| 9 | Progress on read | `GET /goals/list`, `/detail` | Partial — verify live |
| 10 | DELETE body | `DELETE /goals` | Partial |
| 11 | Accomplishments scope | `/me/accomplishments` | Info — separate ticket |

---

## What FE can ship now

| Feature | Endpoint(s) |
|---------|-------------|
| Goals list + active/achieved filter | `GET /goals/list` |
| Goal detail | `GET /goals/detail?goalId=` |
| Add goal (all 3 types) | `POST /goals` |
| Delete goal | `DELETE /goals` |
| Text goal progress bar | `PUT /goals/progress` |
| Weight goal current weight | `PUT /me/bodystats` |
| Edit weight/nutrition config | `PUT /goals` (one per type — see §1) |
| Edit text goal copy | `PUT /goals` with `type: textGoal` (see §1) |
| “Mark achieved” for text | `PUT /goals/progress` with `progress: 100` |
| Nutrition compliance rings | `GET /me/nutrition` → `nutrition.goal` (see nutrition responses doc) |

**Held / caution:**

- Edit specific row when **multiple goals share `type`** — use type-specific flows (§1).
- Hard-gate “one weight goal” until product confirms (§8).
