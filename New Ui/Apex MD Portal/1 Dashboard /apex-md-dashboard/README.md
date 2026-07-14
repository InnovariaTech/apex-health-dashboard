# Apex MD — Health Dashboard

A self-contained front-end for the Apex MD patient health dashboard. No build step or
dependencies — open `index.html` in a browser or deploy the folder as static files.

## Structure

```
apex-md-dashboard/
├── index.html      # Markup
├── styles.css      # All styles (design tokens live in :root at the top)
├── script.js       # Sidebar drawer toggle + before/after photo slider
└── assets/         # Extracted images (logos, headshots, body figure, vitals icons,
                    #   progress photos pp1–6, store thumbnails sh1–3)
```

## Design system (defined in `:root` in styles.css)

- Fonts: **Inter** (UI text/headings), **JetBrains Mono** (labels, numbers, chips).
  Loaded via a single Google Fonts `<link>` in `index.html`.
- Wine accent `--red: #9B1C2E`; brand red text uses `#D30704`.
- Corner radii `--r: 22px`, `--r-sm: 16px`. Full palette is in the `:root` block.

## Responsive

Breakpoints at 1320 / 1040 / 980 / 620 / 560px. Sidebar collapses to an off-canvas
drawer ≤1040px (hamburger + overlay, wired up in `script.js`).

## Notes for developers

- Data is currently hard-coded in the markup — swap the static values
  (scores, biomarker bars, vitals, messages, store items) for your data layer.
- The bio-age figure rotates via the `spinFig` CSS keyframe; the donut/age-track are inline SVG.
- Images are plain files in `assets/` — replace or re-point as needed.
