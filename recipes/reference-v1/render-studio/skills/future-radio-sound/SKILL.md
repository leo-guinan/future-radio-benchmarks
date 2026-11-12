---
name: future-radio-sound
description: Create and prepare the sound for a Future Radio scene — character voice lines and Foley (pencil, nib, ink dip, paper, radio) generated with ElevenLabs, cut into loops, grains and one-shots, wired into the geometry-driven audio engine and verified offline. Use when a scene needs dialogue, new instrument sounds, or audio fixes.
---

# Sound for Future Radio

There are two kinds of sound, and they are kept apart on purpose:

- **Construction Foley** follows the visible action. It is driven by the stroke plan: contact edges give touch-down and lift grains, and a loop's gain and filter follow tip speed, curvature, pressure and stroke direction. It never plays on a timer of its own.
- **Observations** have their own time in the log: a bell heard from inside a frame, a radio signal, an ink dip, a fold. A sound can be heard before or after its visual cause (`PROPAGATE.args.arrive`). An observation is never evidence that something happened in the real world.

Voice-over is a third layer, scheduled from `SUBS`.

## Voices (ElevenLabs connector)

1. Use `creative_list_voices` to pick a voice per character, then write the ids into `studio/public/<scene>/voices.json`. Reuse the same voice for Leonardo and Agnolo across films. Never invent a voice id.
2. Use `creative_generate_speech` (model `eleven_v4`) for one call per line. Keep the default two takes. Write the line exactly as in the script. For stage directions, use the model's own audio tags rather than punctuation tricks.
3. Poll `creative_get_flow_run_status`, download the takes with curl into `raw/`, listen or compare durations, and choose one take per line.
4. Prep the chosen takes:
   ```bash
   python3 tools/prep_voice.py raw/v01.mp3 raw/v02.mp3 … --out studio/public/<scene> --lufs -18
   ```
   It trims the silence, normalizes, and writes `.mp3` (played by the page), `.wav` and `durations.json`. It also prints `say(...)` stubs with real durations.
5. Agnolo, or anyone speaking *through the radio*, gets a speaker label starting with `AGNOLO`. The engine then band-limits the voice (320 Hz–3.6 kHz) and pulses the radio dial.

## Foley (ElevenLabs sound effects)

Generate with `creative_generate_in_flow` using the sound node (`eleven_text_to_sound_v2`). It defaults to several takes, so pick one. Describe the physical event and the room, and ban what you don't want. Prompts that worked:

| Material | Prompt sketch | Prep |
|---|---|---|
| pencil drag loop | close-miked graphite pencil drawing a long steady line on drawing paper, dry friction, no music | `loop --seconds 1.5` |
| heavy pencil loop | pencil pressed hard shading on paper, gritty, steady | `loop --seconds 1.5` |
| pencil taps | pencil tip tapping paper, separate light taps, quiet room | `grains --count 8 --length 0.09` |
| nib friction loop | steel dip-pen nib writing cursive on cotton paper, soft scratch, close, no music | `loop --seconds 1.7` |
| nib ticks | nib touching paper, tiny soft contacts, sparse | `grains --count 10 --length 0.063` |
| ink dip | dip pen nib dipped into a small glass inkwell, barely audible liquid touch | `oneshot --max 0.6` |
| feather lift | a quill feather lifting off paper, light paper rustle, no magic sparkle | `oneshot --max 1.6` |
| letter fold | a sheet of paper folded in thirds and slid into an envelope | `oneshot --max 1.8` |

```bash
python3 tools/prep_foley.py loop raw/nib1.mp3 -o studio/public/letter/nib.wav --seconds 1.7
python3 tools/prep_foley.py grains raw/ticks.mp3 -o studio/public/letter/ticks.wav --count 10 --length 0.063   # + ticks.json
python3 tools/prep_foley.py oneshot raw/fold1.mp3 -o studio/public/letter/fold.wav --max 1.8
```

Prepping a loop does three things:
1. Picks the steadiest stretch of the take.
2. Flattens the slow loudness envelope with a 60 ms RMS divide. The engine supplies the dynamics, so a loop with its own swells sounds like gestures that aren't on screen.
3. Crossfades the seam.

## Wiring a new sound

- **Continuous contact for a new tool:** add a voice in `makeEngine` (copy `inkVoice`) and, in `eng.schedule`'s 10 ms loop, compute gain, cutoff and rate from the tool's pose at `s ± step/2`. Keep it at exactly 0 when the tool is off the paper.
- **Touch-down and lift:** these already come from `edgesAll()` for every planned stroke. Use a quieter grain when the previous travel is under 2 units, because joined strokes in cursive shouldn't click.
- **Event sounds:** add a kind in `observations()` (which op, at what time) and play it in `schedule` with `eng.shot(map(t), buffer, gain)`. Add the file to `loadInk` or a new loader, with a synthesized fallback.
- **Radio and other signals:** keep them abstract, like filtered static or a faint tone. Never put a voice in a signal unless the log contains a received message.

## Verify offline

The tests render audio through `OfflineAudioContext` with the same engine and measure it. Existing checks:
- The pencil is silent off the paper (more than 18 dB down).
- Pencil texture isn't hiss (flatness under 0.35 × white noise).
- Short marks are less sustained than long lines.
- There is one grain per edge.
- Ink: flatness is under 0.35 × noise, word gaps are more than 12 dB below contact, the envelope modulation is over 0.3 (steady noise is about 0.02), and there is one tick per stroke.

Add a check for every new material. `tools/export_mp4.py` uses `__dl.renderAudio()`, so what the tests measure is what ends up in the MP4. The mix is scaled to 0.89 peak and then loudness-normalized to −16 LUFS on mux.
