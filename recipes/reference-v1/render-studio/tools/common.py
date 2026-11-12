"""Shared helpers for the studio tools: a charset-correct static server and page loading.

The page must be served over HTTP (it fetches its audio files) and as UTF-8: the script contains
literal characters such as the em dash in "— Leonardo", and a server that omits the charset makes
Chromium decode the page as Latin-1, which breaks glyph lookup.
"""
import functools, http.server, pathlib, socket, threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
    }

    def log_message(self, *a):
        pass


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def start_server(directory=DIST, port=None):
    """Serve `directory` on localhost in a daemon thread. Returns the base URL."""
    port = port or free_port()
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=str(directory)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f"http://127.0.0.1:{port}"


def ensure_built(episode_spec=None):
    if episode_spec or not (DIST / "index.html").exists():
        import subprocess, sys
        cmd = [sys.executable, str(ROOT / "studio" / "build.py")]
        if episode_spec:
            cmd += ["--episode-spec", str(pathlib.Path(episode_spec).resolve())]
        subprocess.run(cmd, check=True)


async def open_studio(browser, base, scene=None, export=False, viewport=(1280, 720), scale=1):
    """Open the studio page. export=True skips the in-page test suite (#export) and pins the stage
    to exactly the viewport so screenshots are clean 16:9 frames."""
    pg = await browser.new_page(viewport={"width": viewport[0], "height": viewport[1]}, device_scale_factor=scale)
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    await pg.goto(base + "/index.html" + ("#export" if export else ""))
    await pg.wait_for_function("window.__dl && typeof window.__dl.seek === 'function'")
    if scene:
        await pg.evaluate(f"window.__dl.setScene({scene!r})")
    if export:
        w, h = viewport
        await pg.add_style_tag(content=(
            f"#stage{{position:fixed!important;left:0;top:0;width:{w}px!important;height:{h}px!important;"
            "max-width:none!important;z-index:999;border-radius:0!important;box-shadow:none!important}"
            "#poster{display:none!important}body{overflow:hidden}"))
        await pg.evaluate("document.fonts.ready")
        await pg.wait_for_timeout(400)
    return pg, errors
