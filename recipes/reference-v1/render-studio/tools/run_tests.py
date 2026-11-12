#!/usr/bin/env python3
"""Run the in-page test suite headlessly and report. Exit code 1 if anything fails.

    python3 tools/run_tests.py [--build] [--json results.json]

The page runs every suite on load (letter, nested actors and outfits, renderer, offline audio) on
copies of the scene log, then sets window.__TESTS_DONE.
"""
import argparse, asyncio, json, subprocess, sys
from playwright.async_api import async_playwright
from common import ROOT, ensure_built, open_studio, start_server

ap = argparse.ArgumentParser()
ap.add_argument("--build", action="store_true", help="rebuild dist/ first")
ap.add_argument("--json", help="write results to this file")
ap.add_argument("--timeout", type=int, default=240, help="seconds")
a = ap.parse_args()


async def main():
    if a.build:
        subprocess.run([sys.executable, str(ROOT / "studio" / "build.py")], check=True)
    ensure_built()
    base = start_server()
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        pg, errors = await open_studio(b, base, viewport=(1280, 1000))
        await pg.wait_for_function("window.__TESTS_DONE === true", timeout=a.timeout * 1000, polling=500)
        res = await pg.evaluate("window.__TEST_RESULTS")
        await b.close()
    fails = [r for r in res if not r["pass"]]
    for r in res:
        print(("PASS " if r["pass"] else "FAIL ") + r["name"] + " | " + r["detail"])
    print(f"\n{len(res) - len(fails)} of {len(res)} pass" + (f"; page errors: {errors}" if errors else ""))
    if a.json:
        json.dump({"results": res, "errors": errors}, open(a.json, "w"), indent=2)
    return 1 if fails or errors else 0


sys.exit(asyncio.run(main()))
