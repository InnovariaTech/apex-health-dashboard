#!/usr/bin/env node
/* render-check.js
 * Opens index.html in headless Chromium and saves a screenshot to
 * tools/output/preview.png so you can eyeball the rendered page.
 *
 *   npm install playwright   # if not already available
 *   node tools/render-check.js
 */
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  const root = path.resolve(__dirname, "..");
  const url = "file://" + path.join(root, "index.html");

  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  const out = path.join(__dirname, "output", "preview.png");
  await page.screenshot({ path: out, fullPage: false });
  await browser.close();
  console.log("Saved " + out);
})();
