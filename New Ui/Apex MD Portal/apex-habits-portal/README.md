# Apex MD — Habits Page

Self-contained front-end for the **Habits** screen of the Apex MD / Apex Fit patient portal.
Polished demo build matching the Wearables design system: icon-badge header, bold-black /
italic-red title, per-habit accent cards, streak metrics, and gradient progress.

Demo patient: **Robert Carlsen** (MRN 04821, Concierge).

---

## Quick start

**Just want to view it?** Open the single-file build — no server, no install:

```
dist/habits.html
```

**Working on the source?** Serve the modular tree (recommended — avoids file:// CORS on
fonts/JSON):

```bash
cd tools
npm install            # only needed for render-check (Playwright)
node serve.mjs         # -> http://localhost:5173
```

Then rebuild the single-file bundle after any change:

```bash
node tools/build.mjs   # regenerates dist/habits.html (CSS + JS + fonts + images inlined)
```

Visual QA screenshot (full page, 2x):

```bash
node tools/render-check.mjs            # renders index.html  -> render.png
node tools/render-check.mjs dist/habits.html   # render the bundle instead
```

---

## Project structure

```
apex-habits-portal/
├── index.html              # modular entry — links css/js/fonts, references logos
├── css/
│   └── styles.css          # all component + layout styles (design tokens at top :root)
├── js/                     # LOAD ORDER MATTERS: icons → data → render → app
│   ├── icons.js            # inline SVG icon registry + icon(name)
│   ├── data.js             # nav, theme palette, check-ins, habit series (runtime data)
│   ├── render.js           # pure view layer (renderNav / renderCheckins / renderYours)
│   └── app.js              # bootstrap (initHabits) + interactions (toggleDone)
├── data/
│   └── habits.json         # canonical data contract (mirrors js/data.js)
├── assets/
│   ├── fonts/              # vendored Inter + JetBrains Mono (latin woff2) + fonts.css
│   └── img/                # brand logos + favicon (see Brand assets)
├── tools/
│   ├── build.mjs           # inline everything -> dist/habits.html
│   ├── serve.mjs           # zero-dep static dev server
│   ├── render-check.mjs    # Playwright screenshot
│   └── package.json
└── dist/
    └── habits.html         # single-file, fully self-contained build (share/deploy this)
```

---

## Editing content

All page content is data-driven. Edit the arrays in **`js/data.js`** (the runtime source) —
the renderers consume them, so no markup changes are needed to add/remove habits:

- `CHECKINS` — the "Today's check-ins" cards
- `YOURS`    — the "Your habits" series cards
- `THEME`    — per-habit accent colors (`blue` / `slate` / `purple` / `red`)
- `NAV_MD` / `NAV_FIT` — sidebar items (`['Label','iconName', active?]`)

`data/habits.json` is the human-readable contract for the same data; keep it in sync with
`js/data.js` (or treat the JSON as the source of truth and generate the JS from it in your
own pipeline). Icon names map to keys in `js/icons.js`.

Each habit's accent stripe, icon badge, streak color, and progress-bar gradient are all
derived from its `theme`. To recolor a habit, change its `theme`; to add a new palette,
add an entry to `THEME` (and the matching one in `habits.json`).

---

## Design tokens

Defined in `css/styles.css` under `:root`:

| Token            | Value      | Use                                  |
|------------------|------------|--------------------------------------|
| `--accent`       | `#D30603`  | Brand red (title, primary actions)   |
| `--accent-dark`  | `#A60402`  | Red hover/depth                      |
| `--purple`       | `#7C3AED`  | Yogurt habit accent                  |
| `--blue`         | `#2563EB`  | Water habit accent                   |
| `--slate`        | `#475569`  | Milk habit accent                    |
| `--good`         | `#3E7C57`  | Positive / completed state           |
| `--app-bg`       | `#FFFFFF`  | Page background                      |
| `--ink`          | `#0B0B0C`  | Primary text                         |

Typography: **Inter** (400/500/600/700/800 + italics) for UI, **JetBrains Mono** for
eyebrows, labels, IDs, and dates. Title pattern = bold black word + bold *italic* red word,
−1.8px tracking. Active nav = black pill, 100px radius.

---

## Brand assets

`assets/img/` ships processed, ready-to-use logos plus the source variants:

| File                        | Use                                                        |
|-----------------------------|------------------------------------------------------------|
| `apex-md-logo.png`          | Apex MD wordmark (dark text + red mark, transparent)       |
| `apex-fit-logo.png`         | Apex Fit wordmark, **recolored dark** for the white sidebar|
| `apex-fit-logo-white.png`   | Apex Fit wordmark in original white — for dark backgrounds  |
| `apex-fit-logo-onblack.png` | Original Apex Fit lockup on its black field (reference)    |
| `favicon.png`               | Apex MD mark, 128×128                                       |

> **Note:** the supplied Apex Fit logo is white-on-black. Since the sidebar is white, the
> in-UI version (`apex-fit-logo.png`) keeps the red triangle and recolors the white "APEX FIT"
> wordmark to near-black so it stays legible. The untouched original is kept as
> `apex-fit-logo-onblack` / `apex-fit-logo-white` for other surfaces.

Logos are referenced via `<img>` in `index.html` and base64-inlined into `dist/habits.html`
by `build.mjs`.

---

## Notes

- The single-file `dist/habits.html` has **no external dependencies** — fonts and images are
  base64-embedded, so it renders identically offline and in screenshots.
- The modular build self-hosts fonts (`assets/fonts/fonts.css`). Swap for the Google Fonts
  CDN at runtime if you prefer smaller repo size.
- `toggleDone()` is demo interactivity (marks a card complete, updates the live "Checked in
  today" counter, bumps the current streak). Wire it to your real check-in endpoint —
  each card carries its `dailyItemId`.
- Quality floor: responsive to mobile (sidebar collapses < 880px), visible focus states,
  `prefers-reduced-motion` respected.
