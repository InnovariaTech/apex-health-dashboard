# tools/

| Script | What it does |
|---|---|
| `build-standalone.js` | Inlines CSS, JS, all images, and the report PDF back into a single portable `dist/genetics.standalone.html` (base64 data URIs). Run when you need the one-file version. |
| `render-check.js` | Loads `index.html` in headless Chromium, screenshots it to `dist/render-check.png`, and reports any asset that failed to load. |

```bash
npm install
npx playwright install chromium   # render-check only
npm run build-standalone
npm run render-check
```
