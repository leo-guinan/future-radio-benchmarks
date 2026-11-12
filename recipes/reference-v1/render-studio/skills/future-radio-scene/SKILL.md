---
name: future-radio-scene
description: Author or extend a scene in the Future Radio studio engine — scene-log events, frames, characters, outfits, instruments like the quill, ink writing, camera keyframes, subtitles — and register it in the page. Use when writing a seed function, adding an op, template or instrument, or debugging staging.
---

# Authoring a Future Radio scene

Read `docs/engine.md` first. It has the coordinates, the ops table and the hooks. `scene-template.js`, next to this file, is a commented starting point.

## Rules of the grammar

- **Everything that happens is an event in the log.** The renderer, audio and tests only read the log. Never draw something that isn't in state, and never mutate state outside `apply()`.
- **Every action is checked.** Use `emitChecked(ev)` or `invoke(...)`. If an action should fail in the story, let the check deny it. The denial is logged, drawn as a red ✕ and heard as a thunk. Don't fake it.
- **Characters construct the world.** Props that exist before the scene are set dressing (`add({t:-1,actor:'—',prov:'set',hide:true,…})`). Anything that appears *during* the film is drawn by someone with a capability.
- **Identity, role and capability are separate.** A new character starts with `['EQUIP','UNEQUIP']` and gains abilities only by wearing an outfit whose role grants them.
- **Instruments act on commands, not steering.** The quill awakens, receives a `COMMAND`, then emits its own events. A semantic artifact (text and history) and a visual artifact (strokes) are always written together. The text is read back from the log.
- **The real world is out of reach.** `DISPATCH` is always denied, and `RECEIVE{reply:true}` is denied unless something was dispatched. Keep it that way.

## Writing a seed

```js
function seedMyScene(){setupStudio();/* set dressing */;const P='scripted';SUBS.length=0;LCAM=[];
  const say=(t,who,line,file,d)=>{SUBS.push([t,t+d+.15,who,line,'myscene/'+file+'.mp3']);return t+d};
  let t=.8;LCAM.push([0,.95,640,330]);                       // wide on Leonardo at his desk
  t=say(t,'LEONARDO','Let’s make a bell.','v01',1.6)+.2;
  let e=emitChecked({t,dur:2.6,actor:'leonardo',op:'FRAME',target:'F1',frame:'studio',
    args:{id:'F1',name:'wall frame',x:700,y:64,w:190,h:228,lw:400,lh:480},prov:P,cost:'—',out:'Leonardo frames a corner of the wall.'});
  FR=frameDefs();t+=e.dur+.3;                                // refresh frames after creating one
  const r=invoke('leonardo',[{op:'INSCRIBE',template:'bell',in:'F1',at:[200,240]},{op:'ANIMATE',target:'bell',behavior:'ring'}],t,P);t=r.t;
  LCAM.push([t,1.6,790,180]);
  SCRIPT_END=Math.ceil(t+3);LCAM.push([SCRIPT_END+30,1.6,790,180]);LCAM.sort((a,b)=>a[0]-b[0]);FR=frameDefs()}
```

To register the scene:
1. `41-scenes.js`: add a branch to `seed()`.
2. `90-ui.js`: add a `SCENE_COPY[name]` entry with the heading, eyebrow and lede.
3. `shell.html`: add an `<option>` to `#scene`.
4. `50-render.js`: in `camAt`, return `letterCam(t)` (which reads `LCAM`) for your scene, or write your own camera.
5. If the scene ends on a card, set `LETTER_END_CARD` and make sure `render` draws it for your scene.

Rebuild with `python3 studio/build.py`.

## Staging checklist

- **Frames**: give explicit `x,y,w,h` in parent units and a local size. The sheet of paper is `PAPER_L`, 200×280 world (400×560 local). Use `border:'single'` for paper and envelopes. A frame on the desk uses `frame:'desk'` and desk-local coordinates.
- **Durations**:
  - Pencil drawings take `measure(strokes).total*scale/150` s, clamped to 1–4 s (or set `dur`).
  - Ink takes `inkDur(tpl)`.
  - Gestures need `args.point` in the event's frame, or the tool stays put.
- **Choreography**: one actor can't do two things at once. Overlapping events of the same actor, or gaps under about 0.5 s over long distances, make the tip jump. Another actor *can* act in parallel.
- **Ink**:
  - Lay the text out with `layoutText` and check `missing` (glyphs) and `overflow` before scheduling.
  - The script glyph set covers ASCII letters, digits and punctuation. `—` and `–` are synthesized, and curly quotes map to straight ones.
  - In a 1280×720 close-up the x-height should be at least 10 px. That is `9 × size × frameScale × zoom`.
- **Camera**:
  - Keyframes are `[t, zoom, cx, cy]`. Hold a shot with two keys and move between holds over at least 0.6 s.
  - In a writing close-up, follow the line: `writeCam(evs)`.
  - Check every beat with `tools/stills.py`.
- **Subtitles**: `[t0,t1,who,line,file]`. Durations come from `prep_voice.py`. Keep the speaker label short.

## Adding behaviour

- **New template**: add it to `TPL` in `00-core.js` (or next to its feature) with `strokes` (polylines in local units, drawn in order), optional `fills`, `pivot`, `light` and `behaviors`. Strokes get a coherent wobble unless `kind:'ink'`.
- **New op**:
  1. Add the check (in `checkGrammar`/`checkCommand`, or in `check` for characters).
  2. Add the state change in `apply` (or `applyGrammar`).
  3. Add the capability to the right list (`ALL_CAPS`, a role, or `INSTRUMENTS[x].caps`).
  4. Add any sound to `observations()`.
  5. Write a test that the op is denied when it should be.
- **New instrument**: add an `INSTRUMENTS` entry (agency, domain, caps, withheld, boundary, persistence, cost), a template with `kind:'instrument'`, a pose function driven by its own events, a draw pass and a lifecycle.
- After any engine change, run `python3 tools/run_tests.py --build`. All suites must still pass, including the older scenes.
