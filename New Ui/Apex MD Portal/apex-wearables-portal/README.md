# Apex MD — My Wearables

The **Wearables** page of the Apex MD patient portal. Synced metrics
(Steps, Resting heart rate, Blood pressure, Sleep) rendered as
dependency-free SVG charts. This package ships the **modular source**
for editing plus a **single-file build** for drop-in use.

---

## Quick start

**Just look at it:** open `index.html` in a browser (double-click).
It runs with no build step and no server — fonts load from Google
Fonts at runtime; everything else is local.

**Single-file version:** `dist/wearables.html` is fully self-contained
(CSS, JS and logos inlined). Hand this to anyone or embed it directly.

---

## Project structure

```
apex-wearables-portal/
├─ index.html              # page markup; links css/ + js/ + assets/
├─ css/
│  └─ styles.css           # all styling + brand design tokens (:root)
├─ js/
│  ├─ data.js              # ← edit metric numbers / colors here
│  ├─ charts.js            # SVG chart engine (no libraries)
│  └─ app.js               # bootstraps charts on DOM ready
├─ data/
│  └─ wearables.json       # JSON mirror of the data (CMS / back-end ref)
├─ assets/img/
│  ├─ apex-md-logo.png     # sidebar Apex MD lockup (transparent)
│  └─ apex-fit-logo.png    # sidebar Apex Fit lockup (transparent)
├─ tools/
│  ├─ build.js             # inline everything -> dist/wearables.html
│  ├─ serve.py             # local static server for preview
│  └─ render-check.js      # Playwright screenshot -> tools/preview.png
├─ dist/
│  └─ wearables.html       # generated single-file build
└─ package.json
```

Script load order matters and is fixed in `index.html`:
**`data.js → charts.js → app.js`**.

---

## Editing content

All four metrics live in **`js/data.js`** under `APEX_WEARABLES.metrics`.
Change the arrays and the charts redraw — no render code to touch.

- `steps.values` / `steps.goal` — bar heights + dashed goal line
- `rhr.values` / `rhr.scale` — line series + y-axis min/max
- `bp.systolic` / `bp.diastolic` / `bp.band` — two lines + normal band
- `sleep.nights` — each night is `[deep, core, rem, awake]` hours

`days` is the shared x-axis; keep its length equal to each series.
`data/wearables.json` is a parallel copy for a back-end/CMS — if you
wire the page to a live feed, point it at this shape.

> Note: the page reads data from `data.js` (a plain JS object) so it
> works from `file://` with no server. If you prefer `fetch()`-ing
> `data/wearables.json`, run it behind `tools/serve.py` (browsers block
> local `fetch` over `file://`).

## Brand tokens

Colours, spacing and the sidebar width are CSS variables at the top of
`css/styles.css` (`:root`). The brand red is `--accent: #D30603`.
Per-metric chart hues are set on the `.card.m-*` classes **and** mirrored
in `js/data.js` (chart strokes/fills) — change both to recolour a card.

## Swapping logos

Replace the PNGs in `assets/img/` (keep the filenames, transparent
background recommended). They're sized via `.brand-logo` / `.fit-logo`
in `css/styles.css`.

---

## Build & verify

```bash
node tools/build.js          # -> dist/wearables.html (self-contained)

# optional preview / QA
python3 tools/serve.py       # http://localhost:8000/index.html
npm i -D playwright && npx playwright install chromium
node tools/render-check.js          # screenshots modular index.html
node tools/render-check.js --dist   # screenshots the built file
```

(or `npm run build`, `npm run serve`, `npm run render-check`)

---

## Notes

- No runtime dependencies; charts are hand-built SVG.
- Self-contained delivered files — no external CDN except Google Fonts
  (Inter + JetBrains Mono) loaded at runtime.
- Demo patient: Robert Carlsen (MRN 04821), 7-day window.
