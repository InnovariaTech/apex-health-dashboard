#!/usr/bin/env node
/**
 * generate-pdf.js — Apex MD Biomarker report export
 * ---------------------------------------------------
 * Renders the biomarkers page's built-in clinical report (the same output as
 * the in-app "Export PDF" button) to a print-ready, 2-page US-Letter PDF.
 *
 * How it works:
 *   1. Loads index.html in headless Chromium (Playwright).
 *   2. Calls the page's own openPdfModal() to build the report into #pdfModal.
 *   3. Lifts the modal to <body> and hides the dashboard so the page's
 *      @media print rules isolate exactly the two .pdf-page sheets
 *      (otherwise the hidden dashboard reserves layout space -> blank pages).
 *   4. Prints with Chromium at Letter / printBackground / zero margins.
 *
 * Fonts & icons are vendored locally (see /assets/fonts + css/fonts.css), so
 * output is deterministic and works with no network access.
 *
 * Usage:
 *   npm install            # once, installs playwright + chromium
 *   npm run pdf            # writes dist/biomarker-report.pdf
 *   node tools/generate-pdf.js [inputHtml] [outputPdf]
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const input = process.argv[2] || path.join(ROOT, 'index.html');
const output = process.argv[3] || path.join(ROOT, 'dist', 'biomarker-report.pdf');

(async () => {
  fs.mkdirSync(path.dirname(output), { recursive: true });

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('file://' + input, { waitUntil: 'networkidle' });

  // Build the report via the page's own logic.
  await page.evaluate(() => { openPdfModal(); });

  // Isolate the report pages cleanly for print.
  await page.evaluate(() => {
    const modal = document.getElementById('pdfModal');
    if (modal) document.body.appendChild(modal);
    const app = document.querySelector('.app');
    if (app) app.style.display = 'none';
    document.documentElement.style.margin = '0';
    document.body.style.margin = '0';
  });

  // Make sure all web fonts (Inter, JetBrains Mono, Tabler icons) are ready.
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(300);

  const pages = await page.evaluate(() => document.querySelectorAll('.pdf-page').length);

  await page.pdf({
    path: output,
    format: 'Letter',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await browser.close();
  if (errors.length) {
    console.warn('Console/page errors during render:\n  ' + errors.join('\n  '));
  }
  console.log(`✓ ${pages}-page PDF written to ${path.relative(process.cwd(), output)}`);
})().catch(err => { console.error(err); process.exit(1); });
