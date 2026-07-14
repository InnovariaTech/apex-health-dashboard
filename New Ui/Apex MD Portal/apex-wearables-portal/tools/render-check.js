#!/usr/bin/env node
/* =============================================================
   render-check.js — screenshot the page for a quick visual diff.
   Renders the MODULAR index.html by default, or the built dist
   file with --dist. Output: tools/preview.png
   Run:  node tools/render-check.js [--dist]
   Requires: npm i -D playwright  (and `npx playwright install chromium`)
   ============================================================= */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) {
    console.error('Playwright not installed. Run:\n  npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }
  const useDist = process.argv.includes('--dist');
  const file = useDist ? path.join(ROOT, 'dist', 'wearables.html') : path.join(ROOT, 'index.html');
  const out = path.join(__dirname, 'preview.png');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1512, height: 982 }, deviceScaleFactor: 2 });
  await page.goto('file://' + file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log('Wrote ' + path.relative(ROOT, out) + '  (source: ' + (useDist ? 'dist' : 'modular') + ')');
})();
