#!/usr/bin/env python3
"""Render stills of a scene at chosen times and a contact sheet, for reviewing staging and camera.

    python3 tools/stills.py --scene letter --times 3,13,30.5,40,66,79,85 --out stills/
    python3 tools/stills.py --scene letter --every 6 --out stills/

Writes stills/<t>.png (1280x720) and stills/contact.png (3 columns). Also prints the scene log
(time, duration, op, actor, target) so stills can be matched to events.
"""
import argparse, asyncio, json, pathlib
from PIL import Image
from playwright.async_api import async_playwright
from common import ensure_built, open_studio, start_server

ap = argparse.ArgumentParser()
ap.add_argument("--scene", default="letter", help="letter | main | diag (or any scene you add)")
ap.add_argument("--times", help="comma-separated seconds")
ap.add_argument("--every", type=float, help="one still every N seconds")
ap.add_argument("--out", default="stills")
ap.add_argument("--debug", action="store_true", help="show the debug overlay (tip, strokes, clocks)")
ap.add_argument("--log", action="store_true", help="print the scene log")
a = ap.parse_args()


async def main():
    ensure_built()
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    base = start_server()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg, errors = await open_studio(b, base, scene=a.scene, export=True)
        if a.debug:
            await pg.evaluate("window.__dl.setDebug(true)")
        end = await pg.evaluate("window.__dl.SCRIPT_END()")
        times = [float(x) for x in a.times.split(",")] if a.times else [round(i * a.every, 2) for i in range(int(end / a.every) + 1)]
        files = []
        for t in times:
            await pg.evaluate(f"window.__dl.seek({t})")
            f = out / f"{t:06.2f}.png"
            await pg.screenshot(path=str(f), clip={"x": 0, "y": 0, "width": 1280, "height": 720})
            files.append(f)
        if a.log:
            for e in await pg.evaluate("window.__dl.dump()"):
                print(f"{e['t']:7.2f} {e['dur']:5.2f}  {e['op']:<9} {e['actor']:<14} → {e['target']}  {e['result']}")
        await b.close()
    ims = [Image.open(f).resize((640, 360)) for f in files]
    sheet = Image.new("RGB", (640 * 3, 360 * ((len(ims) + 2) // 3)), "black")
    for i, im in enumerate(ims):
        sheet.paste(im, ((i % 3) * 640, (i // 3) * 360))
    sheet.save(out / "contact.png")
    print(f"{len(files)} stills of '{a.scene}' (ends at {end}s) → {out}/contact.png" + (f"; page errors: {errors}" if errors else ""))


asyncio.run(main())
