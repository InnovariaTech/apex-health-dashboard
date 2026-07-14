# APEX Fit — Trainer Messages

A self-contained patient/member messaging page for the **APEX MD / APEX Fit** portal.
It shows the member's identity chip, an inbox of conversations, and a threaded chat with
their trainer (Colton Reyes), all rendered in the established APEX design system
(Inter + JetBrains Mono, brand red `#D30603`, Tabler icons, dual APEX MD / APEX Fit branding).

The page is **data-driven**: layout lives in HTML/CSS, and the conversation, inbox and
member profile come from JSON in `/data`. A build step bundles that JSON into a
browser-loadable script so the page works when opened directly (no server needed).

---

## Project structure

```
apex-trainer-messages/
├── index.html               Entry point — open this in a browser
├── README.md
├── assets/
│   └── img/
│       ├── apex-md-logo.png      APEX MD lockup (transparent)
│       ├── apex-fit-logo.png     APEX FIT lockup (transparent)
│       ├── robert-carlsen.png    Member headshot (identity chip)
│       └── colton-reyes.png      Trainer headshot (conversation)
├── css/
│   └── styles.css           All styling (design tokens at :root)
├── js/
│   ├── app.js               Renders chip/inbox/thread from APEX_DATA; composer logic
│   └── data.js              AUTO-GENERATED bundle (window.APEX_DATA) — do not hand-edit
├── data/                    ← source of truth, edit these
│   ├── profile.json         Member: name, MRN, plan, age, avatar
│   ├── inbox.json           Inbox conversation list
│   └── conversation.json    Trainer thread: header + timeline of messages
├── tools/
│   ├── build-data.js        data/*.json  →  js/data.js
│   ├── build-inline.js      whole project →  dist/trainer-messages.html (one file)
│   └── render-check.js      Playwright screenshot → tools/output/preview.png
└── dist/
    └── trainer-messages.html   Single self-contained build (generated)
```

---

## Quick start

No build is required to view it — just open `index.html` in any modern browser.
`js/data.js` is already generated and committed.

### Edit the conversation or inbox

1. Edit the JSON in `/data` (see the data model below).
2. Regenerate the browser bundle:
   ```bash
   node tools/build-data.js
   ```
3. Refresh `index.html`.

> **Why the build step?** Browsers block `fetch()` of local files over `file://`,
> so the page can't read `/data/*.json` directly when opened from disk.
> `build-data.js` inlines that JSON into `js/data.js`, which loads via a normal
> `<script>` tag. Edit the JSON, not `data.js`.

### Ship a single file

To produce one fully self-contained HTML file (CSS, JS and all images inlined as
base64 — matching the other portal pages):

```bash
node tools/build-data.js     # ensure data.js is current
node tools/build-inline.js   # writes dist/trainer-messages.html
```

### Visual check (optional)

```bash
npm install playwright
node tools/render-check.js   # writes tools/output/preview.png
```

---

## Data model

### `data/profile.json`
```json
{ "name": "Robert Carlsen", "mrn": "04821", "plan": "Concierge",
  "age": 40, "initials": "R", "avatar": "assets/img/robert-carlsen.png" }
```
Renders the top-bar identity chip as `MRN <mrn> · <plan> · <age> yrs`.

### `data/inbox.json` — array of conversation rows
```json
{ "id": "colton", "name": "Colton Reyes", "tag": "Trainer",
  "time": "5:15 PM", "preview": "…", "active": true, "unread": false }
```
`tag` and `unread` are optional. `active: true` highlights the row (red rail).

### `data/conversation.json`
```json
{
  "trainer": { "name": "Colton Reyes", "status": "Online · Strength & Conditioning",
               "initials": "C", "avatar": "assets/img/colton-reyes.png" },
  "showing": "1–14",
  "timeline": [
    { "day": "Mon, Jun 15" },
    { "from": "trainer", "time": "8:42 AM", "text": "…" },
    { "from": "you",     "time": "8:55 AM", "text": "…" }
  ]
}
```
`timeline` is an ordered list. An item with a `day` key renders a date separator;
otherwise it's a message. `from: "trainer"` → left, light-grey bubble with the
trainer's photo. `from: "you"` → right, dark-grey bubble with the member's initials.

---

## Design system (canonical)

- **Colors:** `--accent / --red` `#D30603`, `--accent-dark / --red-dark` `#A60402`,
  outgoing bubble `--bubble-out` `#3a3d44` (dark grey), trainer bubble `#eceef0`.
- **Type:** Inter (UI + headlines, weight 800 for the title), JetBrains Mono (IDs, times).
- **Headline pattern:** bold black word + bold-italic red word, tight `-1.8px` tracking
  (e.g. "Trainer *messages*").
- **Sidebar:** 280px, Tabler icons (inlined SVG), black pill for the active item,
  APEX MD + APEX FIT dual-brand sections split by a divider.
- All design tokens are CSS variables at the top of `css/styles.css`.

---

## Notes

- Fonts load from Google Fonts via a `<link>`; everything else is local/inlined.
- The composer is client-side only (appends to the thread); wire `sendBtn` to your
  API to persist messages.
- Images are pre-trimmed PNGs with transparent backgrounds.
