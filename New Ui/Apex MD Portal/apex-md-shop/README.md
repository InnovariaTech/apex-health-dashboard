# Apex MD — Shop Page

Self-contained front-end for the Apex MD patient-portal **Shop** page (clinical programs, supplements, memberships, peptides, lab diagnostics, and personal training). Plain HTML/CSS/JS — no framework, no build step required to run.

## Project structure

```
apex-md-shop/
├── index.html            # Page shell; links the CSS + JS below
├── css/
│   └── styles.css        # All styles
├── data/
│   ├── photos.js         # PHOTO map: product image keys → assets/img/* paths  (load 1st)
│   └── products.js       # Catalog arrays: wl, peptideBlends, trt, hrt, peptides,
│                         #   labdx, supplements, memberships, programs, training  (load 2nd)
├── js/
│   └── app.js            # Icons, SVG helpers, tab config (TABS), accent map (ACC),
│                         #   card() renderer, dropdown toggle, and init  (load 3rd)
├── assets/
│   └── img/              # 72 extracted product/banner images (jpg/png)
├── tools/
│   ├── serve.sh          # Local static server (see "Run")
│   └── build.js          # Re-inline everything into dist/shop.html
└── dist/
    └── shop.html         # Single-file build — everything inlined, zero dependencies
```

## Run (development)

The app loads CSS/JS/images by relative path, so serve it over HTTP (opening `index.html`
directly via `file://` will be blocked by the browser):

```bash
bash tools/serve.sh          # → http://localhost:8080
# or: python3 -m http.server 8080
```

Need a truly standalone file (email it, drop it anywhere)? Use `dist/shop.html` — it has
the CSS, JS, and all images inlined, so it works from `file://` with no server.

## Build (regenerate the single-file version)

After editing anything in `css/`, `data/`, `js/`, or `assets/img/`, rebuild the standalone:

```bash
node tools/build.js          # writes dist/shop.html
```

## How it renders

`index.html` contains the static shell (sidebar, header). On load, `js/app.js` reads the
`TABS` config, walks each section's `products` array, and renders cards with `card(product)`.
Load order matters and is enforced by the script tags in `index.html`:
`photos.js` → `products.js` → `app.js`.

### Data model (`data/products.js`)

Each product is a plain object. Common fields:

| field | purpose |
|-------|---------|
| `name` | title |
| `desc` | description line |
| `img` | image, e.g. `PHOTO.pepBpc.src` (from photos.js) |
| `tile` | tile background, e.g. `PHOTO.pepBpc.bg` |
| `fit` | image fit: `'cover'`, `'contain'`, `'poster'`, `'fill'` |
| `price` / `per` | footer price + suffix (e.g. `'$199'` / `'/month'`) |
| `topPrice` | price shown next to the title instead of the footer |
| `topNote` | small grey note under the title |
| `badge` | `{text, color}` pill (colors in `ACC`) |
| `cta` | if set, footer becomes a red button with this label (e.g. `'Purchase'`) |
| `clickable` | `true` makes the whole tile a link (used by Lab Diagnostics) |
| `features` | array → collapsible "See Details" list (Concierge cards) |
| `type` | `'intro'` renders the HRT "Don't know what you want?" card |

### Sections & accent colors (`data/products.js` `TABS`, `js/app.js` `ACC`)

Each section has an `accent` key mapped to a color in `ACC` (`js/app.js`). It tints the
section's top bar and badge. Current medical-tab accents: Weight Loss `red`,
Peptide Blends `grey`, TRT `black`, HRT `pink`, Peptides `grey`, Lab Diagnostics `red`.

## Adding / replacing a product image

1. Drop the file in `assets/img/` (e.g. `assets/img/myPeptide.jpg`).
2. Add a key in `data/photos.js`: `myPeptide:{src:'assets/img/myPeptide.jpg',bg:'#ffffff'}`.
3. Reference it from a product in `data/products.js`: `img:PHOTO.myPeptide.src, tile:PHOTO.myPeptide.bg`.
4. `node tools/build.js` to refresh `dist/shop.html`.

## Notes

- **Fonts:** `index.html` pulls Inter + JetBrains Mono from Google Fonts. With no internet
  the page falls back to system fonts (layout is unaffected). Self-host the fonts if you
  need offline/air-gapped rendering.
- Several prices and descriptions in `products.js` are placeholders pending final copy.
- No analytics, tracking, or third-party runtime scripts.
