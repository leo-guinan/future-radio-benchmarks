#!/usr/bin/env python3
"""Export a scene to MP4: frame-exact video from the renderer, audio from the page's own engine.

    python3 tools/export_mp4.py --scene letter --out out/the-letter.mp4

How it works
  * The page is opened with #export (no test suite) and the stage pinned to 1280x720.
  * Audio: window.__dl.renderAudio() renders the whole scene through the same audio engine the
    page uses live (voice-over, Foley driven by stroke geometry, observations such as the radio),
    in an OfflineAudioContext, and returns a 16-bit stereo WAV, scaled down if it would clip.
  * Video: for each frame time i/fps the scene is seeked (a pure function of time) and screenshotted,
    so frame timing is exact regardless of how long each render takes.
  * Mux: H.264 (CRF 18, veryfast), AAC 192k, loudness-normalized to -16 LUFS / -1.5 dBTP.
Takes roughly 3-4 minutes for 90 seconds at 30 fps.
"""
import argparse, asyncio, base64, json, pathlib, subprocess, sys, tempfile, time
from playwright.async_api import async_playwright
from common import ensure_built, open_studio, start_server

ap = argparse.ArgumentParser()
ap.add_argument("--scene", default="letter")
ap.add_argument("--out", required=True)
ap.add_argument("--fps", type=int, default=30)
ap.add_argument("--crf", type=int, default=18)
ap.add_argument("--start", type=float, default=0)
ap.add_argument("--end", type=float, help="defaults to the scene's end")
ap.add_argument("--lufs", type=float, default=-16)
ap.add_argument("--no-audio", action="store_true")
ap.add_argument("--voice-audio", help="mux an existing scene dialogue clip over the Studio's procedural drawing Foley")
ap.add_argument("--episode-spec", help="frozen JSON scene plan to inject into the Studio renderer")
ap.add_argument("--log-out", help="write the exact renderer operation log as JSON")
a = ap.parse_args()


async def main():
    ensure_built(a.episode_spec)
    out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="fr-export-"))
    base = start_server()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg, errors = await open_studio(b, base, scene=a.scene, export=True)
        fonts = await pg.evaluate("[document.fonts.check('600 20px \"Shantell Sans\"'), document.fonts.check('14px \"IBM Plex Mono\"')]")
        if not all(fonts):
            print("warning: web fonts did not load; subtitles and the end card will use fallback fonts", file=sys.stderr)
        end = a.end or await pg.evaluate("window.__dl.SCRIPT_END()")
        if not a.no_audio or a.voice_audio:
            r = await pg.evaluate("window.__dl.renderAudio(48000)")
            (tmp / "audio.wav").write_bytes(base64.b64decode(r["b64"]))
            print(f"audio: {r['dur']:.1f}s, raw peak {r['peak']:.2f}, {r['voices']} voice lines", flush=True)
        if a.log_out:
            pathlib.Path(a.log_out).write_text(json.dumps(await pg.evaluate("window.__dl.dump()"), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        n = int((end - a.start) * a.fps)
        ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(a.fps), "-c:v", "mjpeg", "-i", "-",
                               "-c:v", "libx264", "-preset", "veryfast", "-crf", str(a.crf), "-pix_fmt", "yuv420p", str(tmp / "video.mp4")],
                              stdin=subprocess.PIPE)
        t0 = time.time()
        for i in range(n):
            await pg.evaluate(f"window.__dl.seek({a.start + i / a.fps})")
            ff.stdin.write(await pg.screenshot(type="jpeg", quality=93, clip={"x": 0, "y": 0, "width": 1280, "height": 720}))
            if i % (a.fps * 10) == 0:
                print(f"frame {i}/{n} ({time.time() - t0:.0f}s)", flush=True)
        ff.stdin.close(); ff.wait()
        await b.close()
    if errors:
        print("page errors:", errors, file=sys.stderr)
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(tmp / "video.mp4")]
    if a.voice_audio:
        spec = json.loads(pathlib.Path(a.episode_spec).read_text(encoding="utf-8")) if a.episode_spec else {}
        mix = spec.get("soundMix") or {"drawingFoleyGainDb": -10, "dialogueGainDb": 0}
        foley_gain = 10 ** (float(mix.get("drawingFoleyGainDb", -10)) / 20)
        dialogue_gain = 10 ** (float(mix.get("dialogueGainDb", 0)) / 20)
        cmd += ["-ss", str(a.start), "-i", str(tmp / "audio.wav"), "-ss", str(a.start), "-i", str(pathlib.Path(a.voice_audio).resolve()),
                "-filter_complex", f"[1:a]volume={foley_gain:.6f}[foley];[2:a]volume={dialogue_gain:.6f}[dialogue];[foley][dialogue]amix=inputs=2:duration=longest:dropout_transition=1,loudnorm=I={a.lufs}:TP=-1.5:LRA=11[mix]",
                "-map", "0:v:0", "-map", "[mix]", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest"]
    elif not a.no_audio:
        cmd += ["-ss", str(a.start), "-i", str(tmp / "audio.wav"), "-af", f"loudnorm=I={a.lufs}:TP=-1.5:LRA=11",
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest"]
    cmd += ["-c:v", "copy", "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)
    print(f"wrote {out} ({out.stat().st_size / 1e6:.1f} MB, {n / a.fps:.1f}s)")


asyncio.run(main())
