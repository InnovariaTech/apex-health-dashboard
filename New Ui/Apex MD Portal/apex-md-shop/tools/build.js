#!/usr/bin/env node
/* Inlines CSS, JS, and image assets back into a single self-contained
   dist/shop.html. Run:  node tools/build.js  */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// 1) inline CSS
const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
html = html.replace('<link rel="stylesheet" href="css/styles.css">',
                    '<style>\n' + css + '\n</style>');

// 2) inline photos.js with image files re-embedded as base64 data URIs
let photos = fs.readFileSync(path.join(root, 'data/photos.js'), 'utf8');
photos = photos.replace(/src:'assets\/img\/([^']+)'/g, (m, fname) => {
  const buf = fs.readFileSync(path.join(root, 'assets/img', fname));
  const ext = path.extname(fname).slice(1).toLowerCase();
  const mime = ext === 'jpg' ? 'image/jpeg'
             : ext === 'svg' ? 'image/svg+xml'
             : 'image/' + ext;
  return "src:'data:" + mime + ';base64,' + buf.toString('base64') + "'";
});

// 3) inline the three script files
const products = fs.readFileSync(path.join(root, 'data/products.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const bundle = '<script>\n' + photos + '\n' + products + '\n' + app + '\n</script>';
html = html.replace(
  /<script src="data\/photos\.js"><\/script>\s*<script src="data\/products\.js"><\/script>\s*<script src="js\/app\.js"><\/script>/,
  bundle
);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/shop.html'), html);
console.log('Built dist/shop.html —', (html.length / 1024 / 1024).toFixed(2), 'MB');
