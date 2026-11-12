#!/usr/bin/env python3
"""Turn raw sound-effect takes (e.g. ElevenLabs text-to-sound) into the three kinds of material
the audio engine plays.

  loop     A seamless loop for continuous contact texture (pencil drag, nib friction). The engine
           ramps its gain and filter from the stroke geometry, so the loop itself must be steady:
           the slow loudness envelope is flattened, then the seam is crossfaded.
               prep_foley.py loop raw/nib1.mp3 -o studio/public/letter/nib.wav --seconds 1.7
  grains   Short contact transients (pencil taps, nib touch-downs) cut from a take full of them,
           laid end to end, with a JSON list of [offset, duration] the engine indexes into.
               prep_foley.py grains raw/ticks.mp3 -o studio/public/letter/ticks.wav --count 10 --length 0.063
  oneshot  A single event sound (ink dip, feather lift, paper fold): trimmed, faded, peak-normalized.
               prep_foley.py oneshot raw/fold.mp3 -o studio/public/letter/fold.wav --max 1.8

Input can be anything ffmpeg reads. Output is 48 kHz mono 16-bit WAV.
"""
import argparse, json, pathlib, subprocess, wave
import numpy as np

SR = 48000


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def save(path, x):
    path = pathlib.Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    w = wave.open(str(path), "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()


def rms_env(x, win):
    k = np.ones(win) / win
    return np.sqrt(np.convolve(x * x, k, mode="same") + 1e-12)


def trim(x, db=-45, pad=0.01):
    e = rms_env(x, int(0.01 * SR)); on = np.where(e > e.max() * 10 ** (db / 20))[0]
    if not len(on):
        return x
    a, b = max(0, on[0] - int(pad * SR)), min(len(x), on[-1] + int(pad * SR))
    return x[a:b]


def loop(x, seconds, xfade=0.08, target_db=-14):
    x = trim(x)
    n, f = int(seconds * SR), int(xfade * SR)
    if len(x) < n + f:
        raise SystemExit(f"take is too short for a {seconds}s loop")
    # the steadiest stretch: least variation in short-term loudness
    e = 20 * np.log10(rms_env(x, int(0.05 * SR)))
    best, start = None, 0
    for s in range(0, len(x) - n - f, int(0.05 * SR)):
        v = np.std(e[s:s + n + f])
        if best is None or v < best:
            best, start = v, s
    seg = x[start:start + n + f]
    seg = seg / rms_env(seg, int(0.06 * SR)) * 10 ** (target_db / 20)      # flatten the slow envelope
    body, tail = seg[:n].copy(), seg[n:]
    w = np.sin(np.linspace(0, np.pi / 2, f)) ** 2                          # equal-power seam
    body[:f] = body[:f] * w + tail * (1 - w)
    return body / max(1, np.abs(body).max() / 0.95)


def grains(x, count, length, gap=0.02):
    x = trim(x)
    e = rms_env(x, int(0.004 * SR)); d = np.diff(e, prepend=e[0])
    L, refractory = int(length * SR), int(length * SR * 1.2)
    order = np.argsort(-d)
    picks = []
    for i in order:
        if e[i] < e.max() * 0.15:
            continue
        if all(abs(i - p) > refractory for p in picks) and i + L < len(x):
            picks.append(int(i))
        if len(picks) == count:
            break
    picks.sort()
    out, offs = [], []
    fade = np.ones(L); fl = int(0.003 * SR); fade[:fl] = np.linspace(0, 1, fl); fade[-int(L * .4):] = np.linspace(1, 0, int(L * .4))
    t = 0.0
    for p in picks:
        g = x[max(0, p - int(0.002 * SR)):max(0, p - int(0.002 * SR)) + L] * fade
        g = g / (np.abs(g).max() + 1e-9) * 0.8
        offs.append([round(t, 4), round(length, 4)])
        out += [g, np.zeros(int(gap * SR))]; t += length + gap
    return np.concatenate(out), offs


def oneshot(x, max_s, fade=0.15):
    x = trim(x)[: int(max_s * SR)]
    f = min(int(fade * SR), len(x) // 3)
    x[-f:] *= np.linspace(1, 0, f)
    return x / (np.abs(x).max() + 1e-9) * 0.7


ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
ap.add_argument("mode", choices=["loop", "grains", "oneshot"])
ap.add_argument("input")
ap.add_argument("-o", "--out", required=True)
ap.add_argument("--seconds", type=float, default=1.5, help="loop length")
ap.add_argument("--count", type=int, default=10, help="grains to cut")
ap.add_argument("--length", type=float, default=0.063, help="grain length in seconds")
ap.add_argument("--max", type=float, default=2.0, help="one-shot maximum length")
a = ap.parse_args()
x = load(a.input)
if a.mode == "loop":
    y = loop(x, a.seconds); save(a.out, y)
elif a.mode == "grains":
    y, offs = grains(x, a.count, a.length); save(a.out, y)
    pathlib.Path(a.out).with_suffix(".json").write_text(json.dumps(offs))
    print(f"{len(offs)} grains → {pathlib.Path(a.out).with_suffix('.json')}")
else:
    y = oneshot(x, a.max); save(a.out, y)
print(f"wrote {a.out} ({len(y) / SR:.2f}s)")
