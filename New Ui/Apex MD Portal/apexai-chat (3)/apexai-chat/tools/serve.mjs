/* Zero-dep static dev server:  node tools/serve.mjs  ->  http://localhost:5173 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT || 5173;
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
  '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.woff2':'font/woff2' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const abs = path.join(ROOT, p);
  if (!abs.startsWith(ROOT) || !fs.existsSync(abs)) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(abs)] || 'application/octet-stream' });
  fs.createReadStream(abs).pipe(res);
}).listen(PORT, () => console.log('ApexAI dev server → http://localhost:' + PORT));
