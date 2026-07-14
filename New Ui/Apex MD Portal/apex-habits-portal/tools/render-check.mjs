// render-check.mjs — full-page screenshot for visual QA (Playwright + Chromium).
// Renders the modular index.html via file:// and saves render.png at the repo root.
// Usage:  npm i && node tools/render-check.mjs
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2] || 'index.html';   // or: dist/habits.html
const url = pathToFileURL(resolve(root, target)).href;

const browser = await chromium.launch();   // omit executablePath: uses the npm-installed Chromium
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: resolve(root, 'render.png'), fullPage: true });

console.log(errors.length ? 'JS errors: ' + JSON.stringify(errors) : 'No JS errors.');
console.log('Saved render.png');
await browser.close();
