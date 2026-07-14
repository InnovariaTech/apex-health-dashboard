#!/usr/bin/env node
/* Render-verify a target HTML file with Playwright and save a full-page PNG.
 * Usage:
 *   node tools/render-check.js                 # renders dist/lab-kits.html
 *   node tools/render-check.js index.html      # renders the modular build
 * Optional: if @fontsource/inter + @fontsource/jetbrains-mono are installed,
 * fonts are injected locally so the screenshot is faithful offline (Google
 * Fonts is unreachable in some sandboxes). In a normal browser the live file
 * loads Inter/JetBrains Mono from Google Fonts as usual.
 */
const path = require('path');
const fs = require('fs');

const target = process.argv[2] || 'dist/lab-kits.html';
const outPng = process.argv[3] || 'render-check.png';

// Chromium location varies by environment; override with PW_CHROME if needed.
const CHROME = process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

function fontCss() {
  const F = path.resolve(__dirname, '..', 'node_modules', '@fontsource');
  if (!fs.existsSync(F)) return '';
  const face = (fam, file, w, style) => {
    const p = path.join(F, file);
    if (!fs.existsSync(p)) return '';
    const b = fs.readFileSync(p).toString('base64');
    return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${w};src:url(data:font/woff2;base64,${b}) format('woff2');}`;
  };
  return [
    face('Inter', 'inter/files/inter-latin-400-normal.woff2', 400, 'normal'),
    face('Inter', 'inter/files/inter-latin-500-normal.woff2', 500, 'normal'),
    face('Inter', 'inter/files/inter-latin-600-normal.woff2', 600, 'normal'),
    face('Inter', 'inter/files/inter-latin-700-normal.woff2', 700, 'normal'),
    face('Inter', 'inter/files/inter-latin-800-normal.woff2', 800, 'normal'),
    face('Inter', 'inter/files/inter-latin-400-italic.woff2', 400, 'italic'),
    face('Inter', 'inter/files/inter-latin-800-italic.woff2', 800, 'italic'),
    face('JetBrains Mono', 'jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', 400, 'normal'),
    face('JetBrains Mono', 'jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2', 500, 'normal'),
    face('JetBrains Mono', 'jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2', 600, 'normal'),
  ].join('\n');
}

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(__dirname, '..', target), { waitUntil: 'networkidle' });
  const css = fontCss();
  if (css) await page.addStyleTag({ content: css });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.resolve(__dirname, '..', outPng), fullPage: true });
  await browser.close();
  console.log('Wrote ' + outPng + ' from ' + target);
})();
