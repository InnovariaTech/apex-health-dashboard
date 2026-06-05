# Nutrition — Backend Clarifications Needed

> **Audience:** Backend developer owning `apps/api/src/routes/trainerize.routes.ts` and the nutrition controller/schema.
> **Source doc reviewed:** `docs/trainerize/nutrition-photos-appointments-apis.md` (Nutrition section, lines 14–187).
> **Scope:** Strictly the nutrition endpoints. Photos detail and appointments are tracked separately.
>
> These are gaps where the doc leaves a behavior **ambiguous or unspecified**. Where possible, the exact line that triggered the question is quoted. The FE will not invent answers — items marked **🚧 blocking** will not ship UI affordances until backend clarifies (memory: `dont-invent-flows-beyond-docs`).

---

## 1. 🚧 blocking — How does the user actually LOG food intake?

**Doc reference:** entire Nutrition section.

The doc covers a **custom-food library** (`/me/nutrition/custom-foods` CRUD) and **read** endpoints for daily nutrition (`/me/nutrition/logs`, `/me/nutrition`). What is **not documented** anywhere:

- Adding a food entry to today's intake
- Removing a logged food entry
- Editing how much of a food was consumed
- Logging a meal (breakfast/lunch/dinner/snack) with timestamps

> The doc's "Suggested UI flows" section shows:
> > **Nutrition journal:** `GET /nutrition/logs` (range) → tap day → `GET /nutrition?date=...`
> > **Log custom food:** `GET /nutrition/custom-foods` → create → `POST /nutrition/custom-foods` → edit → `PUT` → delete → `DELETE`
>
> Both are **read or library-CRUD only**. Neither describes how a tracked food gets onto a specific date.

**Questions:**
1. Is there an endpoint for `dailyNutrition/add` / `dailyNutrition/set` that proxies adding a food to a meal? If yes, please document it; if no, what's the intended UX — does logging happen only inside the Trainerize mobile app?
2. If logging is out-of-scope for the portal, FE should make this explicit in the UI ("Log intake from the Trainerize app"). Confirm so we render that copy instead of a broken affordance.
3. Does `GET /nutrition` return a writable shape that we re-`POST` somewhere to mutate the day's record?

**Why FE is blocked:** without an answer, the nutrition page is read-only — a journal viewer, not a logger. That's a defensible v1 but we need to confirm it's the intended scope before designing the UI.

---

## 2. 🚧 blocking — Date/time format inconsistency across the three read endpoints

**Doc reference:** lines 24–25, 29, 43–44, 51.

The three read endpoints accept different date formats:

| Endpoint | Example | Format |
|---|---|---|
| `GET /nutrition/logs` | `2026-06-01 00:00:00` | Full datetime, space-separated, no timezone |
| `GET /nutrition` | `2026-06-03` | Date only |
| `GET /photos` (existing) | `2026-06-30` | Date only |

> Quoting line 24:
> > `startDate` | `string` | No | Start datetime, e.g. `2026-06-01 00:00:00`

**Questions:**
1. For `/nutrition/logs`, does the server accept a date-only string (`2026-06-01`) and auto-fill `00:00:00`?
2. For `/nutrition`, does the server accept a full datetime (`2026-06-03 12:00:00`) or strictly date-only?
3. What timezone is the server interpreting? UTC, the user's profile timezone, the studio's timezone? With no `Z` / offset, the format is ambiguous.
4. Is ISO 8601 with `T` separator (`2026-06-01T00:00:00Z`) accepted, or strictly the documented format?

**Why FE is blocked:** if we send the wrong format silently, the server may return an empty range or 400 — we can't tell which without a contract. The format should be unified or each endpoint should document the precise pattern it expects.

---

## 3. 🚧 blocking — Response shapes are described as "Trainerize payload"

**Doc reference:** lines 32, 54.

> Quoting line 32 (logs):
> > **Response `data`:** Trainerize payload — typically `{ nutrition: [...] }` with daily summaries (calories, macros, meal names; list view omits full food detail).

> Quoting line 54 (detail):
> > **Response `data`:** Trainerize payload — `{ nutrition: { ... } }` with `meals[]`, `foods[]`, goals, etc.

"Typically", "etc." — these aren't contracts.

**Questions:**
1. Please commit to a documented field set for each endpoint (even if the values are passed through, the keys we can rely on should be enumerated).
2. For `/nutrition/logs`, what fields are guaranteed per day? `date`, `totalCalories`, `totalCarbs`, `totalProtein`, `totalFat`, `mealCount`, `nutritionId`? Other?
3. For `/nutrition`, what's the shape of `meals[]` vs `foods[]`? Are foods nested inside meals, or also at the top level (duplicated), or only one of the two?
4. The `goals` field in `/nutrition` — is this the same `nutritionGoal` from `/goals/list`, or a different shape?
5. Is `nutritionId` from `/nutrition/logs` the same ID used as `nutritionId` query param on `/nutrition`?

**Why FE is blocked:** we can defensively parse anything, but every undocumented field is a runtime guess. For correctness of macro totals and meal lists, we need the shape.

---

## 4. 🚧 blocking — `nutrNo` whitelist is not enumerated

**Doc reference:** lines 122–133.

> Quoting line 122:
> > Common `nutrNo` values:

Six values are listed (208, 203, 204, 205, 291, 307). Line 133 confirms:

> > Invalid `nutrNo` → **400** from Apex before Trainerize is called.

**Questions:**
1. What is the **full** Apex-side whitelist of valid `nutrNo` IDs? "Common" is not a contract.
2. Where should the FE source the canonical list — a constants file in `apps/api`, a `/me/nutrition/nutrients` endpoint, or hardcoded in the FE?
3. If the whitelist changes server-side, what's the version/notification mechanism so FE doesn't fall out of sync?
4. Are decimals/floats permitted in `nutrVal`, or are integers required? The doc example shows integers but doesn't say.

**Why FE is blocked:** the Custom Food form must validate `nutrNo` before submission. We can include only the six documented values, but that's likely under-featured for a real nutrition logger.

---

## 5. ⚠ clarification — `POST /custom-foods` field requirements

**Doc reference:** lines 108–120.

The field table marks **every** field as "No" (not required) — including `name`, `serving`, and `nutrients`.

> Quoting line 113:
> > `serving` | `array` | No | Serving definitions

**Questions:**
1. If FE POSTs an empty body `{}`, does Trainerize create an unnamed food with no servings? Or does the upstream reject?
2. What's the **minimum** field set the FE should enforce so users don't create unusable foods?
3. The example shows `serving[].name`, `amount`, `nutrients[]`. If we send a serving with no nutrients, does it 400 server-side or silently store an empty serving?
4. Footnote `\*Required when nutrients is present` (line 120) — confirmed for both POST and PUT?

**Why this matters:** without sensible required fields, the Add Custom Food form will either over-collect inputs that aren't required (annoying users) or under-collect and create broken records.

---

## 6. ⚠ clarification — `PUT /custom-foods` partial-update semantics

**Doc reference:** lines 145–168.

The PUT body has only `foodId` required; everything else is optional.

> Quoting line 167:
> > `serving` | `array` | No | Same shape as POST; `weight` (grams) supported on set

**Questions:**
1. If FE PUTs `{foodId: 123, name: "Renamed"}` without `serving`, does Trainerize preserve existing servings or wipe them?
2. If FE PUTs `{foodId: 123, serving: [<one new serving>]}`, does it append or replace?
3. `weight` (grams) is listed as PUT-only. Can it actually be sent on POST too, just undocumented? Or does POST 400 on unknown fields?
4. Can `barcode` be updated to a value already used by another food? (Doc says barcode is unique within studio group — does updating to a duplicate 400?)

**Why this matters:** edit semantics determine whether the FE re-sends the full food shape on every save (safe but heavy) or just deltas (lighter but risky without partial-update guarantees).

---

## 7. ⚠ clarification — Custom vs. system foods on list endpoint

**Doc reference:** line 60.

> Quoting line 60:
> > Paginated **custom (and system)** food library

**Questions:**
1. Does `/nutrition/custom-foods` return both custom and system-supplied foods mixed together?
2. Is there a field per row that distinguishes them (e.g. `source: "system" | "custom" | "group"`)? Without it, the UI can't show ownership.
3. Can system foods be edited/deleted via `PUT`/`DELETE`, or are those restricted to custom foods? If restricted, what error code on attempted edit of a system food?
4. The `groupId` query param — how does the user/client discover the studio group ID? Is there a `GET /me/nutrition/group-info` or similar?

**Why this matters:** the food library UI needs to communicate "this is yours, you can edit it" vs. "this is provided by Trainerize, read-only". Without a discriminator, every row gets edit/delete buttons that may 403.

---

## 8. ⚠ clarification — `foods[]` item shape on list endpoint

**Doc reference:** line 77.

> Quoting line 77:
> > **Response `data`:** `{ foods: [...], total: number }`

The shape of `foods[]` items is not documented at all.

**Questions:**
1. What fields can the FE rely on for each `foods[]` row? `id`, `name`, `barcode`, `serving`, `nutrients`, `caloriesPerServing`, `source`?
2. Does the list response include nutrient detail per food, or just summary fields? (If summary, FE needs a `GET /nutrition/custom-foods/{id}` for detail — not documented.)

**Why this matters:** the search-as-you-type food picker (used for logging — see §1) needs at least name + calories. If those aren't on the list response, FE has to fetch each food separately.

---

## 9. ⚠ clarification — Date-only vs `nutritionId` precedence on `GET /nutrition`

**Doc reference:** lines 42–47.

> Quoting line 47:
> > Provide `date` and/or `nutritionId` (at least one recommended).

**Questions:**
1. "Recommended" — is it strictly **required**, or does the server have a default (today's date)?
2. If both are sent and they disagree (e.g. `nutritionId` is for 2026-06-01 but `date=2026-06-03`), which wins?
3. If neither is sent, what's returned — today, an error, or an empty payload?

**Why this matters:** the journal-day view will typically use `date`; the "open this log" deep-link will use `nutritionId`. We need to know if the FE should prefer one over the other, and how to handle the empty-args case.

---

## 10. ⚠ clarification — Default range / max range on `GET /nutrition/logs`

**Doc reference:** lines 16–32.

Both `startDate` and `endDate` are marked optional.

**Questions:**
1. What is the **default range** when both are omitted? Last 7 days? Last 30? All time?
2. Is there a **max range** the server enforces? Trainerize Partner APIs typically cap at 90 days; does Apex propagate that or relax it?
3. What's the rate-limit / pagination story for large ranges? No `start`/`count` params are listed — is the response always the full window?

**Why this matters:** the journal page needs to pick a sensible default window. Without a documented max, large date ranges might 502 or timeout silently.

---

## 11. ⚠ clarification — `DELETE` gateway compatibility & cascading effects

**Doc reference:** lines 171–185.

`DELETE /custom-foods` uses a JSON request body — same as goals.

**Questions:**
1. Does the staging/production reverse proxy preserve DELETE request bodies end-to-end? (Already raised for goals/habits delete — confirming once for the whole pattern.)
2. If a custom food has been **logged** into past `dailyNutrition` records, does deleting the food affect those records? Hard-delete with cascade, soft-delete preserving history, or 409 if referenced?
3. Can a non-owner delete a group-level food (when `groupId` was set on create)?

**Why this matters:** the UX around "Delete this food" depends entirely on whether historical logs survive. If they're orphaned or removed, the confirm copy needs to say so.

---

## 12. ⚠ clarification — Relationship between `/goals` `nutritionGoal` and `/nutrition` `goals` field

**Doc reference:** line 54.

> Quoting line 54:
> > `{ nutrition: { ... } }` with `meals[]`, `foods[]`, goals, etc.

The `/goals` API also exposes a `nutritionGoal` type with `caloricGoal`, `carbsGrams`, etc.

**Questions:**
1. Is the `goals` field inside `/nutrition` the same `nutritionGoal` from `/goals/list`?
2. If yes, which is authoritative when they disagree? Race conditions are possible if a user updates a nutritionGoal mid-day.
3. If different shapes, please name and document the `/nutrition` goals shape distinctly so FE doesn't conflate them in code.

**Why this matters:** the journal page wants to show "consumed vs. goal" macros. If we read the goal from one endpoint while the user updates it from another, we'll display stale numbers.

---

## 13. ℹ informational — Custom food `weight` field is PUT-only

**Doc reference:** line 167 vs lines 113–116.

The doc explicitly says `weight` is supported on `serving` for **set** (PUT) but not **add** (POST). This is unusual.

**Question:** intentional, or doc oversight? If intentional, what's the workaround for creating a food with a weight per serving (which would seem to be a common case)?

Answer drives whether the Add Custom Food form should show a `weight` input or hide it until the user opens Edit.

---

## Summary table

| # | Topic | Severity | Blocks |
|---|---|---|---|
| 1 | Food intake logging endpoint | 🚧 blocking | Whether nutrition is journal-only or interactive |
| 2 | Date/time format inconsistency | 🚧 blocking | All read endpoints |
| 3 | "Trainerize payload" undocumented shape | 🚧 blocking | Logs + detail rendering |
| 4 | Full `nutrNo` whitelist | 🚧 blocking | Custom food create form |
| 5 | POST required-field minimums | ⚠ clarification | Create form gating |
| 6 | PUT partial-update semantics | ⚠ clarification | Edit form |
| 7 | Custom vs system source flag | ⚠ clarification | Edit/delete affordance gating |
| 8 | List `foods[]` item shape | ⚠ clarification | Food picker |
| 9 | `date` vs `nutritionId` precedence | ⚠ clarification | Detail entry point |
| 10 | Default / max range on logs | ⚠ clarification | Journal default window |
| 11 | DELETE through gateway + cascades | ⚠ clarification | Delete confirm copy |
| 12 | `nutritionGoal` vs `/nutrition.goals` | ⚠ clarification | Macro-vs-goal display |
| 13 | `weight` PUT-only | ℹ info | Create form layout |

---

## What FE will ship without waiting

Against the current doc as written, the FE can build:

- **Read-only nutrition journal** — a Nutrition page that lists day summaries from `/nutrition/logs` and opens a day detail from `/nutrition`. Shape parsing is defensive; missing fields render as "—".
- **Custom food library list + search + pagination** — `GET /custom-foods`.
- **Add Custom Food** with the six documented `nutrNo` values only, name + one serving + nutrients.
- **Edit / Delete Custom Food** with a "may affect historical logs" caveat in the delete confirm.

Held until clarified:

- **Logging intake** (held on §1) — the entire interactive part of a nutrition feature
- **Extended nutrient inputs** (held on §4) — only six `nutrNo` values surfaced for now
- **Goal-vs-actual macro display** (held on §12) — without knowing which goals field is authoritative
- **System food badging** (held on §7) — no edit/delete buttons on rows whose source we can't determine

If the answer to §1 is "logging happens in the Trainerize app", FE will surface that as explicit copy on the Nutrition page rather than ship a broken affordance.
