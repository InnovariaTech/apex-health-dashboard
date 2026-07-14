#!/usr/bin/env python3
"""serve.py — serve the project root over HTTP for local preview.

    python3 tools/serve.py            # -> http://localhost:8000
    python3 tools/serve.py 5500       # custom port

Then open http://localhost:8000/index.html
(index.html also works by double-clicking it; the local server is only
needed if you switch the data loader over to fetch() data/wearables.json.)
"""
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Serving %s\n  -> http://localhost:%d/index.html\nCtrl+C to stop." % (ROOT, PORT))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped.")
