/* tools/generate-pdf.js
 * Exports the built page to a PDF via headless Chromium.
 *
 *   npm i -D playwright   # one-time
 *   node tools/build.js   # ensure dist/progress.html is fresh
 *   node tools/generate-pdf.js
 *
 * The polished, print-formatted member report (Apex-Progress-Report.pdf)
 * ships in dist/ already; this tool produces a quick export of the live page.
 */
const path = require("path");

(async () => {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (e) {
    console.error("Playwright is not installed. Run:  npm i -D playwright");
    process.exit(1);
  }

  const src = "file://" + path.resolve(__dirname, "..", "dist", "progress.html");
  const out = path.resolve(__dirname, "..", "dist", "apex-progress.pdf");

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(src, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: out,
    printBackground: true,
    format: "A4",
    landscape: true,
    margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
  });
  await browser.close();
  console.log("wrote", out);
})();
