#!/usr/bin/env python3
"""Bundle the whole project into one self-contained HTML (assets as data URIs)
into dist/nutrition-inline.html — handy for emailing or hosting as a single file."""
import os, re, base64, mimetypes
HERE = os.path.dirname(__file__)
ROOT = os.path.abspath(os.path.join(HERE, '..'))

def read(p): return open(os.path.join(ROOT, p), 'r', encoding='utf-8').read()

html = read('index.html')
css = read('css/styles.css')
appdata = read('data/app-data.js')
script = read('js/script.js')

# inline css + scripts
html = re.sub(r'<link rel="stylesheet" href="css/styles.css">', '<style>\n' + css + '\n</style>', html)
html = html.replace('<script src="data/app-data.js"></script>', '<script>\n' + appdata + '\n</script>')
html = html.replace('<script src="js/script.js"></script>', '<script>\n' + script + '\n</script>')

# swap every asset path for a data URI
def datauri(path):
    mime = mimetypes.guess_type(path)[0] or 'image/jpeg'
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(os.path.join(ROOT, path), 'rb').read()).decode())

for path in sorted(set(re.findall(r'assets/img/[A-Za-z0-9/_\-]+\.(?:jpg|jpeg|png)', html))):
    html = html.replace(path, datauri(path))

os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'nutrition-inline.html')
open(out, 'w', encoding='utf-8').write(html)
print("Wrote", os.path.relpath(out, ROOT), "(%d KB)" % (len(html) // 1024))
