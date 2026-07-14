#!/usr/bin/env bash
# Serve the modular site locally (needed because the app loads css/js/images
# via relative paths, which browsers block over file://).
cd "$(dirname "$0")/.." || exit 1
PORT="${1:-8080}"
echo "Apex MD Shop → http://localhost:$PORT/   (Ctrl+C to stop)"
python3 -m http.server "$PORT"
