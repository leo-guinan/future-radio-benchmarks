# Future Radio Studio

This is the engine, tools and Claude skills for making **Future Radio** films. In these hand-drawn scenes, characters construct the world around them. Each film is an executable scene log: checked operations such as `FRAME`, `INSCRIBE`, `ANIMATE`, `EQUIP` and `COMMAND`, folded into world state and played by one renderer and one audio engine. The same page is the film, an inspector (scene log, world tree, letter panel), a live instruction desk, and a test suite. MP4s are frame-exact captures of it.

Scenes included:

- **The Letter to DHH** (88 s). Leonardo draws an enchanted quill. The quill takes a command and writes a sponsorship letter in ink, then addresses and folds it. The letter is prepared, never sent: sending needs a separate human decision outside the scene.
- **Leonardo Draws Leonardo**. Nested frames, independent actors, and capabilities as outfits.
- **Diagnostic**. Stroke and audio checks.
- `legacy/the-first-line/`. The first cold-open demo, as a standalone page with its own export scripts.

## Quick start

```bash
pip install playwright numpy pillow && python3 -m playwright install chromium   # ffmpeg must be on PATH
python3 studio/build.py                         # → dist/index.html + audio
python3 tools/serve.py                          # preview at http://127.0.0.1:8765/index.html
python3 tools/run_tests.py                      # 39 tests: letter, nested actors, renderer, audio
python3 tools/stills.py --scene letter --every 6 --out stills/
python3 tools/export_mp4.py --scene letter --out out/the-letter-to-dhh.mp4
```

## Layout

```
studio/
  shell.html            page markup and styles
  src/*.js              the engine, concatenated in order (see docs/engine.md)
  data/                 script glyphs (Hershey Script 1-stroke, public domain)
  public/               audio the page fetches: foley/, letter/ (voices, nib, ticks, dip, lift, fold)
  build.py              → dist/
tools/
  serve.py              UTF-8 static server for previews
  run_tests.py          headless test run, non-zero exit on failure
  stills.py             stills and a contact sheet at chosen times, optional debug overlay and log dump
  export_mp4.py         video from the renderer + audio from the page's own engine, muxed at −16 LUFS
  prep_voice.py         trim, normalize and convert voice takes; report durations for subtitles
  prep_foley.py         make seamless loops, contact grains (+ offsets JSON) and one-shots from raw SFX takes
skills/
  future-radio-video/   end-to-end: brief → budget → sound → scene → tests → stills → MP4 → publish
  future-radio-scene/   authoring events, frames, instruments, ink, camera; adding ops and scenes
  future-radio-sound/   ElevenLabs voices and Foley, prep, wiring into the audio engine, offline checks
docs/
  engine.md             engine reference: coordinates, events, ops, artifacts, sound, hooks
  specs/                the briefs that defined the grammar (Visual Grammar, Object Grammar, scene specs)
```

## Using the skills

Each folder under `skills/` is a Claude skill: a `SKILL.md` with frontmatter, plus references. Add them to Claude as account skills, or point Claude at this repo and ask it to follow `skills/future-radio-video/SKILL.md`. They assume this repo layout and the ElevenLabs connector for new voices and sounds.

## Publishing the page

Publish `dist/index.html` as a Claude artifact, with every file under `dist/foley/` and `dist/letter/` as supporting files. Declare `capabilities: {sample: {}, downloads: true}`:
- `sample` lets the instruction desk ask Claude for construction plans.
- `downloads` lets the letter panel save drafts and images.

## Credits and licences

- Voices and Foley are AI-generated with ElevenLabs.
- The script glyphs are from the Hershey fonts (public domain), via the hersheytext data (MIT).
- Fonts are Shantell Sans and IBM Plex, loaded from Google Fonts.
