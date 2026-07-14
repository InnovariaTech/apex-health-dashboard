#!/usr/bin/env node
/* =============================================================
   build.js — produce a single, self-contained dist/wearables.html
   Inlines: css/styles.css, js/*.js (in load order) and every
   assets/img/*.png (as base64 data URIs). Google Fonts stay as a
   runtime <link> (same as the live page).
   Run:  node tools/build.js
   ============================================================= */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const p = (...a) => path.join(ROOT, ...a);

let html = fs.readFileSync(p('index.html'), 'utf8');

// 1. inline CSS
const css = fs.readFileSync(p('css', 'styles.css'), 'utf8');
html = html.replace(
  /<link rel="stylesheet" href="css\/styles\.css" \/>/,
  '<style>\n' + css + '\n</style>'
);

// 2. inline images referenced as assets/img/*.png
html = html.replace(/(src=")(assets\/img\/[^"]+)(")/g, (m, a, rel, b) => {
  const buf = fs.readFileSync(p(rel));
  const ext = path.extname(rel).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'jpeg' : ext;
  return a + 'data:image/' + mime + ';base64,' + buf.toString('base64') + b;
});

// 3. inline JS modules in declared order, replacing their <script src> tags
['js/data.js', 'js/charts.js', 'js/app.js'].forEach((rel) => {
  const code = fs.readFileSync(p(rel), 'utf8');
  const tag = new RegExp('<script src="' + rel.replace(/\//g, '\\/') + '"></script>');
  html = html.replace(tag, '<script>\n' + code + '\n</script>');
});

fs.mkdirSync(p('dist'), { recursive: true });
fs.writeFileSync(p('dist', 'wearables.html'), html);
console.log('Built dist/wearables.html (' + html.length.toLocaleString() + ' bytes)');
