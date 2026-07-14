# Apex MD — Lab Kits page

A self-contained patient-portal page listing the six Apex MD at-home lab kits.
Built data-first: content lives in `data/*.json`, the page is rendered by a small
vanilla-JS renderer (`js/app.js`), and a build step inlines everything into one
portable HTML file in `dist/`.

No framework, no bundler, no runtime dependencies except Google Fonts
(Inter + JetBrains Mono), loaded from the network.

## Structure

```
apex-lab-kits/
├── index.html            # modular shell: loads css + data.js + app.js
├── css/
│   └── styles.css        # all styles + design tokens (:root vars)
├── data/                 # SOURCE OF TRUTH — edit these
│   ├── nav.json          # sidebar groups + items (icon keys, active flag)
│   ├── page.json         # title, subtitle, breadcrumb, search placeholder
│   ├── member.json       # member chip (name, initials, meta)
│   ├── kits.json         # the six lab kits, in display order
│   └── icons.json        # Tabler outline icon name -> inner SVG markup
├── js/
│   ├── data.js           # AUTO-GENERATED from data/*.json (window.APEX_DATA)
│   └── app.js            # renderer: builds sidebar, topbar, header, kit grid
├── tools/
│   ├── build-data.js     # data/*.json  ->  js/data.js
│   ├── build-inline.js   # everything    ->  dist/lab-kits.html (single file)
│   └── render-check.js   # Playwright full-page screenshot
├── assets/img/           # logos (png, transparent) + 6 kit hero images (jpg)
└── dist/
    └── lab-kits.html     # PORTABLE single-file build (open directly)
```

## Build

```bash
node tools/build-data.js      # regenerate js/data.js after editing any data/*.json
node tools/build-inline.js    # regenerate dist/lab-kits.html
```

`build-inline.js` base64-encodes every image in `assets/img/` and exposes them as
`window.APEX_ASSETS`; `app.js` prefers those when present, otherwise falls back to
the `assets/img/<file>` path. So the same `app.js` works both modular and inlined.

Open `index.html` directly (file://) for the modular version, or `dist/lab-kits.html`
for the portable single file — both render identically.

## Render check

```bash
node tools/render-check.js               # screenshots dist/lab-kits.html
node tools/render-check.js index.html    # screenshots the modular build
```
Set `PW_CHROME` if your Chromium lives elsewhere. If `@fontsource/inter` and
`@fontsource/jetbrains-mono` are installed, fonts are injected locally for a
faithful offline screenshot.

## Editing content

- **Add / reorder / reprice a kit** → edit `data/kits.json` (array order = page order),
  then `node tools/build-data.js`. Drop the hero image in `assets/img/` and point
  `image` at its filename.
- **Change a kit's hero image** → replace the file in `assets/img/`; the heroes are
  the marketing banners cropped to just the artwork (the CTA buttons are real HTML,
  not part of the image).
- **Sidebar** → `data/nav.json`. Each item references an icon by key; add the icon's
  inner SVG to `data/icons.json` if it's new. `"active": true` marks the current page
  (Lab Kits here).
- **Member chip / title / breadcrumb** → `data/member.json` and `data/page.json`.

## Design tokens (`css/styles.css` `:root`)

| Token            | Value      | Use                                   |
|------------------|------------|---------------------------------------|
| `--accent`       | `#D30603`  | Brand red — title accent, eyebrows, Purchase button |
| `--accent-dark`  | `#A60402`  | Purchase button hover                 |
| `--ink`          | `#15171a`  | Primary text                          |
| `--ink-soft`     | `#3a3d44`  | Nav labels, ghost-button text         |
| `--muted`        | `#6b7177`  | Body copy                             |
| `--faint`        | `#9aa0a6`  | Meta, placeholders                    |
| `--bg`/`--card`  | `#ffffff`  | Page + card surfaces (white)          |
| `--line`         | `#e9e7e2`  | Hairline borders                      |

- **Type:** Inter (UI, 800 for the two-tone title with -1.8px tracking),
  JetBrains Mono (member ID, prices, the MENU label).
- **Title pattern:** bold black lead word + bold-italic red accent word ("Lab *kits*").
- **Sidebar:** 280px, white, black-pill active nav (`border-radius:100px`), Tabler
  outline icons inlined as SVG; dual Apex MD / Apex Fit lockups split by a divider.
- **Kit grid:** 3 columns ≥1240px, 2 columns ≥820px, 1 column below; equal-height
  rows so Purchase buttons bottom-align across each row.
