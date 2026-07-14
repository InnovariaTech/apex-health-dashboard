# Apex Progress

The **Progress** page for the Apex MD / Apex Fit member portal — a 6‑month
transformation view with KPIs, a weight & body‑fat trend chart, blood‑biomarker
summary, progress photos, a before/after slider, personal records, and
milestones.

It's a small, dependency‑free web app: a static HTML shell, one stylesheet, one
data file, and one render script. All dynamic content is driven from
`data/progress.js`, so updating the page is just editing data.

---

## Structure

```
apex-progress/
├── index.html              # static shell + data-driven containers
├── css/
│   └── styles.css          # all styles + @font-face (vendored Inter)
├── data/
│   ├── progress.js         # content data as window.APEX_PROGRESS (loaded by the page)
│   └── progress.json       # same data as pure JSON (for tooling / reference)
├── js/
│   └── app.js              # renders every section from the data, wires tabs + slider
├── assets/
│   ├── img/                # apex-md-logo, apex-fit-logo, month-1…6.jpg
│   └── fonts/              # inter-400…800.woff2 (+ jetbrains-* for the PDF report)
├── dist/
│   ├── progress.html       # self-contained single-file build (open directly)
│   └── Apex-Progress-Report.pdf   # print-formatted member report
├── tools/
│   ├── build.js            # inline everything → dist/progress.html
│   └── generate-pdf.js     # export the page to PDF via Playwright
└── README.md
```

---

## Run it

The page loads its data from `data/progress.js` via a regular `<script>` tag, so
it works straight from the filesystem — **just open `index.html`** (or
`dist/progress.html`) in a browser.

For a dev server with live reload, any static server works:

```bash
npx serve .          # then open http://localhost:3000
# or
python3 -m http.server
```

---

## Edit the content

Everything visible is data. Open **`data/progress.js`** and edit the values —
the page re-renders on reload. Keep `data/progress.json` in sync if your tooling
reads the JSON (it mirrors the same object).

### Data schema (`window.APEX_PROGRESS`)

| Key          | Shape | Notes |
|--------------|-------|-------|
| `member`     | `{ name, id, plan, period, checkIn }` | header / report identity |
| `kpis[]`     | `{ tone, dot, label, value, unit, sub, badge?{dir,text}, link? }` | 4 hero tiles. `tone` ∈ `green\|blue\|purple\|amber`. A `link` makes it a clickable tile (arrow); otherwise `badge` shows a chevron + delta. |
| `biomarkers` | `{ link, sub, stats[], markers[] }` | `stats:{label,value,unit,note}`, `markers:{name,cat,value,unit,dir,delta}` (`dir` ∈ `up\|down`) |
| `trend`      | `{ points[], goalWeight, weightScale[min,max], bodyFatScale[min,max] }` | `points:{label,weight,bodyFat}`. The chart maps these onto the fixed axes. |
| `snapshot`   | `{ meta, rows[], goal }` | `rows:{icon,tint,color,label,value,delta,dir,link?}`, `goal:{label,pct,note}` |
| `photos[]`   | `{ src, alt }` | grid images (captions are baked into the photos) |
| `compare`    | `{ before{src,tag,alt}, after{src,tag,alt}, stats[] }` | before/after slider |
| `prs[]`      | `{ icon, name, was, value, delta }` | `icon` ∈ `barbell\|ladder\|clock` |
| `milestones[]` | `{ done, name, desc, status }` | `done:true` → check, else clock |
| `narrative`  | `{ label, heading, status, generatedBy, paragraphs[] }` | summary block; paragraphs may contain inline `<b>` / `<span class="accent">` |

Icons are Tabler paths mapped by name inside `js/app.js` (`ICON`). The trend
chart's axis ticks and goal label live in `index.html`; `app.js` computes the
line points and dots from `trend` and positions the goal line.

---

## Build the single-file version

```bash
node tools/build.js
```

Inlines the HTML, CSS, fonts, images, data, and script into one
self‑contained file at **`dist/progress.html`** — no external requests, opens
straight from disk, easy to email or drop on any host.

---

## Generate a PDF

A polished, print‑formatted member report ships at
**`dist/Apex-Progress-Report.pdf`**.

To regenerate a quick PDF export of the live page:

```bash
npm i -D playwright
node tools/build.js          # refresh dist/progress.html
node tools/generate-pdf.js   # → dist/apex-progress.pdf
```

---

## Design tokens

Defined in `:root` at the top of `css/styles.css`.

| Token | Value | Use |
|-------|-------|-----|
| `--accent` / `--accent-dark` | `#D30603` / `#A60402` | Apex brand red |
| `--purple` / `--purple-bg` | `#7C3AED` / `#F1ECFD` | biomarker‑improvement accent |
| `--good` / `--good-bg` | `#3E7C57` / `#EAF3EE` | positive deltas |
| `--warn` / `--warn-bg` | `#B07A24` / … | caution / VO₂ tile |

Typography is **Inter** (vendored in `assets/fonts/`); the sidebar uses dual
Apex MD + Apex Fit branding. The page is self‑contained and has no runtime
dependencies.
