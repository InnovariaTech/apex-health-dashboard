/* tools/build.js
 * Inlines the modular app (HTML + CSS + JS + data + assets) into a single
 * self-contained file at dist/progress.html — no external requests, opens
 * straight from the filesystem. Pure Node, no dependencies.
 *
 *   node tools/build.js
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const b64 = (p) => fs.readFileSync(path.join(root, p)).toString("base64");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let html = read("index.html");

// 1) CSS — inline, with vendored fonts as data URIs
let css = read("css/styles.css").replace(
  /url\(\.\.\/assets\/fonts\/([^)]+)\)/g,
  (_, f) => `url(data:font/woff2;base64,${b64("assets/fonts/" + f)})`
);
html = html.replace(
  '<link rel="stylesheet" href="css/styles.css">',
  `<style>\n${css}\n</style>`
);

// 2) Image assets -> data URIs (logos in markup + photo paths inside data)
const imgs = {
  "assets/img/apex-md-logo.png": `data:image/png;base64,${b64("assets/img/apex-md-logo.png")}`,
  "assets/img/apex-fit-logo.png": `data:image/png;base64,${b64("assets/img/apex-fit-logo.png")}`,
};
for (let i = 1; i <= 6; i++) {
  imgs[`assets/img/month-${i}.jpg`] = `data:image/jpeg;base64,${b64(`assets/img/month-${i}.jpg`)}`;
}

// 3) Scripts — inline data + app (rewriting asset paths to data URIs first)
let data = read("data/progress.js");
let app = read("js/app.js");
for (const [p, uri] of Object.entries(imgs)) {
  const re = new RegExp(esc(p), "g");
  data = data.replace(re, uri); // photo/logo paths referenced from data
  html = html.replace(re, uri); // logo <img> in the static markup
}
html = html
  .replace('<script src="data/progress.js"></script>', `<script>\n${data}\n</script>`)
  .replace('<script src="js/app.js"></script>', `<script>\n${app}\n</script>`);

fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist/progress.html"), html);
console.log(`dist/progress.html — ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB (self-contained)`);
