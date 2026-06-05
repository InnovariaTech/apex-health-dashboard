# Nutrition Issues — Backend Responses

> **Audience:** Frontend developers integrating nutrition features.  
> **Source questions:** `Documentation/nutrition_issue.md`  
> **Related docs:** `Documentation/frontend/trainerize/nutrition-photos-appointments-apis.md`, `Documentation/trainerize/api-reference/dailyNutrition/`

Answers below map each open question to **portal routes** and **Trainerize upstream** endpoints. Status: **Resolved**, **Partial**, or **Open**.

---

## Portal route index

| Method | Portal route | Trainerize upstream |
|--------|--------------|---------------------|
| `GET` | `/api/trainerize/me/nutrition/logs` | `POST /v03/dailyNutrition/getList` |
| `GET` | `/api/trainerize/me/nutrition` | `POST /v03/dailyNutrition/get` |
| `GET` | `/api/trainerize/me/nutrition/custom-foods` | `POST /v03/dailyNutrition/getCustomFoodList` |
| `POST` | `/api/trainerize/me/nutrition/custom-foods` | `POST /v03/dailyNutrition/addCustomFood` |
| `PUT` | `/api/trainerize/me/nutrition/custom-foods` | `POST /v03/dailyNutrition/setCustomFood` |
| `DELETE` | `/api/trainerize/me/nutrition/custom-foods` | `POST /v03/dailyNutrition/deleteCustomFood` |
| *(none)* | *(missing)* | Day intake logging (`dailyNutrition/add` / `set` for meals) |
| `GET/POST/PUT/DELETE` | `/api/trainerize/me/goals/*` | `goal/*` — related to §12 only |

All portal routes require auth + linked Trainerize account. Trainerize `userID` is injected server-side.

---

## §1 — How does the user LOG food intake? 🚧

**Status:** Resolved — **no day-logging API in scope**

| Portal route | Trainerize upstream | Role |
|--------------|---------------------|------|
| `GET /trainerize/me/nutrition/logs` | `dailyNutrition/getList` | Read day summaries |
| `GET /trainerize/me/nutrition` | `dailyNutrition/get` | Read single-day detail |
| `GET/POST/PUT/DELETE /trainerize/me/nutrition/custom-foods` | `getCustomFoodList` / `addCustomFood` / `setCustomFood` / `deleteCustomFood` | Food **library** only |
| *(missing)* | `dailyNutrition/add` or `set` (meal intake) | ❌ Not in Partner API |

**Answer:**

1. There is **no** portal endpoint to add/remove/edit food on a specific date’s journal.
2. **Intended v1 UX:** read-only journal in the portal. Clients log intake via the **Trainerize mobile app** or **MyFitnessPal / Fitbit sync** (`source: mFP` / `fitbit` on nutrition entries).
3. `GET /nutrition` is **not** a writable shape you re-POST to mutate the day.

**FE action:** Show explicit copy (“Log meals in the Trainerize app”) — do not ship a broken “Add food to today” button.

---

## §2 — Date/time format inconsistency 🚧

**Status:** Partial — formats defined; timezone not verified

| Portal route | Trainerize upstream | Query params | Expected format |
|--------------|---------------------|--------------|-----------------|
| `GET /trainerize/me/nutrition/logs` | `dailyNutrition/getList` | `startDate`, `endDate` | `YYYY-MM-DD HH:MI:SS` (space-separated) |
| `GET /trainerize/me/nutrition` | `dailyNutrition/get` | `date` | `YYYY-MM-DD` |

**Answers:**

1. **`/nutrition/logs` + date-only:** Not documented — send full datetime (`2026-06-01 00:00:00`).
2. **`/nutrition` + datetime:** Not documented — send date-only (`2026-06-03`).
3. **Timezone:** Undocumented. No `Z` / offset in Trainerize spec. Treat as studio/user-local strings until confirmed with live calls.
4. **ISO 8601 (`T` separator):** Not documented — use formats above.

**FE examples:**

```
GET /api/trainerize/me/nutrition/logs?startDate=2026-06-01%2000:00:00&endDate=2026-06-07%2023:59:59
GET /api/trainerize/me/nutrition?date=2026-06-03
```

Backend passes query strings through unchanged (no normalization).

---

## §3 — Response shapes 🚧

**Status:** Resolved — documented below; backend passthroughs raw Trainerize JSON in `{ success: true, data: ... }`

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `GET /trainerize/me/nutrition/logs` | `dailyNutrition/getList` |
| `GET /trainerize/me/nutrition` | `dailyNutrition/get` |
| `GET /trainerize/me/nutrition/custom-foods` | `dailyNutrition/getCustomFoodList` |

### Field mapping (portal → Trainerize)

| Portal | Trainerize wire |
|--------|-----------------|
| `nutritionId` (query on `GET /nutrition`) | `id` on `dailyNutrition/get` |
| `nutrition[].id` (from logs) | Same ID for `GET /nutrition?nutritionId=` |

### `GET /trainerize/me/nutrition/logs` — response object

List view: **no food detail** per meal (call `GET /nutrition` for full foods).

```json
{
  "success": true,
  "data": {
    "nutrition": [
      {
        "id": 987654,
        "date": "2026-06-03",
        "source": "trainerize",
        "calories": 1840,
        "carbsGrams": 210,
        "carbsPercent": 38,
        "proteinGrams": 140,
        "proteinPercent": 30,
        "fatGrams": 55,
        "fatPercent": 27,
        "fiberGrams": 22,
        "sodiumGrams": 1.8,
        "sugarGrams": 45,
        "meals": [
          {
            "name": "breakfast",
            "mealGuid": "abc-123-guid",
            "mealTime": "2026-06-03 08:15:00",
            "hasImage": false,
            "modifiedAt": "2026-06-03 08:20:00"
          },
          {
            "name": "lunch",
            "mealGuid": "def-456-guid",
            "mealTime": "2026-06-03 12:30:00",
            "hasImage": true,
            "modifiedAt": "2026-06-03 12:45:00"
          }
        ],
        "goal": {
          "nutritionDeviation": 10,
          "caloricGoal": 2200,
          "carbsGrams": 250,
          "proteinGrams": 150,
          "fatGrams": 70
        },
        "mealPhoto": {
          "id": 0
        }
      }
    ]
  }
}
```

**Guaranteed fields per day (list):** `id`, `date`, `source`, macro totals, `meals[]` (summary), `goal`, `mealPhoto`.  
**Meal `name` values:** `breakfast`, `morningSnack`, `lunch`, `afternoonSnack`, `dinner`, `afterDinner`, `anytime`.

---

### `GET /trainerize/me/nutrition` — response object

Detail view: **`foods[]` nested inside each `meals[]` item** (not duplicated at top level).

```json
{
  "success": true,
  "data": {
    "nutrition": {
      "id": 987654,
      "date": "2026-06-03",
      "numberOfComments": 0,
      "source": "trainerize",
      "calories": 1840,
      "carbsGrams": 210,
      "carbsPercent": 38,
      "proteinGrams": 140,
      "proteinPercent": 30,
      "fatGrams": 55,
      "fatPercent": 27,
      "fiberGrams": 22,
      "sodiumGrams": 1.8,
      "sugarGrams": 45,
      "nutrients": [
        { "nutrNo": 208, "nutrVal": 1840 },
        { "nutrNo": 203, "nutrVal": 140 },
        { "nutrNo": 205, "nutrVal": 210 },
        { "nutrNo": 204, "nutrVal": 55 }
      ],
      "meals": [
        {
          "name": "breakfast",
          "mealGuid": "abc-123-guid",
          "mealTime": "2026-06-03 08:15:00",
          "description": "Oatmeal and berries",
          "hasImage": false,
          "modifiedAt": "2026-06-03 08:20:00",
          "caloriesSummary": 420,
          "proteinSummary": 18,
          "fatSummary": 12,
          "carbsSummary": 58,
          "proteinPercent": 17,
          "carbsPercent": 55,
          "fatPercent": 26,
          "foods": [
            {
              "name": "Oatmeal, cooked",
              "amount": 1,
              "unit": "cup",
              "calories": 150,
              "proteins": 5,
              "carbs": 27,
              "fat": 3,
              "imageId": 0,
              "type": "system",
              "convertedAmount": null,
              "convertedUnit": null
            },
            {
              "name": "Homemade protein shake",
              "amount": 1,
              "unit": "serving",
              "calories": 270,
              "proteins": 13,
              "carbs": 31,
              "fat": 9,
              "imageId": 0,
              "type": "custom",
              "convertedAmount": null,
              "convertedUnit": null
            }
          ]
        }
      ],
      "goal": {
        "nutritionDeviation": 10,
        "caloricGoal": 2200,
        "carbsGrams": 250,
        "proteinGrams": 150,
        "fatGrams": 70
      },
      "mealPhoto": {
        "id": 0
      }
    }
  }
}
```

**Food `type` values:** `custom`, `system`.

---

### `GET /trainerize/me/nutrition/custom-foods` — response object

```json
{
  "success": true,
  "data": {
    "foods": [
      {
        "foodId": 1006803744,
        "type": "custom",
        "name": "Homemade protein shake",
        "imageId": 0,
        "userId": 29586519,
        "groupId": null,
        "sampleServing": {
          "name": "1 serving",
          "amount": 1,
          "weight": 250,
          "calories": 270,
          "proteins": 30,
          "carbs": 10,
          "fat": 5
        },
        "serving": [
          {
            "name": "1 serving",
            "amount": 1,
            "weight": 250,
            "calories": 270,
            "proteins": 30,
            "carbs": 10,
            "fat": 5
          }
        ]
      },
      {
        "foodId": 555001,
        "type": "system",
        "name": "Chicken breast, grilled",
        "imageId": 12345,
        "userId": null,
        "groupId": 1001,
        "sampleServing": {
          "name": "100 g",
          "amount": 1,
          "weight": 100,
          "calories": 165,
          "proteins": 31,
          "carbs": 0,
          "fat": 3.6
        },
        "serving": []
      }
    ],
    "total": 42
  }
}
```

**Edit/delete:** Only when `type === "custom"`.

---

## §4 — Full `nutrNo` whitelist 🚧

**Status:** Resolved — enforced in Apex Zod (`packages/modules/trainerize/trainerize.schema.ts`)

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `POST /trainerize/me/nutrition/custom-foods` | `dailyNutrition/addCustomFood` |
| `PUT /trainerize/me/nutrition/custom-foods` | `dailyNutrition/setCustomFood` |

Invalid `nutrNo` → **400 from Apex** (before Trainerize is called).  
`nutrVal` → **`number`** (decimals allowed).

### Allowed `nutrNo` values with nutrient names

IDs follow **USDA SR Legacy** nutrient numbering (Trainerize uses USDA-verified foods). Units are typical USDA units for each nutrient.

| nutrNo | Nutrient name | Typical unit |
|--------|---------------|--------------|
| 203 | Protein | g |
| 204 | Total fat (lipid) | g |
| 205 | Carbohydrate, by difference | g |
| 208 | Energy (calories) | kcal |
| 209 | Starch | g |
| 210 | Sucrose | g |
| 211 | Glucose (dextrose) | g |
| 212 | Fructose | g |
| 213 | Lactose | g |
| 214 | Maltose | g |
| 221 | Alcohol, ethyl | g |
| 255 | Water | g |
| 262 | Caffeine | mg |
| 269 | Sugars, total including NLEA | g |
| 291 | Fiber, total dietary | g |
| 301 | Calcium | mg |
| 303 | Iron | mg |
| 304 | Magnesium | mg |
| 305 | Phosphorus | mg |
| 306 | Potassium | mg |
| 307 | Sodium | mg |
| 309 | Zinc | mg |
| 312 | Copper | mg |
| 315 | Manganese | mg |
| 317 | Selenium | µg |
| 318 | Vitamin A | IU |
| 321 | Choline, total | mg |
| 322 | Vitamin D (D2 + D3) | IU |
| 323 | Vitamin E (alpha-tocopherol) | mg |
| 324 | Vitamin K (phylloquinone) | µg |
| 401 | Vitamin C, total ascorbic acid | mg |
| 404 | Thiamin | mg |
| 405 | Riboflavin | mg |
| 406 | Niacin | mg |
| 410 | Pantothenic acid | mg |
| 415 | Vitamin B-6 | mg |
| 417 | Folate, total | µg |
| 418 | Vitamin B-12 | µg |
| 430 | Vitamin K (alternative code) | µg |
| 601 | Cholesterol | mg |
| 605 | Fatty acids, total trans | g |
| 606 | Fatty acids, total saturated | g |
| 645 | Fatty acids, total monounsaturated | g |
| 646 | Fatty acids, total polyunsaturated | g |
| 700 | Phytosterols *(Trainerize whitelist)* | mg |
| 701 | Beta-sitosterol *(Trainerize whitelist)* | mg |
| 1100 | Added sugars *(Trainerize extended ID)* | g |
| 1102 | Vitamin D (µg) *(Trainerize extended ID)* | µg |

**FE minimum for custom food create:** include at least **`208` (Energy / kcal)**; macros **`203`, `205`, `204`** recommended.

**Source of truth in code:** `trainerizeNutrNoAllowedValues` in `packages/modules/trainerize/trainerize.schema.ts`.

---

## §5 — POST custom-food required fields ⚠️

**Status:** Partial

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `POST /trainerize/me/nutrition/custom-foods` | `dailyNutrition/addCustomFood` |

**Answers:**

1. Empty body `{}` — passes Apex Zod but likely **rejected by Trainerize**; do not allow in UI.
2. **FE minimum:** `name` + at least one `serving` with `nutrients` (include `208` calories).
3. Serving with empty `nutrients` — allowed by Zod; upstream behavior unknown.
4. `nutrNo` + `nutrVal` required **when `nutrients` array is present** — applies to both POST and PUT.

---

## §6 — PUT update required fields ⚠️

**Status:** Resolved

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `PUT /trainerize/me/nutrition/custom-foods` | `dailyNutrition/setCustomFood` |

### Required request body

| Field | Required | Description |
|-------|----------|-------------|
| `foodId` | Yes | Existing food ID from `GET /custom-foods` |
| `name` | Yes | Food display name |
| `serving` | Yes | **At least one** serving object (non-empty array) |

**Example:**

```json
{
  "foodId": 1006803744,
  "name": "Homemade protein shake",
  "serving": [
    {
      "name": "1 serving",
      "amount": 1,
      "weight": 250,
      "nutrients": [
        { "nutrNo": 208, "nutrVal": 260 },
        { "nutrNo": 203, "nutrVal": 30 },
        { "nutrNo": 205, "nutrVal": 10 },
        { "nutrNo": 204, "nutrVal": 5 }
      ]
    }
  ]
}
```

### Optional fields

| Field | Notes |
|-------|-------|
| `barcode` | Must be unique within the studio group |
| `serving[].weight` | Grams — supported on PUT only (not on POST) |
| `serving[].nutrients[]` | When present, each row requires `nutrNo` + `nutrVal` (see §4) |

### FE guidance

- Always send the **full** `name` + **complete** `serving` array on save (re-fetch from list before edit, merge changes, then PUT).
- Do not send `serving: []` or omit `serving` — Apex validation rejects the request.

---

## §7 — Custom vs system foods ⚠️

**Status:** Resolved

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `GET /trainerize/me/nutrition/custom-foods` | `dailyNutrition/getCustomFoodList` |

**Answers:**

1. Returns **both** custom and system foods in one list.
2. Discriminator: **`type: "system" | "custom"`** on each `foods[]` row.
3. Edit/delete system foods via PUT/DELETE — **not documented**; assume **read-only** (hide buttons when `type === "system"`).
4. `groupId` query param — optional; omit for client library. Studio group: `GET /trainerize/org/group-id`.

---

## §8 — List `foods[]` item shape ⚠️

**Status:** Resolved — see §3 custom-foods response object

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `GET /trainerize/me/nutrition/custom-foods` | `dailyNutrition/getCustomFoodList` |

**Reliable fields:** `foodId`, `type`, `name`, `imageId`, `userId`, `groupId`, `sampleServing` (calories, proteins, carbs, fat), `serving[]`.  
No separate `GET /custom-foods/{id}` — list is the detail source.

---

## §9 — `date` vs `nutritionId` precedence ⚠️

**Status:** Partial

| Portal route | Trainerize upstream | Query params |
|--------------|---------------------|--------------|
| `GET /trainerize/me/nutrition` | `dailyNutrition/get` | `date`, `nutritionId` → wire `date`, `id` |

**Answers:**

1. Both optional in Apex — **at least one required in practice**.
2. Neither sent → only `userID` to Trainerize — result **unknown**; do not call without params.
3. Both sent with conflicting values → **precedence unverified** — avoid; prefer `nutritionId` from logs deep-link, `date` for calendar day tap.

---

## §10 — Default / max range on logs ⚠️

**Status:** Open on Trainerize defaults

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `GET /trainerize/me/nutrition/logs` | `dailyNutrition/getList` |

**Answers:**

1. No Apex default when `startDate`/`endDate` omitted — passes through empty.
2. No Apex max range or pagination — full window returned.
3. **FE must send explicit range** (e.g. last 7 or 30 days). Trainerize default/max when omitted — **unknown**.

---

## §11 — DELETE body + cascade ⚠️

**Status:** Open

| Portal route | Trainerize upstream |
|--------------|---------------------|
| `DELETE /trainerize/me/nutrition/custom-foods` | `dailyNutrition/deleteCustomFood` |

**Request body:**

```json
{ "foodId": 1006803744 }
```

**Answers:**

1. DELETE with JSON body — supported in Fastify; gateway/proxy compatibility **unverified**.
2. Delete food referenced in past daily logs — **undocumented**; use cautious confirm copy.
3. Group-level food delete permissions — **undocumented**.

---

## §12 — `nutritionGoal` vs `/nutrition.goals` ⚠️

**Status:** Resolved

| Portal route | Trainerize upstream | Purpose |
|--------------|---------------------|---------|
| `GET /trainerize/me/goals/list` | `goal/getList` | Full **`nutritionGoal`** assignment (settings) |
| `GET /trainerize/me/nutrition` | `dailyNutrition/get` | Day compliance: **`nutrition.goal`** + actuals |
| `GET /trainerize/me/nutrition/logs` | `dailyNutrition/getList` | Per-day **`goal`** in list entries |

**Answers:**

1. Same macro targets (`caloricGoal`, `carbsGrams`, `proteinGrams`, `fatGrams`, `nutritionDeviation`) but **different endpoints**.
2. **Authoritative for “consumed vs goal today”** → `GET /nutrition` → `nutrition.goal` in the **same response** as actuals.
3. **Edit nutrition goal** → `/me/goals` APIs. Refresh nutrition detail after goal changes.

---

## §13 — `weight` PUT-only ℹ️

**Status:** Resolved

| Portal route | Trainerize upstream | `weight` on serving |
|--------------|---------------------|---------------------|
| `POST /trainerize/me/nutrition/custom-foods` | `dailyNutrition/addCustomFood` | ❌ Not in schema |
| `PUT /trainerize/me/nutrition/custom-foods` | `dailyNutrition/setCustomFood` | ✅ Grams |

**Answer:** Intentional — hide `weight` on create form; show on edit form.

---

## Summary table

| # | Topic | Endpoints | Status |
|---|--------|-----------|--------|
| 1 | Food intake logging | All `/nutrition/*` — **no write-for-day route** | Resolved — read-only |
| 2 | Date/time formats | `GET /nutrition/logs`, `GET /nutrition` | Partial |
| 3 | Response shapes | `GET /nutrition/logs`, `GET /nutrition`, `GET /custom-foods` | Resolved — see §3 |
| 4 | `nutrNo` whitelist | `POST/PUT /custom-foods` | Resolved — see §4 table |
| 5 | POST required fields | `POST /custom-foods` | Partial |
| 6 | PUT required fields | `PUT /custom-foods` | Resolved — `foodId`, `name`, `serving[]` (min 1) |
| 7 | Custom vs system | `GET /custom-foods` | Resolved |
| 8 | List item shape | `GET /custom-foods` | Resolved |
| 9 | date vs nutritionId | `GET /nutrition` | Partial |
| 10 | Default/max range | `GET /nutrition/logs` | Open |
| 11 | DELETE cascade | `DELETE /custom-foods` | Open |
| 12 | nutritionGoal vs goal | `GET /nutrition`, `GET /goals/list` | Resolved |
| 13 | weight PUT-only | `POST/PUT /custom-foods` | Resolved |

---

## What FE can ship now

| Feature | Endpoint(s) |
|---------|-------------|
| Read-only nutrition journal | `GET /nutrition/logs`, `GET /nutrition` |
| Custom food library | `GET /custom-foods` |
| Add custom food | `POST /custom-foods` (use full `nutrNo` table) |
| Edit custom food | `PUT /custom-foods` (`foodId`, `name`, at least one `serving` required) |
| Delete custom food | `DELETE /custom-foods` |
| “Log in Trainerize app” copy | No endpoint — §1 |

**Held:** interactive day logging (§1), goal-vs-actual until goal source confirmed (§12 — use `/nutrition.goal`).
