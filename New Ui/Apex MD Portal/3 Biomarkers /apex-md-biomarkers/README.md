# Apex MD — Biomarkers Page

The Biomarkers page of the Apex MD patient portal: an interactive biomarker
dashboard (tiles, category filters, compare mode, per-marker drill-down) plus a
built-in **clinical PDF report** export.

This package is the modular, developer-ready version of the single-file
`biomarkers.html` — split into HTML / CSS / JS / assets with vendored fonts and a
PDF-export tool.

---

## Project structure

```
apex-md-biomarkers/
├── index.html                  # Page markup (was the <body> of biomarkers.html)
├── css/
│   ├── styles.css              # All component styles (extracted <style>)
│   └── fonts.css               # @font-face for Inter + JetBrains Mono (local)
├── js/
│   └── biomarkers.js           # Data model + rendering + drill-down + report builder
├── assets/
│   ├── img/
│   │   ├── apex-md-logo.jpg    # Brand mark (sidebar + report header)
│   │   ├── apex-fit-logo.jpg   # Apex Fit sub-brand mark
│   │   └── genetics-icon.png   # DNA glyph for the Genetics nav item
│   └── fonts/
│       ├── inter-latin-*.woff2          # Inter 400/500/600/700 + italics
│       ├── jetbrains-mono-latin-*.woff2 # JetBrains Mono 400/500
│       └── tabler/                      # Tabler icon webfont + its CSS
├── tools/
│   └── generate-pdf.js         # Headless-Chromium export of the clinical report
├── package.json
└── README.md
```

Everything is **vanilla HTML/CSS/JS** — no build step, no framework. The page
runs straight from `index.html`.

---

## Running locally

The page uses `fetch`-free vanilla JS but loads CSS/JS/images by relative path,
so serve it over HTTP (don't open via `file://`, or some browsers block the
local font/asset loads):

```bash
npm install        # installs Playwright + serve (for the PDF tool / dev server)
npm run dev        # serves at http://localhost:5173
```

Any static server works (`python3 -m http.server`, `serve`, nginx, Netlify, etc.).

---

## Generating the PDF report

The page builds its own report (patient header, summary KPIs, featured marker
with trend chart, full panel table, patterns & insights, disclaimer). In-app,
the **Export PDF** button opens a preview, then `window.print()` isolates the
report via the `@media print` rules.

For automated/server-side export use the bundled tool:

```bash
npm run pdf                         # -> dist/biomarker-report.pdf
# or
node tools/generate-pdf.js [in.html] [out.pdf]
```

It drives the page's own `openPdfModal()` so the PDF stays in lockstep with the
on-screen report. Output is **US-Letter, 2 pages, zero-margin, backgrounds on**.
Fonts/icons are local, so it renders deterministically with no network.

---

## Design system (canonical)

| Token        | Value                                   | Use                                  |
|--------------|-----------------------------------------|--------------------------------------|
| `--accent`   | `#D30603` (brand red)                   | Section labels, status, emphasis     |
| `--accent-dark` | `#A60402`                            | Dark red headers                     |
| Headline     | bold black word + **bold italic red** word, Inter 800, ~−1.8px tracking | e.g. "Biomarker *panel*" |
| Body / UI    | **Inter** (`--font-sans` / `--font-serif`) | Everything on screen              |
| Mono / data  | **JetBrains Mono** (`--font-mono`)      | Values, ranges, report clinical type |
| Tile CTA     | `#2563EB` (blue) "Click here to learn more →" | Per-marker drill-down affordance |
| Icons        | Tabler icons, 19px, stroke 1.8          | Nav + UI                             |

Surfaces are white, card-based, soft shadows. Sidebar is 280px with pill-shaped
active nav and dual APEX MD / APEX FIT sections.

> **Note:** `--font-serif` is intentionally aliased to Inter — the portal uses
> Inter everywhere on visible pages; JetBrains Mono is reserved for data/clinical
> styling.

---

## Data model

All biomarker data lives in the `biomarkers` array near the top of
`js/biomarkers.js`. Each entry:

```js
{
  id: 'ldl',
  name: 'LDL-C',
  cat: 'Lipids',              // category -> drives the filter pills
  value: 108, unit: 'mg/dL',
  range: [70, 100],           // optimal range
  axis: [40, 200],            // gauge min/max
  status: 'borderline',       // 'optimal' | 'borderline' | 'attention'
  delta: -10,                 // change vs prior quarter
  history: [ ... ],           // sparkline / trajectory points
  // + drill-down copy: whatItMeasures, whatMovesIt, plan, related
}
```

Add or edit markers there; the dashboard tiles, filters, drill-down, and the
report table/summary all render from this single source.

Patient/report metadata (member ID, report ID, lab, provider, date) is set in
the report-builder section of the same file.

---

## Known follow-ups

- **Summary vs. table count:** the report summary KPI references 27 markers while
  the panel table lists 12 — reconcile against the real panel before clinical use.
- The page ships demo data for a fictional patient (Alex Chen / APX-7834-AC).
  Wire `biomarkers` + the patient metadata to live data for production.
