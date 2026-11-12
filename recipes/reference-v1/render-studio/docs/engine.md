# Engine reference

The studio is one HTML page. Everything that happens in a film is an **event in the scene log**. World state at time `t` is a pure fold over the log, `stateAt(t)`. The fold re-runs every capability check, so replaying a log reproduces the same permissions and denials. The renderer and the audio engine only *read* the log. Video export, live playback and the tests therefore all see the same film.

Source is in `studio/src/`, concatenated in file-name order by `studio/build.py`:

| File | What's in it |
|---|---|
| `00-core.js` | math helpers, stroke geometry (`Lp`, `El`, `Ci`, `RR`, `Qb`, `Poly`), the template library `TPL`, outfits and roles, coherent wobble |
| `10-log-plans-frames.js` | `LOG`/`add()`, stroke plans (`planOf`, `evalPlan`), frames and coordinate transforms (`frameDefs`, `toWorld`, `worldTo`, `frameScale`) |
| `20-state-choreography.js` | `check()` / `apply()` / `stateAt()`, pencil choreography (`pencilState`), placement, `invoke()` |
| `30-object-grammar.js` | instruments (pencil, quill, radio), ink writing (`layoutText`, `inkPlan`, pointed-nib ribbons), the quill's pose, checks and state for `COMMAND`, `REVISE`, `COMPOSE`, `RECEIVE`, `DISPATCH` |
| `40-scene-letter.js` | `emitChecked()`, the letter helpers (`writeBody`, `writeAddress`, `foldInto`…), `seedLetter()`, `reviseLetter()`, the letter camera, end card, `exportArtifact()` |
| `41-scenes.js` | `SUBS`, `SCRIPT_END`, `SCENE`, `setupStudio()`, `seedMain()`, `seedDiag()`, `seed()` |
| `50-render.js` | drawing, `camAt()`, `render(t)` |
| `60-audio.js` | Foley loading, contact edges, observations, `makeEngine()` (live and offline), realtime scheduler |
| `70-planner.js` | viewer instructions → ops (built-in planner, Claude planner sanitizer) |
| `80-tests-debug.js` | nested-actor acceptance tests, renderer tests, offline pencil-audio tests, debug overlay |
| `90-ui.js` | log panel, world tree, transport, scene picker (`SCENE_COPY`), instruction desk |
| `91-letter-tests-panel.js` | letter tests, offline ink-audio test, the letter panel |
| `99-start.js` | startup, `window.__dl` hooks |

## Coordinates

- **World**: the studio frame, 1280×720. The back wall is roughly x 380–900, y 20–390. The lamp hangs at x 600.
- **Desk**: a *surface frame* whose origin is world (420, 300), 450×260 local units. Things on the desk use `frame:'desk'` and stand on its top edge, at local y ≈ 134. The set dressing is the mic at desk-local x ≈ 291–325 and the radio at ≈ 370–464, whose dial is `RADIO_AT = [392,106]`.
- **Leonardo** stands at world (600, 418), feet on the floor line.
- **Frames** are axis-aligned rectangles placed in their parent's coordinates (`x,y,w,h`), each with its own local size (`lw,lh`). A frame's scale is `w/lw`. A 200×280 sheet with `lw:400,lh:560` has a scale of 0.5. Anything inside uses local coordinates and moves when the frame moves (`ALTER {move}`).

## Events

```js
{t, dur, actor, op, target, frame, args, prov, cost, out, hide?}
```

- `t`, `dur`: scene seconds.
- `frame`: the frame the action happens in.
- `prov`: provenance, such as `'scripted'`, `'set'`, `'test'` or a viewer instruction.
- `out`: the one-line narration shown in the log.
- `hide`: keeps set dressing out of the log panel.
- `result` (`'ok'` or `'denied'`) and `reason` are filled in by the check.

Emit events through the checked paths:

- `emitChecked(ev)` adds one event, checks it against the state just before `ev.t`, and marks it denied with a reason if the check fails.
- `invoke(actorId, ops, t0, prov)` turns high-level ops into checked events. It handles placement, ids, durations, and the PROPAGATE that follows a ring. Use it for pencil construction where you don't care about exact coordinates.
- `add(ev)` adds an event **without a check**. Use it only for set dressing at `t:-1` with `actor:'—'`, as `setupStudio` and `letterProps` do.

## Operations

| op | actor | meaning |
|---|---|---|
| `FRAME` | character | Constructs a nested frame. args: `id,name,x,y,w,h,lw,lh`, plus optional `surface,z:'front',border:false|'single',flap,paper` (fill colour). |
| `INSCRIBE` | character or instrument | Draws a template into a frame. args: `id,tpl,name,at,scale`. A `tpl` can be a `TPL` key or an inline template. A `kind:'character'` template makes a new actor. `kind:'outfit'` makes a wearable. `kind:'instrument'` makes a tool such as the quill. `kind:'ink'` is writing. |
| `ANIMATE` | character, instrument, or a drawing animating itself | Gives behaviour. Template behaviours: `ring,glow,sway,drift,swim,twinkle,spin,flicker`. Character: `wake`. Instrument: `awaken` (args `hover`). Gestures with `args.point` move the actor's tool there: `bow,attend,ink-dip,turn,examine`, plus `tilt,dip`. |
| `ALTER` | character | `{move:[dx,dy]}` moves a frame and everything in it. `{move,scale:[sx,sy],tuck:true}` folds a sheet (it is hidden when the fold finishes). `{attach:charId}` picks up an object. |
| `EQUIP` / `UNEQUIP` | character | Puts on or takes off an outfit. The outfit's role grants capabilities only while it is worn. |
| `PROPAGATE` | object | A sound leaving its frame. `args.arrive` delays when it is heard, so an observation's time can differ from its cause's. |
| `COMMAND` | character → instrument | Requires `instrument, recipient, intent, context, constraints, output_frame, approval_required, artifact`. Creates the artifact. It **does not** authorize delivery. |
| `REVISE` | character → instrument | Starts a new artifact version: `artifact, version (= current+1), text, recipient, output_frame`. |
| `COMPOSE` | character | Combines the letter and envelope into prepared correspondence. Allowed only when the letter is written and addressed. |
| `RECEIVE` | radio | An observation. `reply:true` is **denied** unless the artifact was dispatched. |
| `DISPATCH` | anyone | **Always denied.** External delivery needs separate human authorization outside the scene. |

Capabilities:

- Characters get theirs from `caps`, plus the roles of the outfits they wear (`capsOf`).
- Instruments get theirs from `INSTRUMENTS[name].caps`.
- Every check also enforces reach: an actor can only act in its own frame and the frames nested inside it.

## Instruments and artifacts

- **Instrument lifecycle**: constructed → activated (`awaken`) → commanded → executing → completed (`lifecycleOf`). An instrument's pose comes from its own events (`quillPose`): hover, approach, write, travel, return, and gestures.
- **Artifacts** (`S.artifacts[id]`) hold the recipient, purpose, authorizing character, versions (each with its commanded text, written lines and address), history, and two independent states:
  - `status` is the in-scene state: requested → writing → drafted → reviewed → addressed → prepared.
  - `correspondence` is none or one of `DRAFTED · APPROVED · DISPATCHED · DELIVERED · REPLIED`. Only DRAFTED can be reached inside a scene.
  - `external` is always `'not sent'`.
- **Writing**:
  - `layoutText` lays out every line before writing starts, so text never runs off the page.
  - Strokes are Hershey Script single-stroke glyphs, smoothed. Joined cursive strokes merge into one so the nib doesn't lift inside a word.
  - One `INSCRIBE` per line, with `args.write = {artifact, version, line, text, field:'body'|'address'|'illustration'|'flourish', final}`.
  - Timing is proportional to ink length (`WRITE_V` page units per second), plus short pauses before words and between strokes.

## Time, camera, voice

- `SUBS` entries are `[t0, t1, who, line, file?]`. A file such as `'letter/v01.mp3'` is played by the audio engine at `t0`. Speakers whose name starts with `AGNOLO` go through the radio filter. An empty `who` gives a plain caption.
- `SCRIPT_END` is the scene length. Set it at the end of the seed.
- Camera: `camAt(t)` returns `[zoom, cx, cy]` in world units. The letter scene interpolates keyframes `LCAM = [[t, zoom, cx, cy], …]`, sorted, with easing. A close-up at zoom 3.6 shows 355×200 world units.
- `render(t)` is a pure function of `t`. It fades in from black over the first 0.8 s and draws the end card from `LETTER_END_CARD`.

## Sound

- **Construction Foley** follows the geometry:
  - Contact edges (`edgesAll`) give pencil-down, pencil-up and corner grains.
  - A continuous loop is ramped every 10 ms from tip speed, curvature, pressure and contact.
  - The quill uses `letter/nib.wav` and `letter/ticks.wav` (softened by a lowpass), with gain following nib speed and downstroke direction.
- **Observations** are scheduled by their own times: bells, ink dips, feather lift, paper fold, the radio carrier, and denial thunks.
- **Voice-over** comes from `SUBS`.
- The same `makeEngine()` runs live (lookahead scheduler on the audio clock) and offline (`OfflineAudioContext`, used by the tests and by `__dl.renderAudio()` for export).

## `window.__dl` hooks (used by tools/)

- `seek(t)`: renders time `t`.
- `setScene(name)`, `SCRIPT_END()`, `dump()` (the log as rows), `LOG()`, `stateAt(t)`, `setDebug(bool)`.
- `renderAudio(sampleRate)` returns a base64 16-bit stereo WAV, plus its peak and duration.
- `run(text)` applies a viewer instruction.
- `letter.{exportArtifact, reviseLetter, quillPose, layoutLetter, LCAM, end, poster}`.

`#export` in the URL skips the in-page test suite. When the suite finishes it sets `window.__TESTS_DONE` and `window.__TEST_RESULTS`.
