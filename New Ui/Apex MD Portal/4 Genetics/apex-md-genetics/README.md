# Apex MD — Genetics Page (modular build)

Patient-facing **Genetics** page from the Apex MD portal, refactored from a single
self-contained HTML file into a clean, developer-friendly project: markup, styles,
behavior, and assets are separated, and the 40 MB recommendations report ships as a
real PDF file (referenced by path) instead of a base64 blob.

## Structure

```
apex-md-genetics/
├── index.html                  # markup only (links css/ + js/)
├── css/
│   └── styles.css              # all page styles (design tokens in :root)
├── js/
│   └── script.js               # interactions, marker overlay, PDF export
├── assets/
│   ├── img/
│   │   ├── apex-md-logo.png
│   │   ├── apex-fit-logo.png
│   │   ├── concierge-physician.jpg
│   │   ├── products/           # recommendation bottle shots (4)
│   │   └── supplements/        # small marker-overlay thumbnails (16)
│   └── report/
│       └── Lifestyle-Genetics-Report-Recommendations.pdf   # ~40 MB, 476 pp
├── data/
│   └── recommendations.json    # structured copy of the on-page data layer
├── tools/
│   ├── build-standalone.js     # re-inline everything → dist/genetics.standalone.html
│   ├── render-check.js         # headless screenshot + missing-asset report
│   └── README.md
├── package.json
└── README.md
```

## Run it

It's a static page — serve the folder with anything:

```bash
npm run serve          # -> http://localhost:5173  (uses `npx serve`)
# or: python3 -m http.server 5173
```

Open `index.html` over **http://** (not `file://`) so the relative asset and PDF
paths resolve and the **Export Full Report (PDF)** button downloads correctly.

## Design tokens

Brand styling lives in the `:root` block at the top of `css/styles.css`:

- `--red: #D30603` (Apex brand red), `--accent-dark` headers
- Fonts: **Inter** (body) + **Archivo** (numerics / titles / prices), loaded from Google Fonts in `index.html`
- Title pattern: bold black first word + red heavy-italic second word

## The report PDF

`js/script.js` → `exportSummary()` simply links to
`assets/report/Lifestyle-Genetics-Report-Recommendations.pdf`. Swap that file (keep
the name, or update the path in `exportSummary()` + `data/recommendations.json`) to
ship a new report.

## Single-file build

Need the original all-in-one HTML again? `npm run build-standalone` re-inlines CSS,
JS, every image, and the PDF into `dist/genetics.standalone.html`.

## Notes

- `data/recommendations.json` mirrors the rendered supplements / peptide / concierge
  content so the page can later be driven from data instead of hard-coded markup.
- Buy buttons, "Add to cart", and "Book a consultation" are presentational — wire
  them to your store / scheduler.
- Demo patient data ("Robert Carlsen", "Lifestyle [Demo Library]") is sample content.
