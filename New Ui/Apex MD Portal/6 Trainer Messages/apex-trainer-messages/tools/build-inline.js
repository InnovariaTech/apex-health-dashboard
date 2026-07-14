#!/usr/bin/env node
/* build-inline.js
 * Produces dist/trainer-messages.html — a single, fully self-contained file
 * with the CSS, JS and every image inlined as base64 data URIs (no external
 * dependencies except the Google Fonts <link>). This is the "ship one file"
 * deliverable that matches the original portal pages.
 *
 *   node tools/build-data.js   # make sure js/data.js is current first
 *   node tools/build-inline.js
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const rd = (p) => fs.readFileSync(path.join(root, p), "utf8");

const mime = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml" };
function dataURI(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  const bytes = fs.readFileSync(path.join(root, relPath));
  return "data:" + (mime[ext] || "application/octet-stream") + ";base64," + bytes.toString("base64");
}

let html = rd("index.html");
let css = rd("css/styles.css");
let dataJs = rd("js/data.js");
let appJs = rd("js/app.js");

// collect every assets/img reference used anywhere and swap for data URIs
const assetRe = /assets\/img\/[A-Za-z0-9._-]+/g;
const assets = new Set([...html.matchAll(assetRe), ...dataJs.matchAll(assetRe)].map((m) => m[0]));
assets.forEach((rel) => {
  const uri = dataURI(rel);
  html = html.split(rel).join(uri);
  dataJs = dataJs.split(rel).join(uri);
});

// inline css: replace the stylesheet <link> with a <style> block
html = html.replace(
  /<link rel="stylesheet" href="css\/styles\.css">/,
  "<style>\n" + css + "\n</style>"
);

// inline js: replace the two <script src> tags with their contents
html = html.replace(
  /<script src="js\/data\.js"><\/script>\s*<script src="js\/app\.js"><\/script>/,
  "<script>\n" + dataJs + "\n</script>\n<script>\n" + appJs + "\n</script>"
);

const distDir = path.join(root, "dist");
fs.mkdirSync(distDir, { recursive: true });
const outPath = path.join(distDir, "trainer-messages.html");
fs.writeFileSync(outPath, html);
console.log("Wrote dist/trainer-messages.html (" + html.length + " bytes, " + assets.size + " assets inlined)");
