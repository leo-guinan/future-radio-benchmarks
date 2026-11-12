#!/usr/bin/env python3
"""Prepare voice-over takes for a scene: trim silence, normalize loudness, write WAV + MP3, and report
durations to use as subtitle lengths in the scene script.

    python3 tools/prep_voice.py raw/v01.mp3 raw/v02.mp3 ... --out studio/public/letter --lufs -18

Writes <out>/<name>.wav, <out>/<name>.mp3 (mono, 128k) and <out>/durations.json, and prints
lines like   say(t,'WHO','…','v01',2.24)   so durations go straight into the scene's seed function.
The page plays the .mp3; the .wav is kept for offline mixing.
"""
import argparse, json, pathlib, subprocess

ap = argparse.ArgumentParser()
ap.add_argument("inputs", nargs="+")
ap.add_argument("--out", required=True)
ap.add_argument("--lufs", type=float, default=-18)
ap.add_argument("--pad", type=float, default=0.04, help="silence kept at each end, seconds")
a = ap.parse_args()
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
durs = {}
trim = (f"silenceremove=start_periods=1:start_threshold=-45dB:start_silence={a.pad},"
        f"areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence={a.pad},areverse,"
        f"loudnorm=I={a.lufs}:TP=-1.5:LRA=11")
for src in a.inputs:
    name = pathlib.Path(src).stem
    wav, mp3 = out / f"{name}.wav", out / f"{name}.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "48000", "-af", trim, str(wav)], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "128k", str(mp3)], check=True)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)],
                             check=True, capture_output=True, text=True).stdout)
    durs[name] = round(d, 2)
    print(f"say(t,'WHO','…','{name}',{durs[name]})")
(out / "durations.json").write_text(json.dumps(durs, indent=2))
