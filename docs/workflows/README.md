# Trainerize Client Workflows

End-to-end workflow documentation for how goals, habits, challenges, milestones, accomplishments, daily workouts, and meal plans work — individually and together.

**Audience:** Frontend and backend developers building the patient portal.  
**Scope:** Tier A client routes (`/api/trainerize/me/...`) unless noted.  
**Prerequisite:** User authenticated + linked Trainerize account (`GET /trainerize/me/link`).

---

## How to read these docs

Trainerize separates **things you assign/create** from **things the platform calculates**:

| Category | Examples | App role |
|----------|----------|----------|
| **Assignable / writable** | Goals, habits, meal plans, daily workouts, bodystats, nutrition logs | Create, update, complete via API |
| **Calculated / read-only** | Challenge points, accomplishments, workout milestones, habit streak milestones | Display only — Trainerize generates on completion events |
| **Scheduling hub** | Calendar | Resolve *which* daily instance to open today |

**Start here:** [`mental-model-and-relationships.md`](./mental-model-and-relationships.md) — ecosystem map and dependency graph.

---

## Workflow index

| Doc | What it covers |
|-----|----------------|
| [`mental-model-and-relationships.md`](./mental-model-and-relationships.md) | How all features connect; ID chains; write vs read paths |
| [`workflow-client-daily-hub.md`](./workflow-client-daily-hub.md) | **Today view** — calendar as hub for workouts, habits, cardio |
| [`workflow-daily-workouts-and-milestones.md`](./workflow-daily-workouts-and-milestones.md) | Program → plan → workout def → daily workout → completion → PRs & milestones |
| [`workflow-goals-and-progress.md`](./workflow-goals-and-progress.md) | Text, weight, and nutrition goals; how progress is tracked |
| [`workflow-habits-and-streaks.md`](./workflow-habits-and-streaks.md) | Habit series, daily check-ins, streaks, habit milestones |
| [`workflow-meal-plans-and-nutrition.md`](./workflow-meal-plans-and-nutrition.md) | Meal plan assignment, generation, daily nutrition logging vs goals |
| [`workflow-challenges-and-points.md`](./workflow-challenges-and-points.md) | Challenge enrollment, scoring rules, leaderboard & threshold views |
| [`workflow-accomplishments-feed.md`](./workflow-accomplishments-feed.md) | Achievement feed — what triggers each type and where to read it |

---

## Related documentation

| Resource | Purpose |
|----------|---------|
| [`../client-workouts-flow.md`](../client-workouts-flow.md) | Focused workouts-tab implementation (4 screens) |
| [`../../frontend/trainerize/client-apis.md`](../../frontend/trainerize/client-apis.md) | Frontend HTTP reference for `/me/*` routes |
| [`../../frontend/trainerize/nutrition-photos-appointments-apis.md`](../../frontend/trainerize/nutrition-photos-appointments-apis.md) | Nutrition, photos, appointments |
| [`../api-reference/`](../api-reference/) | Raw Trainerize Partner API field docs |
| [`../api-reference/trainerize-api-issues.md`](../api-reference/trainerize-api-issues.md) | Known bugs and workarounds |

---

## Portal route quick map

| Feature | Key portal routes |
|---------|-------------------|
| Calendar (hub) | `GET /trainerize/me/calendar` |
| Daily workouts | `POST /trainerize/me/daily-workouts/query`, `POST /trainerize/me/daily-workouts` |
| Daily cardio | `GET/POST/PUT /trainerize/me/daily-cardio` |
| Goals | `GET/POST/PUT/DELETE /trainerize/me/goals/*` |
| Habits | `GET/POST /trainerize/me/habits`, `GET/PUT/DELETE /trainerize/me/habits/daily-items` |
| Meal plan | `GET/PUT/DELETE /trainerize/me/meal-plan`, `POST /trainerize/me/meal-plan/generate` |
| Nutrition logs | `GET /trainerize/me/nutrition`, `GET /trainerize/me/nutrition/logs` |
| Bodystats | `GET/POST/PUT/DELETE /trainerize/me/bodystats` |
| Challenges | `GET /trainerize/me/challenges`, `/challenges/leaderboard`, `/challenges/threshold` |
| Accomplishments | `GET /trainerize/me/accomplishments`, `/accomplishments/stats` |

All routes require auth. Trainerize `userID` is injected server-side — never send from the client.
