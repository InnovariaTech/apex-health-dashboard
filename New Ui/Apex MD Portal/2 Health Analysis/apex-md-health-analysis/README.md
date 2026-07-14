# Apex MD — Health Analysis Page

A self-contained, build-free patient "Health Analysis" page for the Apex MD portal, plus
a built-in, print-ready PDF report. No framework, no bundler, no build step — plain
HTML / CSS / JS that runs by opening a file or serving the folder.

---

## Project structure

```
apex-md-health-analysis/
├── health-analysis.html       # Page markup (links to css/ and js/)
├── css/
│   └── styles.css             # All page + PDF-report styles (incl. @media print)
├── js/
│   └── report.js              # Interactions + the PDF report builder (buildReport)
├── assets/
│   └── img/                   # Logos, doctor photo, product/peptide photos, body figure
│       ├── apex-md-logo.jpg
│       ├── apex-md-logo-report.png      # logo used in the PDF report header
│       ├── apex-fit-logo.jpg
│       ├── nav-genetics-dna.png
│       ├── bio-figure-body.jpg
│       ├── doctor-consultation.jpg
│       ├── product-red-superfood.jpg
│       ├── product-probiotic.jpg
│       ├── product-vitamin-k2-d3.jpg
│       └── product-wolverine.jpg
├── tools/
│   └── generate-pdf.js        # Optional: generate the PDF headlessly (Playwright)
└── README.md
```

---

## Running the page

Because everything is static, you can either:

- **Open directly** — double-click `health-analysis.html`, or
- **Serve the folder** (recommended, avoids any `file://` quirks):
  ```bash
  # any static server works
  npx serve .
  # or
  python3 -m http.server 8000
  ```
  then visit `http://localhost:8000/health-analysis.html`.

All asset paths are **relative**, so the folder can live anywhere or be dropped into an
existing site under its own route.

---

## How the PDF export works

The page ships its own export flow — no server needed:

1. The user clicks **Export as PDF** (top-right of the page).
2. `report.js → openPdfModal()` runs `buildReport()`, which assembles a 5-page,
   letter-formatted report into `#pdfReport` and opens a preview modal.
3. The user clicks **Save as PDF**, which calls `window.print()`.
4. A `@media print` block in `styles.css` isolates the report (`#exportPdfModal`),
   hides the app UI, and an `@page { size: letter; margin: 0 }` rule produces clean
   letter pages. The user chooses "Save as PDF" as the print destination.

The report content (patient header, scores, biomarkers, clinical narrative,
recommendations, concierge) is defined in `buildReport()` in `js/report.js`. The product
and doctor images in the report are read from the page DOM, so they stay in sync with the
page automatically.

### Optional: generate the PDF headlessly

For automated / server-side generation, `tools/generate-pdf.js` drives a headless
Chromium and writes `Apex-MD-Health-Analysis-Report.pdf` to the project root:

```bash
npm i playwright
npx playwright install chromium
node tools/generate-pdf.js
```

It loads the page, calls `buildReport()`, emulates print media, and calls Chromium's
`page.pdf({ preferCSSPageSize: true, printBackground: true, margin: 0 })` — the same
output the in-page button produces. (Puppeteer works too with near-identical code.)

---

## Fonts & icons

The page loads three things from CDNs (works out of the box with internet access):

- **Inter** and **JetBrains Mono** — Google Fonts
- **Tabler Icons** (webfont) — jsDelivr

To self-host (offline / locked-down environments), download those packages
(`@fontsource/inter`, `@fontsource/jetbrains-mono`, `@tabler/icons-webfont`), drop the
`woff2` files under `assets/fonts/`, add matching `@font-face` rules, and swap the three
CDN `<link>` tags in `health-analysis.html` for local stylesheet links. Nothing else
changes.

> Note: the **visible page** uses **Inter** throughout (including numbers). The **PDF
> report** intentionally uses **JetBrains Mono** for figures/labels to give the document a
> clinical look. Both are loaded by default.

---

## Design tokens

Defined as CSS custom properties in `:root` at the top of `css/styles.css`.

| Token | Value | Use |
|---|---|---|
| `--accent` | `#D30603` | Brand red — headings, accents, primary CTA |
| `--accent-dark` | `#A60402` | Section headers, titles |
| Optimal green | `#2E7D5A` | "Optimal" status, score donut |
| Borderline amber | `#B8761C` | "Borderline" / watch status |
| CTA blue | `#2563EB` | Secondary CTAs |
| `--font-sans` / `--font-serif` | Inter | Body + headings |
| `--font-mono` | Inter (page) · JetBrains Mono (PDF) | Figures / labels |
| Sidebar width | `280px` | Left nav |

Status colors also exist as soft background pairs (`--opt-soft`, `--bord-soft`,
`--att-soft`) for pills and rows.

---

## Notes

- Demo data (patient "Randall Chen", sample biomarkers, etc.) is hard-coded in the markup
  and in `buildReport()`. Wire these to real data by templating the HTML server-side or
  hydrating the relevant nodes/`buildReport()` inputs.
- A single-file version of this page (all CSS, JS, and images inlined as base64) is also
  available if you ever need a one-file drop-in.
