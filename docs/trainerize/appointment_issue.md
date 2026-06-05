# Appointments — Backend Clarifications Needed

> **Audience:** Backend developer owning `apps/api/src/routes/trainerize.routes.ts` and the appointments controller/schema.
> **Source doc reviewed:** `docs/trainerize/nutrition-photos-appointments-apis.md` — Appointments section, lines 238–307.
> **Scope:** Strictly the appointment endpoints (list / types / type-detail / book). Nutrition and photos detail are tracked separately.
>
> The doc presents a documented **POST** but only one-liners for the **GET** routes — most of the gaps below are around what those reads return and how booking semantics actually work. Memory: `dont-invent-flows-beyond-docs` — items marked **🚧 blocking** will not ship UI affordances until clarified.

---

## 1. 🚧 blocking — `userId` headline rule vs. body field

**Doc reference:** line 10 (general header) vs. lines 274–280 (appointment POST body).

> Quoting line 10:
> > "Do **not** send Trainerize `userID` / `userId` — the backend injects the linked client's ID."

But the appointment body **requires** `userId`:

> Quoting line 274:
> > `userId` | `number` | Yes | **Trainer's** Trainerize ID — use `trainerID` from `GET /me/settings`

And `attendents[].userId` is the **client's** ID:

> Quoting line 280:
> > `attendents` | `{ userId }[]` | No | Attendees — client should use linked `trainerizeUserId` from `/me/link`

**Questions:**
1. Is the headline rule meant to mean "don't send the **client's** userID *as the top-level userId*"? If so, please reword to disambiguate.
2. Top-level `userId` = trainer's ID — confirmed required, never injected? Or does backend inject `trainerID` from `/me/settings` automatically if omitted?
3. `attendents[].userId` = client's ID — confirmed required, or does backend inject the linked client into `attendents[]` automatically if the array is missing/empty?
4. If FE omits `attendents` entirely, does the appointment get created with the client implicitly attached, or with no attendees?

**Why FE is blocked:** the entire "Book appointment" flow depends on knowing which IDs to send and which to omit. Sending the wrong one risks "create appointment for some other client" if the injection rules aren't actually applied.

---

## 2. 🚧 blocking — GET endpoint response shapes are undocumented

**Doc reference:** lines 240–246.

The doc lists three read endpoints with one-line descriptions and no response examples:

> Quoting lines 240–246:
> > Existing read routes:
> >
> > | Method | Path | Purpose |
> > |---|---|---|
> > | `GET` | `/trainerize/me/appointments` | List appointments (`startDate`, `endDate`) |
> > | `GET` | `/trainerize/me/appointment-types` | List bookable types |
> > | `GET` | `/trainerize/me/appointment-types/detail` | Type detail (`appointmentTypeId`) |

**Questions:**
1. For `GET /me/appointments`, please document the response `data` shape. Expected fields per appointment? `id`, `startDate`, `endDate`, `status`, `appointmentTypeId`, `appointmentType`, `userId` (trainer), `attendents[]`, `actionInfo`, `notes`, `createdAt`?
2. What `status` values can an appointment have — `pending` / `confirmed` / `cancelled` / `completed` / `no_show`?
3. For `GET /me/appointment-types`, what fields per type? `id`, `name`, `duration`, `description`, `colorHex`, `isBookable`?
4. For `GET /me/appointment-types/detail`, what extra fields are returned that the list doesn't include?
5. For `GET /me/appointments`, are `startDate` / `endDate` query params required or optional? What's the date format and timezone?
6. Is the list response paginated (`start` / `count`) or always the full window?

**Why FE is blocked:** without committed field sets, the appointments list page would render mostly placeholder columns. We can defensively parse, but every undocumented field is a runtime guess.

---

## 3. 🚧 blocking — No documented cancel / reschedule path

**Doc reference:** Appointments section as a whole.

The doc shows only `POST /appointments` (book). There is no `PUT` (reschedule / update notes) and no `DELETE` (cancel) for appointments.

**Questions:**
1. Are PUT and DELETE intentionally out-of-scope for v1?
2. If yes, what's the documented user path — "Cancel from the Trainerize app"? The FE will surface that explicitly so users don't expect a cancel button.
3. If they exist but aren't documented yet, please add doc entries with body shape + response.
4. Does Trainerize support **status updates** through Partner APIs (`confirmed` → `cancelled`) without deleting?

**Why FE is blocked:** "Book an appointment" without a "Cancel" affordance leaves users stuck. We need to know whether to render a Cancel button (and which endpoint backs it), redirect to the Trainerize app for cancels, or omit the affordance with explanation.

---

## 4. 🚧 blocking — `recurrencePattern` semantics

**Doc reference:** lines 290–307.

> Quoting lines 292–307:
> > ```json
> > {
> >   "actionInfo": {
> >     "isRecurring": true,
> >     "recurrencePattern": {
> >       "frequency": "weekly",
> >       "duration": 4,
> >       "totalCount": 4,
> >       "repeatWeekly": {
> >         "every": 1,
> >         "weekDays": ["monday", "wednesday"]
> >       }
> >     }
> >   }
> > }
> > ```

**Questions:**
1. Allowed `frequency` values — `weekly` only, or `daily` / `monthly` / `yearly` too?
2. For `monthly` / `daily` frequencies, is there a `repeatMonthly` / `repeatDaily` analogue to `repeatWeekly`?
3. What does `duration: 4` mean — 4 weeks? 4 occurrences? Why is it documented separately from `totalCount: 4`? When do they differ?
4. `repeatWeekly.every: 1` — every 1 week. To skip a week (`every: 2`), is that supported? Where's the cap?
5. The example creates 4 occurrences with `weekDays: ["monday", "wednesday"]` — does that mean 4 *pairs* (8 total appointments), or 4 *occurrences* spread across the listed weekdays?
6. **Response shape:** does `POST /appointments` with recurrence return all generated appointment IDs as an array, or just the first occurrence's ID? Doc shows `{id: number}` only.
7. Cancel/reschedule semantics (§3 above) become significantly more complex for recurrence — does cancelling one occurrence cancel the series, leave the series, or branch it?

**Why FE is blocked:** "Book recurring" needs unambiguous semantics or users will create unintended appointment storms.

---

## 5. ⚠ clarification — `startDate` / `endDate` timezone format

**Doc reference:** lines 259–260 (POST example), line 277 (field table).

> Quoting line 277:
> > `startDate` | `string` | Yes | UTC datetime

But the example shows `2026-06-10T14:00:00` — no `Z` suffix, no UTC offset.

**Questions:**
1. Is the missing `Z` interpreted as UTC by default? Does the server accept `2026-06-10T14:00:00Z` explicitly?
2. What happens if the client sends a local-time-with-offset string like `2026-06-10T14:00:00-05:00` — accepted and converted, or 400?
3. For the GET `/appointments` list, what timezone are the response `startDate` / `endDate` values in?
4. How does the FE communicate "the user is in PST, but the server stores UTC" without surprises (e.g. an appointment booked for 14:00 their time showing up in the wrong day)?

**Why this matters:** appointment scheduling is one of the few places timezone bugs are immediately visible to users. We need a tight contract before users start booking.

---

## 6. ⚠ clarification — `attendents` (sic) — typo or wire format?

**Doc reference:** lines 263, 280.

The field name is consistently spelled `attendents` (not `attendees`) throughout the example and the field table.

**Questions:**
1. Is this a Trainerize wire-format key the proxy preserves verbatim, or a typo we should report?
2. If it's the wire format, the FE will use `attendents` exactly. If it's a typo, please fix in code and doc before we lock the FE to the misspelling.

**Why this matters:** small thing, but a typo locked into the FE becomes hard to remove later — every consumer of the response has to be migrated when the server is corrected.

---

## 7. ⚠ clarification — Multi-attendee group sessions

**Doc reference:** lines 285–286 (validation).

> Quoting lines 285–286:
> > **Validation (server):**
> > - `userId` must match the client's assigned trainer (`settings.trainerID`).
> > - Each `attendents[].userId` must equal the linked client's Trainerize ID.

The second rule says **each** attendee must equal the linked client — which forbids multi-client group sessions booked from the client portal.

**Questions:**
1. Is that intentional — clients can only book sessions for themselves, never groups?
2. Or does the rule only require that the linked client is *one of* the attendees (and additional `attendents[].userId` values are allowed)?
3. If multi-attendee group bookings are out-of-scope, the FE will hide that field entirely. Confirm so we don't render an array input that always 400s.

**Why this matters:** affects whether the booking dialog shows a single "Book for me" submission or an attendee picker.

---

## 8. ⚠ clarification — `actionInfo` extra fields

**Doc reference:** lines 266–270, 281.

> Quoting line 281:
> > `actionInfo` | `object` | No | Video call, recurrence, etc.

"etc." isn't a contract. The example shows `isVideoCall` and `isRecurring` (plus the recurrence nested object).

**Questions:**
1. What other `actionInfo` fields exist? Trainerize Partner docs typically include `videoCallType`, `videoCallURL`, `location`, `reminderMinutes`. Which are exposed?
2. For `isVideoCall: true`, does Trainerize auto-generate a meeting URL that comes back on the GET response? Under what field?
3. Is `actionInfo` echoed back on `GET /appointments`? If yes, with the same shape?

**Why this matters:** the booking dialog needs to know whether to show a "Video call?" toggle, a location text input, etc. The list view needs to know whether to render meeting links.

---

## 9. ⚠ clarification — Slot conflicts (409 or 502?)

**Doc reference:** lines 311–318 (general error table).

> Quoting:
> > | `400` | Invalid query/body (Zod), invalid `nutrNo`, appointment validation |
> > | `502` | Trainerize Partner API error |

**Questions:**
1. If a client tries to book a slot already taken by another client (or already on the trainer's calendar), what status code is returned — `400` ("appointment validation"), `409 Conflict`, or `502` (Trainerize returns its own error)?
2. Is the error envelope `message` text user-facing enough to render verbatim, or do we need to map known codes to friendly copy?
3. Is there a `GET /me/appointment-types/availability?appointmentTypeId=...&date=...` style endpoint to *pre-check* slots before opening the booking dialog?

**Why this matters:** without server-side slot validation we'd need a separate availability call; without consistent error codes we can't differentiate "slot taken" from "trainer not bookable" from "server down".

---

## 10. ⚠ clarification — Pagination and max range on `GET /appointments`

**Doc reference:** lines 240–245.

**Questions:**
1. Are `startDate` / `endDate` required on `GET /me/appointments`, or optional with a server default range?
2. Maximum range the server permits (90 days? unbounded)?
3. Pagination — does the response include `total`, `start`, `count`? If not, is the full window always returned?

**Why this matters:** the appointments page needs a sensible default window. Without a max range, a "show all" view might 502 silently.

---

## 11. ⚠ clarification — Unassigned-trainer state

**Doc reference:** lines 273–276.

> Quoting:
> > `userId` | `number` | Yes | **Trainer's** Trainerize ID — use `trainerID` from `GET /me/settings`

**Questions:**
1. What does `/me/settings.trainerID` return when a client is **unassigned** — `null`, `0`, missing field?
2. Should the FE pre-check this and hide the "Book" button until a trainer is assigned?
3. Or does the backend route surface a friendly error envelope (e.g. `404 — No trainer assigned`)?

**Why this matters:** showing a Book button that always 400s on click is a bad first impression for newly-onboarded clients.

---

## 12. ⚠ clarification — `appointment-types` scope (per-trainer vs studio-wide)

**Doc reference:** line 243.

> Quoting:
> > `GET` | `/trainerize/me/appointment-types` | List bookable types

**Questions:**
1. Is the returned list scoped to *the client's assigned trainer*, or to the *whole studio*?
2. If studio-wide, does each `appointment-type` row include the `trainerID` that offers it, so the FE can filter to bookable-by-this-client types?
3. Are there inactive / disabled types in the response we need to filter out client-side, or is the list pre-filtered?

**Why this matters:** showing the client unbookable types (other trainers' offerings) leads to confusing `400 — trainerID mismatch` errors at booking time.

---

## 13. ℹ informational — Doc lists `POST /appointments` response as `{id: number}`

**Doc reference:** line 288.

> Quoting:
> > **Response `data`:** `{ id: number }` — new appointment ID.

For non-recurring this is fine. For recurring (§4), one ID is presumably the *first* occurrence and the rest exist but aren't returned.

**Question:** is there a `GET /me/appointments?recurrenceParentId=` style filter to fetch the full series after booking, or do we have to re-query the date range and reconcile?

Answer drives whether the post-booking confirmation screen shows "1 appointment booked" or "4 appointments in this series, here they are".

---

## Summary table

| # | Topic | Severity | Blocks |
|---|---|---|---|
| 1 | `userId` headline rule conflict | 🚧 blocking | Booking entire path |
| 2 | GET response shapes | 🚧 blocking | List page rendering |
| 3 | Cancel / reschedule | 🚧 blocking | Appointment management UI |
| 4 | Recurrence semantics | 🚧 blocking | Recurring booking feature |
| 5 | Timezone format | ⚠ clarification | Date display correctness |
| 6 | `attendents` typo | ⚠ clarification | Wire-format lock-in |
| 7 | Multi-attendee group sessions | ⚠ clarification | Attendee input visibility |
| 8 | `actionInfo` extra fields | ⚠ clarification | Booking dialog field set |
| 9 | Slot-conflict status code | ⚠ clarification | Error UX |
| 10 | List pagination / max range | ⚠ clarification | Default window |
| 11 | Unassigned-trainer state | ⚠ clarification | Book button visibility |
| 12 | `appointment-types` scope | ⚠ clarification | Type list filtering |
| 13 | Recurring response shape | ℹ info | Post-booking confirmation |

---

## What FE will ship without waiting

Against the current doc as written, the FE can build:

- **Appointments list page** — `GET /me/appointments` with a 90-day default window. Defensive parsing for unknown response fields; missing fields render as "—".
- **Appointment types list** — `GET /me/appointment-types`. Display whatever fields are present without filtering by trainer (until §12 is answered).
- **Single, non-recurring booking dialog** — `POST /appointments` with:
  - `userId` ← `/me/settings.trainerID` (with a fallback empty-state per §11)
  - `attendents: [{userId: /me/link.trainerizeUserId}]`
  - `appointmentTypeId` ← from the types list
  - `startDate` / `endDate` in `YYYY-MM-DDTHH:MM:SSZ` (assuming UTC per line 277)
  - `notes` text input
  - `actionInfo.isVideoCall` boolean toggle

Held until clarified:

- **Recurring bookings** (held on §4)
- **Cancel / reschedule** (held on §3)
- **Multi-attendee bookings** (held on §7)
- **Per-trainer type filtering** (held on §12)
- **Pre-flight slot availability** (held on §9)

If the answer to §3 is "use the Trainerize app", FE will surface that explicitly on each appointment row rather than ship a button that opens an empty modal.
