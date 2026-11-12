---
name: future-radio-video
description: Make a Future Radio short film (Leonardo's hand-drawn studio, where characters construct the world through a scene log) from a brief or script, through to a tested interactive page and an MP4. Use when asked to make, extend or export a Future Radio scene or video.
---

# Future Radio video: brief → scene → MP4

A Future Radio film is a **scene log**: an executable screenplay of checked operations (FRAME, INSCRIBE, ANIMATE, COMMAND…) played by one renderer and one audio engine. You don't animate pictures. You write events, and the world is folded from them. The page in `studio/` is the film, the inspector and the test suite at once. The MP4 is a frame-exact capture of it.

Read `docs/engine.md` before writing a scene. The briefs that defined the grammar are in `docs/specs/`.

Related skills:
- **future-radio-scene**: how to author events, frames, instruments and camera, and add a scene.
- **future-radio-sound**: voices and Foley with ElevenLabs, and the prep tools.

## Workflow

1. **Read the brief and list its hard constraints.** Copy every *must* and *must not* into a checklist, and turn each acceptance criterion into a test you will write (step 6). Ethical and real-world constraints become checks in the engine, not just narration. For the letter, those were "no external send", "a command doesn't authorize delivery" and "a radio sound isn't a reply".
2. **Budget the time before writing code.** Tabulate the beats: voice lines (real durations come from `prep_voice.py`), actions, and writing time. A target such as 75–90 s rules out most first drafts. Ways to fit:
   - Overlap actions with dialogue. One actor can act while another speaks: the quill bows while Leonardo draws the paper.
   - Start the next beat 0.3–0.5 s before a line ends.
   - Keep gaps of 0.2–0.4 s.
   - Speed up ink (`WRITE_V`) only as a last resort.
   - Writing time grows with text length × glyph size ÷ speed, plus about 0.04 s per stroke, plus word pauses. Measure it with a quick layout run before staging.
3. **Generate the voices and Foley** (future-radio-sound). Prep them into `studio/public/<scene>/` and paste the reported durations into the seed.
4. **Author the scene** (future-radio-scene): a `seedX()` that builds the log through `emitChecked`, `invoke` or the helpers, plus camera keyframes, `SUBS` and `SCRIPT_END`. Register it in the scene picker.
5. **Build and look**:
   ```bash
   python3 studio/build.py
   python3 tools/stills.py --scene <name> --every 4 --out stills/ --log
   ```
   Open `stills/contact.png`. Check the framing at every beat, that text is legible in close-ups, that nothing is cropped or hidden behind the desk, and that subtitles don't cover the action. Then use `--debug` to see tool tips and stroke boundaries.
6. **Test.** Add scene tests next to the existing ones (`91-letter-tests-panel.js` shows the pattern). At minimum:
   - Each acceptance criterion as an assertion against `stateAt`, the log or the plans.
   - The tool tip never jumps. Sample at 240 Hz and require under 9 px per step.
   - Ink or line appears exactly under the tip, with a gap under 1e-6.
   - Deterministic replay: reseeding gives an identical log, and schedule-order and time-order folds match with 0 mismatches.
   - The scene length is inside the target.
   - The earlier demos still pass.
   Then run:
   ```bash
   python3 tools/run_tests.py --build
   ```
   It exits non-zero on any failure.
7. **Export.**
   ```bash
   python3 tools/export_mp4.py --scene <name> --out out/<name>.mp4
   ```
   This gives 1280×720 at 30 fps with audio from the page's engine, normalized to −16 LUFS. Pull 5–6 stills from the MP4 with ffmpeg and look at them before sending.
8. **Publish.** Publish `dist/index.html` as an artifact, with every file under `dist/foley/` and `dist/<scene>/` in the `files` map. Declare `capabilities: {sample:{}, downloads:true}`: the instruction desk uses `sample`, and the letter panel saves files through `downloads`. Send the MP4 as a file.

## Lessons that cost time before

- **Overlapping tasks make the tool teleport.** Each actor's pose is derived from its own events. If two events of the same actor overlap, or there's a gap under about 0.5 s across a long distance, the tip jumps. Make gesture durations end before the next task, as in `dur: tNext - 0.8 - tStart`. The continuity test catches this.
- **Long reaches need gaps.** A quill going from the paper top to the inkwell (about 440 px) needs at least 0.5–0.7 s of travel, or a return to hover (gap over 1.6 s).
- **Serve with a UTF-8 charset.** Source files contain literal characters such as `—` and `’`. A server without a charset (or `file://`) decodes them as Latin-1, and glyph lookups fail. `tools/common.py` handles this.
- **"Sounds like ink, not spray" is measurable.** Check spectral flatness against white noise (lowpass the nib and the ticks), the level during word gaps against contact (more than 12 dB quieter), and how much the loudness envelope moves (steady noise is near 0.02).
- **Mix headroom.** Several voices plus Foley can exceed 0 dBFS. `renderAudio` scales the mix down to 0.89 peak before export.
- **Keep the meaning honest on screen.** If the story implies something that hasn't happened in the real world, such as a letter being sent or a reply arriving, the log must say otherwise (`reply:false`, external `'not sent'`), and so should the end card or captions.
- **Don't fork the engine per film.** New behaviour goes in as a new op, template or instrument with its own checks and tests, so every scene keeps working. Run all suites after every change.
