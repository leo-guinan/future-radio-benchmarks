#!/usr/bin/env python3
"""Serve dist/ for previewing in a browser (UTF-8, audio MIME types).

    python3 tools/serve.py [--port 8765] [--dir dist]
"""
import argparse, time
from common import DIST, ensure_built, start_server

ap = argparse.ArgumentParser()
ap.add_argument("--port", type=int, default=8765)
ap.add_argument("--dir", default=str(DIST))
a = ap.parse_args()
ensure_built()
print(start_server(a.dir, a.port) + "/index.html")
try:
    while True:
        time.sleep(3600)
except KeyboardInterrupt:
    pass
