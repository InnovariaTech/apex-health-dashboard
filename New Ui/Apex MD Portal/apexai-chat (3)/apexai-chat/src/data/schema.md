# ApexAI message block schema

Each assistant turn is an envelope:

```json
{ "meta": "targeted to your marker profile", "blocks": [ /* ordered blocks */ ] }
```

`meta` (optional) renders as faint text after the "ApexAI" label.
`blocks` is an ordered array; each block has a `type`. The renderer
(`src/js/renderer.js`) maps each type to a styled component.

## Block types

### intro
Lead paragraph. Supports `**bold**`.
```json
{ "type": "intro", "text": "Based on your labs, here's a **targeted plan**…" }
```

### section
Eyebrow divider between groups.
```json
{ "type": "section", "label": "Health Priorities Based on Labs" }
```

### lab_snapshot
Two-column strengths / areas-to-address panel with value badges.
```json
{ "type": "lab_snapshot", "tag": "8 markers", "watchLabel": "Areas to Address",
  "strengths": [ { "name": "Hemoglobin A1c", "note": "Excellent glucose control", "value": "5.2%" } ],
  "watch":     [ { "name": "Creatinine — mild", "note": "Watch kidney", "value": "1.31" } ] }
```

### phase_plan
Numbered phase timeline (spine). Each item is tagged by category.
`cat` ∈ `strength | cardio | nutrition | hydration | recovery`.
```json
{ "type": "phase_plan", "tag": "EOS Fitness", "title": "8-Week Optimization Plan",
  "phases": [
    { "num": "1", "weeks": "Weeks 1–2", "name": "Foundation Phase", "retest": false,
      "goal": "**Goal:** Build baseline fitness.",
      "items": [ { "cat": "strength", "freq": "3×/wk", "text": "Full-body compound lifts.", "sub": "Squats, deadlifts…" } ] }
  ] }
```

### priority
Priority card with a driver-marker chip, a Gym-Strategy checklist, and Workouts.
`strategy[].status` ∈ `ok | warn`. `workouts[].badge.kind` ∈ `freq | label`.
```json
{ "type": "priority", "num": "01", "title": "Support Kidney Function",
  "driver": { "markers": [ { "label": "Creatinine", "value": "1.31 mg/dL" } ], "note": "mildly elevated" },
  "strategy": [ { "status": "ok", "text": "**Moderate-intensity training** over high-intensity" },
                { "status": "warn", "text": "**Avoid excessive creatine** until cleared by your doctor" } ],
  "workouts": [ { "badge": { "kind": "freq", "value": "3–4×/wk" }, "text": "**Strength sessions**", "sub": "optional detail" } ] }
```

### product_rec
One or more product cards. `items` may be product ids (resolved from the
catalog in `products.json`) or inline product objects.
```json
{ "type": "product_rec", "label": "Recommended from Apex MD", "items": ["creatine", "glp1"] }
```

### callout
Closing summary with the spark icon. Supports `**bold**`.
```json
{ "type": "callout", "text": "Your labs look strong. **Want a weekly split?**" }
```

### markdown  (fallback)
If the model returns prose instead of blocks, wrap it here — renders as
paragraphs / bullets so nothing breaks.
```json
{ "type": "markdown", "text": "- point one\n- point two" }
```
