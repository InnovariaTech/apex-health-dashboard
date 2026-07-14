# APEX FIT — Nutrition

The Nutrition section of the APEX MD / APEX FIT patient portal. Two views live in
`index.html`, switched by the in-page tabs:

- **Journal** — total kcal / avg / day / days-logged stats, a calorie-trend line chart,
  a macros-per-day stacked bar chart, and the daily intake log (synced from the APEX FIT app).
- **Plan** — the assigned meal plan summary plus a 7-day rotation. Each day shows four
  meals (Breakfast / Snack / Lunch / Dinner) with photo, calories per serving and a swap action.

A standalone **Foods** library page is also included as `foods.html` (self-contained).

## Project structure

```
apex-nutrition/
├── index.html            Markup (links css/, data/, js/)
├── foods.html            Standalone custom-food library (self-contained)
├── README.md
├── assets/
│   └── img/
│       ├── apex-md-logo.jpg
│       ├── apex-fit-logo.jpg
│       └── meals/        day1-breakfast.jpg … day7-dinner.jpg  (28 photos)
├── css/
│   └── styles.css        All styles + design tokens (:root)
├── data/
│   └── app-data.js       Runtime data → window.APEX_DATA (generated from json/)
├── js/
│   └── script.js         Renders charts, log, plan; tab + day switching
├── json/
│   ├── journal.json      Canonical journal data (goal, trend, macros, log)
│   └── plan.json         Canonical meal-plan data (7 days × 4 meals)
└── tools/
    ├── build-data.py     json/*.json  ->  data/app-data.js
    ├── build-inline.py   whole project -> dist/nutrition-inline.html (single file)
    └── serve.py          local dev server on http://localhost:8000
```

## Running

Open `index.html` directly in a browser — it works offline. Data is delivered through a
plain `<script>` (`data/app-data.js` → `window.APEX_DATA`), so there is no `fetch()` and no
CORS/file:// issue.

For a dev server (optional):

```bash
python3 tools/serve.py        # http://localhost:8000
```

## Editing the data

`json/journal.json` and `json/plan.json` are the source of truth. After editing them,
regenerate the runtime copy:

```bash
python3 tools/build-data.py   # rewrites data/app-data.js
```

Meal photos are referenced by path (`assets/img/meals/dayN-slot.jpg`). To change a dish
image, drop a new file at the same path or update the `image` field in `json/plan.json`.

## Single-file build

To produce one portable HTML with every asset embedded as a data URI:

```bash
python3 tools/build-inline.py  # writes dist/nutrition-inline.html
```

## Design tokens (css/styles.css `:root`)

| Token        | Value     | Use                              |
|--------------|-----------|----------------------------------|
| `--ink`      | `#15181d` | Primary text, active nav pill    |
| `--red`      | `#c2152e` | APEX accent (italic headline, active day) |
| `--green`    | `#2f7d5b` | Protein bars, goal line, on-track|
| `--amber`    | `#bd7c1c` | Over-goal, attention             |
| `--blue`     | `#3b73e0` | Calorie line, carbs bars         |
| `--bg`       | `#ffffff` | Page background                  |

Fonts: **Inter** (UI + numbers) and **Newsreader italic** (the red accent word in the title),
loaded from Google Fonts in `index.html`.

## Notes

- Logos are JPEGs with solid white backgrounds; for colored surfaces use transparent
  PNG/SVG versions.
- Meal images are cropped from source screenshots — swap in the original high-res recipe
  photos at the same paths for sharper cards.
