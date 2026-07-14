/* Inline everything into a single self-contained dist/apexai.html.
   Resolves <link> CSS, url(...) fonts, <img> images, and <script src>. */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const mime = (f) => ({ '.woff2':'font/woff2', '.png':'image/png', '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.webp':'image/webp' }[path.extname(f).toLowerCase()] || 'application/octet-stream');
const dataURI = (abs) => `data:${mime(abs)};base64,${fs.readFileSync(abs).toString('base64')}`;

function inlineCssUrls(css, cssDir) {
  return css.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, ref) => {
    if (/^data:|^https?:/.test(ref)) return m;
    const abs = path.resolve(cssDir, ref);
    return fs.existsSync(abs) ? `url(${dataURI(abs)})` : m;
  });
}

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// <link rel="stylesheet" href="..."> -> <style> (with url() inlined)
html = html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g, (m, href) => {
  const abs = path.resolve(ROOT, href);
  const css = inlineCssUrls(fs.readFileSync(abs, 'utf8'), path.dirname(abs));
  return `<style>\n${css}\n</style>`;
});

// <script src="..."> -> inline <script>
html = html.replace(/<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/g, (m, src) => {
  const abs = path.resolve(ROOT, src);
  return `<script>\n${fs.readFileSync(abs, 'utf8')}\n</script>`;
});

// <img src="..."> -> data URI
html = html.replace(/(<img[^>]*\ssrc=)["']([^"']+)["']/g, (m, pre, src) => {
  if (/^data:|^https?:/.test(src)) return m;
  const abs = path.resolve(ROOT, src);
  return fs.existsSync(abs) ? `${pre}"${dataURI(abs)}"` : m;
});

// Product images referenced from JS data (src/assets/img/...): inline as data URIs
html = html.replace(/(['"])((?:src\/)?assets\/img\/[^'"]+)\1/g, (m, q, ref) => {
  const abs = path.resolve(ROOT, ref.startsWith('src/') ? ref : 'src/' + ref);
  return fs.existsSync(abs) ? `${q}${dataURI(abs)}${q}` : m;
});

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist', 'apexai.html');
fs.writeFileSync(out, html);
console.log('Built', out, '(' + (html.length / 1024 | 0) + ' KB)');
