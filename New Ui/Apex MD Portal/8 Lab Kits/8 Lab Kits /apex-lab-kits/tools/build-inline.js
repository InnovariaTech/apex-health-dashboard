#!/usr/bin/env node
/* Inlines css, js, and image assets into one portable file: dist/lab-kits.html.
 * Images become base64 data-URIs exposed as window.APEX_ASSETS, which app.js
 * prefers over the assets/img/ paths. Google Fonts stays as an external <link>.
 * Run: node tools/build-inline.js   (run build-data.js first)
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

// 1) base64 every image asset
const imgDir = path.join(root, 'assets', 'img');
const assets = {};
for (const file of fs.readdirSync(imgDir)) {
  const ext = path.extname(file).toLowerCase();
  if (!MIME[ext]) continue;
  const b64 = fs.readFileSync(path.join(imgDir, file)).toString('base64');
  assets[file] = 'data:' + MIME[ext] + ';base64,' + b64;
}
const assetsScript = '<script>window.APEX_ASSETS = ' + JSON.stringify(assets) + ';</script>';

// 2) read parts
const css = read('css/styles.css');
const dataJs = read('js/data.js');
const appJs = read('js/app.js');

// 3) assemble from index.html
let html = read('index.html');
html = html.replace('<link rel="stylesheet" href="css/styles.css">', '<style>\n' + css + '\n</style>');
html = html.replace('<script src="js/data.js"></script>', assetsScript + '\n<script>\n' + dataJs + '\n</script>');
html = html.replace('<script src="js/app.js"></script>', '<script>\n' + appJs + '\n</script>');

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'lab-kits.html');
fs.writeFileSync(outFile, html);
console.log('Wrote dist/lab-kits.html (' + Math.round(html.length / 1024) + ' KB, ' + Object.keys(assets).length + ' assets inlined)');
