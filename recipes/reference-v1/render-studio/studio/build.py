#!/usr/bin/env python3
"""Build the studio page: inline the engine and glyph data into one HTML file, copy assets next to it.

    python3 studio/build.py            # -> dist/index.html + dist/foley/ + dist/letter/

The output is a single self-contained page (fonts load from Google Fonts) plus the audio files it
fetches by relative path. Publish dist/index.html as an artifact with the files in dist/ as supporting
files, or serve dist/ locally with tools/serve.py.
"""
import argparse, json, pathlib, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent
DIST = ROOT.parent / "dist"


def build(dist=DIST, episode_spec=None):
    js = "".join(p.read_text() for p in sorted((ROOT / "src").glob("*.js")))
    glyphs = json.dumps(json.loads((ROOT / "data" / "script_glyphs.json").read_text()), separators=(",", ":"))
    if js.count("__GLYPHS__") != 1:
        sys.exit("expected exactly one __GLYPHS__ placeholder in src/")
    js = js.replace("__GLYPHS__", glyphs)
    shell = (ROOT / "shell.html").read_text()
    if episode_spec:
        spec = json.loads(pathlib.Path(episode_spec).read_text(encoding="utf-8"))
        encoded = json.dumps(spec, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
        bootstrap = "<script>window.__FR_EPISODE_SPEC__=" + encoded + ";</script>\n"
        shell += bootstrap
    html = shell + "<script>\n" + js + "\n</script>"
    dist.mkdir(parents=True, exist_ok=True)
    (dist / "index.html").write_text(html)
    for sub in (ROOT / "public").iterdir():
        target = dist / sub.name
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(sub, target)
    return dist / "index.html", len(html)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--episode-spec", help="Inject one frozen episode scene plan into the built Studio page")
    args = parser.parse_args()
    path, n = build(episode_spec=args.episode_spec)
    print(f"built {path} ({n/1024:.0f} KB)")
