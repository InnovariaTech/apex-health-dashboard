# Goals — Backend Clarifications Needed

> **Audience:** Backend developer owning `apps/api/src/routes/trainerize.routes.ts` and the goals controller/schema.
> **Source docs reviewed:** `README.md`, `list-goals.md`, `goal-detail.md`, `goal-add.md`, `goal-set.md`, `goal-progress.md`, `goal-delete.md`.
> **Audience on FE side:** integration with the patient portal (`src/{types,api,hooks}/trainerize/*`), surfaced inside the Progress page as a "Goals" tab.
>
> These are gaps where the current docs leave a behavior **ambiguous or unspecified**. Where possible we cite the exact doc line that triggered the question. We are **not** assuming an answer; the FE will block on items marked **🚧 blocking** before shipping the corresponding affordance.

> **📌 Update — backend responses received.** See **[`goals-issue-responses.md`](./goals-issue-responses.md)** for the authoritative answers. Each item below now carries a **✅ Resolution** block citing the response section. Items 1–3 are unblocked and shipped; 4, 6, 7 have shipped FE changes; 5, 9, 10 remain partial; 8 is open; 11 is informational. Original questions are preserved for historical context.

---

## 1. ✅ resolved (was: 🚧 blocking) — How does `PUT /goals` (update) target a specific goal?

**✅ Resolution — see `goals-issue-responses.md` §1.** `PUT /goals` updates **by `type`**, not by `goalId`. Trainerize treats it as **one updatable slot per type**. Body shape is identical to POST; no `goalId` on wire. When multiple goals of the same `type` exist, PUT is unsafe — FE detects this and disables the Edit button on those cards with an amber warning.
**FE state:** Edit dialog shipped (`GoalDialog.tsx`, dual-mode). Multi-of-type guard wired in `GoalsTab.tsx`.

---

### Original questions

**Doc reference:** `goal-set.md` lines 11–28.

The documented body for the update endpoint is identical to the add endpoint — `type` + type-specific fields. No `id` / `goalId` appears in the body or path.

> Quoting `goal-set.md`:
> > **Note:** Trainerize `goal/set` docs may not require goal `id` in the wire body — our API follows the add shape. Verify update semantics against live Trainerize before relying on partial updates.

The doc itself flags this as unverified.

**Questions:**
1. When a user has multiple goals of the **same `type`** (e.g. two `textGoal`s, or one historical `weightGoal` and a new one), how does the wire decide which goal to update?
2. If Trainerize identifies the goal by `(userID, type)` and assumes one-per-type, what is the contract for users with multiple goals of the same type from prior sessions?
3. Should the FE send `id` in the body anyway (server passes through harmlessly) so we are ready when upstream adds it? Or will Zod reject unknown fields?
4. Is there a path/query alternative (e.g. `PUT /goals/:goalId`) that we should use instead, that just isn't reflected in the doc?

**Why FE is blocked:** without an answer, the Edit affordance is unsafe — clicking "Edit" on Goal #2 could overwrite Goal #1 if both share `type`. We will ship Add/Delete/Progress first and hold Edit until this is resolved.

---

## 2. ✅ resolved (was: 🚧 blocking) — Does `PUT /goals/progress` apply to non-text goals?

**✅ Resolution — see `goals-issue-responses.md` §2.** **Text goals only** in the FE. `progress` is a 0–100 percentage. `progress >= 100` triggers `achieved: true` server-side and may emit a `hitTextGoal` accomplishment.
**FE state:** "Update progress" affordance lives only on `TextGoalCard`; weight/nutrition cards never expose it.

---

### Original questions

**Doc reference:** `goal-progress.md` lines 5, 13–14.

> Quoting line 5:
> > Updates progress on a goal (typically text goals).

"Typically" is ambiguous. The request schema only requires `goalId` + numeric `progress`, with no `type` discriminator.

**Questions:**
1. If the FE calls `PUT /goals/progress` with `goalId` pointing to a `weightGoal` or `nutritionGoal`, does Trainerize accept it, ignore it silently, or return an error?
2. Is `progress` a 0–100 percentage, an arbitrary number whose meaning depends on goal type, or freeform metadata?
3. Does updating `progress` ever cause `achieved` to flip server-side (e.g. `progress >= 100` → `achieved: true`)?

**Why FE is blocked:** we plan to only show the "Update progress" affordance on text goals until this is confirmed, so we don't expose a button that 502s.

---

## 3. ✅ resolved (was: 🚧 blocking) — How is `achieved` set / flipped?

**✅ Resolution — see `goals-issue-responses.md` §3.** `achieved` is **read-only** — there is **no manual write path**. Flip mechanisms by type:
- `textGoal` → `PUT /goals/progress` with `progress: 100`
- `weightGoal` → `PUT /me/bodystats` crossing the target weight
- `nutritionGoal` → ongoing daily compliance, `achieved` is often not meaningful here

**FE state:** No "Mark achieved" button anywhere in the UI. Active/Achieved tab toggle on the list filter is purely a read filter and remains as-is.

---

### Original questions

**Doc reference:** `list-goals.md` line 68, `goal-add.md` (no `achieved` field), README "Goals are auto-generated by Trainerize" wording.

`achieved` appears in **read responses** but is not in any **write payload** documented:

- Not in `goal-add.md` body fields.
- Not in `goal-set.md` body fields.
- Not in `goal-progress.md` body fields.

**Questions:**
1. Is `achieved` purely upstream-derived (e.g. weight goals auto-flip when `currentWeight` crosses `weightGoal`), or is there a write path we should expose?
2. For `textGoal`, what triggers `achieved: true` — `progress >= 100` via `goals/progress`, or something else?
3. For `nutritionGoal`, is `achieved` ever meaningful? (The goal is open-ended tracking, not a target to hit.)
4. If a user wants to **manually** mark a goal achieved (e.g. "Run a 5K — done!"), is there a supported path? Or do they just delete the goal?

**Why FE is blocked:** the goals list has an "Active / Achieved" filter toggle. Users will reasonably expect a "Mark achieved" button — we need to know whether to render one and which endpoint backs it.

---

## 4. 🟡 partial — `goal-detail.md` userId injection difference

**🟡 Resolution — see `goals-issue-responses.md` §4.** Apex performs a **link check** (`requireTrainerizeAccountLink`) on every goals route but does **not** verify that `goalId` belongs to the linked client before calling Trainerize on `get` / `delete` / `progress`. Authorization relies on **Trainerize Partner API** to reject cross-user access (403).
**FE state:** FE only consumes `goalId` values returned from the authenticated user's own list responses; never persists or accepts `goalId` from URL params or untrusted sources.

---

### Original questions

**Doc reference:** `goal-detail.md` line 5 and `goal-add.md` line 5.

The detail endpoint doc says:

> "Link check only — no `userId` injection on this Partner call."

But the add doc says:

> "Client `userID` injected server-side."

**Questions:**
1. Why the difference? If `goal/get` doesn't need `userID`, what stops User A from passing User B's `goalId` and reading their goal?
2. Is the link check sufficient because Trainerize's `goal/get` enforces ownership upstream? If so, please confirm in writing so we can document this in FE code comments.
3. Is the same true for `goal-progress` and `goal-delete` (both also identify by `goalId`)?

**Why this matters:** the FE will not log or expose `goalId`s of other users, but a clear server-side authorization story is needed before we trust these endpoints in production.

---

## 5. 🟡 partial — `unitWeight` semantics on list/detail

**🟡 Resolution — see `goals-issue-responses.md` §5.** `unitWeight` is a **conversion hint** (not a filter) — Trainerize converts `weightGoal`, `currentWeight`, `startWeight` into that unit on the way out. Default when omitted aligns with the user's `/me/settings.unitWeight`. `achieved` is a **read filter** (`true` / `false` query strings); behavior for nutrition goals with no achieved concept is unverified.
**FE state:** FE passes `unitWeight` from `useTrainerizeUnits()` on list/detail queries; treats `achieved` as a strict read filter.

---

### Original questions

**Doc reference:** `list-goals.md` lines 13, 22; `goal-detail.md` lines 13–14.

Query params `unitWeight` and `achieved` are listed as optional, with no description of what they do.

**Questions:**
1. Does `unitWeight` on the list/detail query **convert** numeric weight fields (`weightGoal`, `currentWeight`, `startWeight`) into that unit on the way out? Or is it a **filter** (only return goals whose `unitWeight` matches)?
2. If conversion, what's the default when omitted — `lbs`, `kg`, or whatever the user's `/me/settings.unitWeight` is set to?
3. Does `achieved=false` exclude `null`/missing `achieved` values (e.g. nutrition goals where the concept may not apply), or include them?

**Why this matters:** the FE pulls units from `useTrainerizeUnits()` and would pass them on list/detail queries. We need to know whether passing them is just a hint or actually mutates the response.

---

## 6. ✅ resolved (was: ⚠ clarification) — `nutritionGoal` validation rules

**✅ Resolution — see `goals-issue-responses.md` §6.** Apex validates `type`, `trackingType` enum, and numeric field types. Apex does **NOT** validate that percents sum to 100 or that grams match `caloricGoal × density`. The doc recommends **Strategy A: percents + caloricGoal only** (Trainerize derives grams). Strategy B (grams-only) and Strategy C (calories-only) are also valid.
**FE state:** AddGoalDialog now uses **Strategy A** exclusively for nutrition goals — calorie field + 3 percent fields with a live sum indicator (must total 100±0.5). Grams fields are hidden entirely. Backend cross-validation is duplicated client-side as a UX guard.

---

### Original questions

**Doc reference:** `goal-add.md` lines 50–62.

The nutrition body has paired fields:

- `carbsGrams` + `carbsPercent`
- `proteinGrams` + `proteinPercent`
- `fatGrams` + `fatPercent`
- plus `caloricGoal`

**Questions:**
1. Does the backend (or Trainerize) **require** that grams × kcal per gram = caloricGoal? Or that percents sum to 100?
2. If we send only `caloricGoal` + percents (no grams), does Trainerize derive grams, or does it reject the payload?
3. Same question inverted: grams only, no percents — supported?
4. What happens if we send conflicting values (e.g. `carbsPercent: 50` but `carbsGrams` implies 30%)? Server-side reconciliation, or 400?

**Why this matters:** the AddNutritionGoal form needs to know whether to make percents required, optional, or auto-derived. Without an answer we'd either over-constrain users or pass invalid payloads.

---

## 7. ✅ resolved (was: ⚠ clarification) — `weightGoal.clientActiveLevel` requirement

**✅ Resolution — see `goals-issue-responses.md` §7.** Apex marks every weight field optional. FE minimum recommended for create: `type + unitWeight + weightGoal`. Recommended: `weeklyWeightGoal`, `clientActiveLevel`, `startDate`, `startWeight`, `currentWeight`. **Current weight updates** should go through `PUT /me/bodystats`, not the goals API.
**FE state:** AddGoalDialog gates submit on `type + unitWeight + weightGoal`. `unitWeight` pre-fills from settings. Weight card footer points users to **Progress → Measurements** for current weight changes (truth path = `PUT /me/bodystats`).

---

### Original questions

**Doc reference:** `goal-add.md` lines 38–47.

The weight goal example payload includes `clientActiveLevel: "moderatelyActive"`, but the field table doesn't mark it required.

**Questions:**
1. Is `clientActiveLevel` required for the create payload, or optional with an upstream default?
2. Same question for `weeklyWeightGoal`, `startDate`, `startWeight`, `currentWeight` — which are required by Trainerize, vs. optional with server-side defaulting?
3. On update (PUT), can we send only `currentWeight` (as the doc example shows on line 24) and leave the rest of the weight goal config untouched? Or does the partial-update semantic question (§1) compound here?

**Why this matters:** we want to surface the minimum-required form, not a wall of inputs. Knowing what's truly required prevents 400 loops and unnecessary UI.

---

## 8. 🔴 open — Maximum goals per user / per type

**🔴 Resolution — see `goals-issue-responses.md` §8.** No documented cap. List **can** return multiple goals of the same `type`. `goal/set` is per-type, so creating a duplicate may add a row while edits update the type slot (live behavior unverified). Cap-exceeded behavior is not specified.
**FE state:** No hard gate on Add. Server-error messages surface verbatim via toast. Multi-of-type guard (§1) handles the related risk for Edit.

---

### Original questions

**Doc reference:** none — not addressed in any doc.

**Questions:**
1. Does Trainerize cap the number of active goals per user?
2. Per type — is a user allowed multiple active `weightGoal`s, or does the new one supersede the old?
3. If a cap exists and is exceeded on `POST /goals`, what response shape do we get — `400` Zod, `502` upstream, or a specific error code we can branch on?

**Why this matters:** the Add Goal button needs to know whether to gate ("You already have a weight goal") or just let Trainerize reject and surface its message.

---

## 9. 🟡 partial — `progress` field shape on read

**🟡 Resolution — see `goals-issue-responses.md` §9.** Trainerize **may** echo `progress` (number, 0–100) on `GET /goals/list` and `GET /goals/detail` after a `setProgress` call, but this isn't yet declared in `TrainerizeWireGoalListItem`. Not guaranteed — verify with live calls.
**FE state:** `TextGoal.progress` is optional in the FE type. The progress bar renders only when the field is numeric and finite; otherwise we suppress the bar rather than show a misleading "0%". Mutation responses are not snapshotted to localStorage — if the field disappears on next read, the bar simply hides.

---

### Original questions

**Doc reference:** `list-goals.md` lines 30–57 (sample responses).

Neither the list nor the detail sample responses include a `progress` field on the returned goal objects, but `goal-progress.md` lets us set one.

**Questions:**
1. Once `progress` is set via `PUT /goals/progress`, does it come back on `GET /goals/list` and `GET /goals/detail`?
2. Under what key — `progress` (matches the write field), or something else?
3. Is progress per-day / cumulative / latest-wins?

**Why this matters:** the GoalCard for textGoal wants to render a progress bar from the current value. If reads don't echo progress, the value disappears after refresh — that's a UX dead-end we'd want to flag in the UI copy instead of silently failing.

---

## 10. 🟡 partial — DELETE with body — gateway compatibility

**🟡 Resolution — see `goals-issue-responses.md` §10.** DELETE with body is the **required** pattern (maps to Trainerize `id`). There is **no** `?goalId=` query fallback on the portal today. Gateway / reverse-proxy compatibility for DELETE bodies remains unverified (same caveat as habits, nutrition).
**FE state:** `deleteGoal(payload)` sends the body via axios `{ data: payload }`. No FE fallback yet. If infra strips bodies, surface backend addition of a query-param alternative as the fix path.

---

### Original questions

**Doc reference:** `goal-delete.md` lines 4, 39–48.

> Quoting line 4:
> > "Requires JSON body (Fastify DELETE with body)."

**Questions:**
1. Does the staging/production reverse proxy (nginx / API gateway / Cloudflare) preserve DELETE request bodies end-to-end? Some gateways strip them.
2. If a future infra change causes body stripping, is there a `?goalId=` fallback you'd recommend the FE move to pre-emptively?

**Why this matters:** habits had the same pattern (`deleteDailyItem`) and worked, but this is worth confirming once for goals before users start deleting things and getting 400s.

---

## 11. ℹ informational — Accomplishments adjacency

**ℹ Resolution — see `goals-issue-responses.md` §11.** Goals tab can ship without accomplishments. A "Recent wins" tile reading from `/me/accomplishments` is recommended as a separate ticket.
**FE state:** Not in the goals tab scope. Hooks/types/API for accomplishments not yet built.

---

### Original questions

**Doc reference:** `README.md` lines 57–67.

The README documents `/me/accomplishments` and `/me/accomplishments/stats` alongside goals. The FE goals plan does **not** include accomplishments yet.

**Question:** is it preferred that we bundle a basic "Recent accomplishments" tile in the same Progress-tab work, or keep that as a separate FE ticket? No backend change requested either way — just confirming priority.

---

## Summary table (post-resolution)

Legend: ✅ resolved · 🟡 partial · 🔴 open · ℹ informational

| # | Topic | Original severity | Current status | FE outcome |
|---|---|---|---|---|
| 1 | PUT /goals targeting | 🚧 blocking | ✅ resolved | Edit shipped; multi-of-type warning |
| 2 | progress on non-text goals | 🚧 blocking | ✅ resolved | Update progress is text-only |
| 3 | `achieved` flip mechanism | 🚧 blocking | ✅ resolved | No Mark Achieved button (read-only) |
| 4 | goal-detail authorization | ⚠ clarification | 🟡 partial | FE uses authenticated-user goalIds only |
| 5 | unitWeight on read | ⚠ clarification | 🟡 partial | Passed from settings; conversion hint |
| 6 | nutrition validation | ⚠ clarification | ✅ resolved | Strategy A (percents) with sum guard |
| 7 | weightGoal required fields | ⚠ clarification | ✅ resolved | unit + target required; bodystats hint |
| 8 | per-user goal cap | ⚠ clarification | 🔴 open | No hard gate; surface upstream errors |
| 9 | progress on read | ⚠ clarification | 🟡 partial | Optional; bar hides when absent |
| 10 | DELETE body through gateway | ⚠ clarification | 🟡 partial | Pattern shipped; infra unverified |
| 11 | Accomplishments scope | ℹ info | ℹ info | Separate FE ticket |

---

## What FE has shipped (after resolution)

Against the original docs **plus** the resolutions in `goals-issue-responses.md`:

- `GET /goals/list` with `achieved` toggle + pagination → goal cards (active / achieved filter)
- `GET /goals/detail` — backed by `useGoalDetail` (currently unused; available for future deep-links)
- `POST /goals` for all three types — gates: text needs description; weight needs `unitWeight + weightGoal`; nutrition needs `caloricGoal` and (if any percent set) all three summing to 100±0.5
- `PUT /goals` — Edit dialog ships per §1; type selector disabled in edit mode; multi-of-type rows show an amber warning and disable the Edit button
- `PUT /goals/progress` — text-only "Update progress" affordance per §2; submitting `progress: 100` is the FE's only path to mark a text goal achieved
- `DELETE /goals` — single confirm dialog with JSON body

## Still held / out-of-scope

| Item | Reason | Tracked in |
|---|---|---|
| Mark achieved on weight/nutrition manually | §3 — no documented write path | resolved as "not implementable" |
| Hard gate on Add when one-per-type | §8 — cap unconfirmed | server message surfaced instead |
| Live `progress` echo guarantee | §9 — Trainerize behavior unverified | UI degrades gracefully |
| DELETE body through production gateway | §10 — infra not yet exercised against goals delete in prod | watch on first prod use |
| Accomplishments feed | §11 — separate ticket | not yet built |

## FE files changed during integration

- `src/types/trainerize/goals_types.ts` — header comment now reflects resolutions
- `src/views/patient/components/progress/GoalDialog.tsx` — **new** dual-mode dialog (replaced `AddGoalDialog.tsx`)
- `src/views/patient/components/progress/GoalsTab.tsx` — Edit state, multi-of-type detection, EditButton + warning chip, bodystats hint on WeightGoalCard
- `src/views/patient/components/progress/UpdateProgressDialog.tsx` — unchanged (already text-only)
- `src/views/patient/components/progress/DeleteGoalDialog.tsx` — unchanged
