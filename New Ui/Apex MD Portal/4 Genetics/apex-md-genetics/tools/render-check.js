#!/usr/bin/env node
/**
 * render-check.js — opens index.html in headless Chromium and screenshots it,
 * so you can eyeball that the externalized assets all resolve.
 * Requires: npm i, then npx playwright install chromium
 * Usage:    node tools/render-check.js
 */
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const url = 'file://' + path.join(__dirname, '..', 'index.html');
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 }, deviceScaleFactor: 2 });
  const missing = [];
  page.on('requestfailed', r => missing.push(r.url()));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(__dirname, '..', 'dist', 'render-check.png'), fullPage: true });
  console.log('Saved dist/render-check.png');
  if (missing.length) console.warn('Failed requests:\n' + missing.join('\n'));
  else console.log('All asset requests resolved.');
  await browser.close();
})();
