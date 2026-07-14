// build.mjs — inline the modular source into a single self-contained dist/habits.html.
// Embeds CSS, JS, fonts (woff2 -> base64), and images (png -> base64). No external deps.
// Usage:  node tools/build.mjs   (run from repo root or tools/)
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const R = (...p) => join(root, ...p);

const b64 = (p) => readFileSync(p).toString('base64');
const dataURI = (p, mime) => `data:${mime};base64,${b64(p)}`;

// 1) inline fonts.css woff2 -> base64
let fontsCss = readFileSync(R('assets/fonts/fonts.css'), 'utf8');
fontsCss = fontsCss.replace(/url\((.*?\.woff2)\)/g, (_, f) =>
  `url(${dataURI(R('assets/fonts', f.trim()), 'font/woff2')})`);

// 2) main stylesheet
const styles = readFileSync(R('css/styles.css'), 'utf8');

// 3) JS modules, in load order
const jsOrder = ['icons.js', 'data.js', 'render.js', 'app.js'];
const js = jsOrder.map(f => `/* ===== ${f} ===== */\n` + readFileSync(R('js', f), 'utf8')).join('\n');

// 4) body HTML, with <img src="assets/img/x.png"> -> base64 data URIs
let html = readFileSync(R('index.html'), 'utf8');
const bodyMatch = html.match(/<body>([\s\S]*?)<script/);
let body = bodyMatch[1];
body = body.replace(/src="assets\/img\/([^"]+)"/g, (_, name) =>
  `src="${dataURI(R('assets/img', name), 'image/png')}"`);

// 5) favicon
const favicon = dataURI(R('assets/img/favicon.png'), 'image/png');

const out = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Habits · Apex MD</title>
<link rel="icon" type="image/png" href="${favicon}">
<style>${fontsCss}</style>
<style>${styles}</style>
</head>
<body>
${body}
<script>
${js}
</script>
</body>
</html>
`;

if (!existsSync(R('dist'))) mkdirSync(R('dist'));
writeFileSync(R('dist/habits.html'), out);
console.log(`Built dist/habits.html  (${(out.length / 1024).toFixed(0)} KB, self-contained)`);
