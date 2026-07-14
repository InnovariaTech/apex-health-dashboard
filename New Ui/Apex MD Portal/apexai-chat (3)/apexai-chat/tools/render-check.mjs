/* Screenshot the built dist for visual verification.
   Requires: npm i -D playwright   (or use your existing Chromium).
   Usage: node tools/render-check.mjs [path-to-html] */
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const target = process.argv[2] || path.join(ROOT, 'dist', 'apexai.html');

const { chromium } = await import('playwright');
const exe = process.env.CHROME_PATH; // set if using a system Chromium
const browser = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : {});
const page = await browser.newPage({ viewport: { width: 1680, height: 1500 }, deviceScaleFactor: 1.5 });
await page.goto('file://' + target);
await page.waitForTimeout(600);
const out = path.join(ROOT, 'dist', 'render-check.png');
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('Wrote', out);
