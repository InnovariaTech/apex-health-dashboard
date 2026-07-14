/**
 * Headless PDF generator for the Apex MD Health Analysis report.
 *
 * This reproduces exactly what the in-page "Export as PDF" button does, but without a
 * browser window — useful for server-side or batch generation.
 *
 * Setup:
 *   npm i playwright
 *   npx playwright install chromium
 *
 * Run (from the project root):
 *   node tools/generate-pdf.js
 *
 * Output:
 *   Apex-MD-Health-Analysis-Report.pdf  (project root)
 *
 * Puppeteer works too — swap the import for `const puppeteer = require('puppeteer')`
 * and `puppeteer.launch()`; the page.pdf() options are identical.
 */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const pageUrl = 'file://' + path.resolve(__dirname, '..', 'health-analysis.html');
  const outPath = path.resolve(__dirname, '..', 'Apex-MD-Health-Analysis-Report.pdf');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  // Build the print report into #pdfReport (function lives in js/report.js)
  const pages = await page.evaluate(() => {
    if (typeof buildReport !== 'function') return -1;
    buildReport();
    return document.getElementById('pdfReport').children.length;
  });
  if (pages < 1) throw new Error('buildReport() did not run — check js/report.js loaded.');
  console.log('Report sections built:', pages);

  await page.waitForTimeout(300);
  await page.emulateMedia({ media: 'print' });

  await page.pdf({
    path: outPath,
    printBackground: true,
    preferCSSPageSize: true, // honors @page { size: letter; margin: 0 } in styles.css
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await browser.close();
  console.log('Wrote', outPath);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
