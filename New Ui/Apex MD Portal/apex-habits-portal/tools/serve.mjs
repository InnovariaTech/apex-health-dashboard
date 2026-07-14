// serve.mjs — zero-dependency static server for local dev (handles file:// CORS for fonts/JSON).
// Usage:  node tools/serve.mjs        -> http://localhost:5173
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT || 5173;
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
  '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg',
  '.woff2':'font/woff2', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = join(root, normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(root)) { res.writeHead(403).end('Forbidden'); return; }
    await stat(file);
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404 Not Found');
  }
}).listen(PORT, () => console.log(`Apex Habits dev server -> http://localhost:${PORT}`));
