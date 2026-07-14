#!/usr/bin/env python3
"""Serve the project locally:  python3 tools/serve.py  ->  http://localhost:8000"""
import http.server, socketserver, os
os.chdir(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
PORT = 8000
H = http.server.SimpleHTTPRequestHandler
H.extensions_map.update({'.js': 'text/javascript'})
print("APEX Nutrition running at http://localhost:%d  (Ctrl+C to stop)" % PORT)
socketserver.TCPServer(("", PORT), H).serve_forever()
