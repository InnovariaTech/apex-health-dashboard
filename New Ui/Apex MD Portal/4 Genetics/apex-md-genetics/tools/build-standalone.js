#!/usr/bin/env node
/**
 * build-standalone.js
 * Inlines css/styles.css, js/script.js, every assets/img/* reference, and the
 * report PDF back into ONE self-contained dist/genetics.standalone.html
 * (data: URIs). Produces the single-file deliverable from the modular source.
 *
 * Usage:  node tools/build-standalone.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const mime = ext => ({'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf'}[ext.toLowerCase()] || 'application/octet-stream');
const dataUri = rel => {
  const p = path.join(ROOT, rel);
  const b64 = fs.readFileSync(p).toString('base64');
  return `data:${mime(path.extname(p))};base64,${b64}`;
};

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/styles.css'), 'utf8');
let js  = fs.readFileSync(path.join(ROOT, 'js/script.js'), 'utf8');

// 1) inline every relative asset path referenced in HTML (src="assets/..."/ "css/img"...)
html = html.replace(/(src|href)="(assets\/[^"]+)"/g, (m, attr, rel) => `${attr}="${dataUri(rel)}"`);

// 2) inline supplement thumbnails referenced inside JS (SUPP_IMG map -> assets/img/supplements/*.jpg)
js = js.replace(/"(assets\/img\/[^"]+)"/g, (m, rel) => `"${dataUri(rel)}"`);

// 3) re-embed the report PDF + restore base64 export (replace the relative-path exportSummary)
const pdfB64 = fs.readFileSync(path.join(ROOT, 'assets/report/Lifestyle-Genetics-Report-Recommendations.pdf')).toString('base64');
const embeddedExport = `const REPORT_PDF_B64="${pdfB64}";
function exportSummary(){
  try{
    const bin=atob(REPORT_PDF_B64);const len=bin.length,bytes=new Uint8Array(len);
    for(let i=0;i<len;i++){bytes[i]=bin.charCodeAt(i);}
    const blob=new Blob([bytes],{type:'application/pdf'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='Lifestyle-Genetics-Report-Recommendations.pdf';
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }catch(e){alert('Could not export the report: '+(e&&e.message?e.message:e));}
}`;
js = js.replace(/function exportSummary\(\)\{[\s\S]*?\n\}/, embeddedExport);

// 4) fold CSS + JS back inline
html = html.replace('<link rel="stylesheet" href="css/styles.css">', `<style>\n${css}\n</style>`);
html = html.replace('<script src="js/script.js"></script>', `<script>\n${js}\n</script>`);

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist/genetics.standalone.html');
fs.writeFileSync(out, html);
console.log('Wrote', out, '(' + (fs.statSync(out).size/1048576).toFixed(1) + ' MB)');
