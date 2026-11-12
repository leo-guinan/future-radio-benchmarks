# Future Radio — Renderer Polish Pass
## Smooth animation and tactile pencil audio

### Objective

Improve the existing "Leonardo Draws Leonardo" prototype without changing the established scene log semantics, nested frame architecture, character registry, or role-based capability system.

Prioritize animation continuity, authentic pencil audio, and convincing synchronization between visible construction actions and their sounds.

### 1. Continuous animation

Inspect the renderer for frame-dependent state updates, quantized motion, inconsistent interpolation, and unnecessary full-scene redraws.

Implement time-based evaluation so an object can be rendered at any fractional timestamp.

Requirements:

- Use continuous interpolation for character joints and object transforms.
- Use easing for movement starts, stops, and directional changes.
- Draw paths progressively by arc length rather than simply revealing equal numbers of path segments per frame.
- Ensure Leonardo's hand and pencil tip follow the stroke currently being revealed.
- Preserve character identity and transform continuity during nested frame operations.
- Cache static geometry or layers when useful.
- Make deterministic animation independent of browser refresh rate.
- Preserve exact event timing and final world state.

Target smooth rendering at 60 FPS on capable hardware, with graceful degradation on slower devices.

Avoid applying randomized positional jitter independently on every rendered frame.

Any hand-drawn wobble should be temporally coherent, reproducible, and subtle.

### 2. Replace spray-like audio with pencil Foley

The current synthesized drawing sound is perceived as spray paint rather than graphite moving across paper.

Prefer real recordings of pencils on paper, using recorded or appropriately licensed samples. Include different stroke textures:

- Short, light graphite marks.
- Long, continuous lines.
- Heavy strokes.
- Small curves and changes of direction.
- Pencil-down and pencil-up contact sounds.

Use a consistent sonic palette across all scenes.

If synthesis is still needed, use filtered, textured friction with irregular low-level transients rather than sustained broadband hiss.

### 3. Geometry-driven audio

Audio should respond to how the line is physically constructed.

Relevant inputs:

- Pencil tip velocity.
- Stroke curvature.
- Simulated pressure.
- Contact state.
- Surface material.
- Frame-local playback rate.

Build a small stroke-audio engine that can produce continuous pencil texture while the pencil moves and discrete contact sounds when it touches or leaves paper.

Keep changes in volume and timbre smooth.

Do not restart the complete sound sample every render frame.

### 4. Preserve timespace audio independence

Distinguish two classes of sound.

**Construction Foley:** Sound directly produced by the visible drawing action. It should track stroke contact and movement.

**World observations:** Sound associated with events elsewhere in a nested frame or at another time. This sound may arrive before or after the visual manifestation according to the scene's timespace rules.

Do not force every sound event to synchronize with a visual event.

Retain explicit audio propagation events in the scene log.

Schedule audio using a stable clock, independently of rendering frame rate.

### 5. Improve character choreography

For construction events, determine the target object's drawing path before animation begins.

The acting character should:

- Look toward the intended drawing surface.
- Move the pencil to its starting position.
- Contact the surface.
- Follow the drawing path.
- Lift the pencil when finished.
- Briefly observe the resulting object when appropriate.

This should be generated from the existing construction data rather than individually hardcoded for every object.

For a character drawing inside a nested frame, transform the stroke path into the correct actor coordinate space.

### 6. Add diagnostic tools

Provide a renderer debug mode displaying:

- Actual rendering FPS and frame time.
- Active animation events.
- Pencil-tip position and current target stroke.
- Local frame clock and parent clock.
- Audio playhead relative to stroke progress.
- Event start/end boundaries.
- Audio-visual timing offset.

Include a repeatable short diagnostic scene: Leonardo draws a straight line, a curve, a circle, and a small bell.

### 7. Acceptance criteria

The next build should demonstrate:

- Smooth, continuous pencil-tip movement.
- A line emerging directly beneath the moving tip.
- No obvious visual jump at stroke boundaries.
- No spray-like continuous hiss.
- Audible differentiation between short marks and long strokes.
- Contact sounds when drawing begins and ends.
- Identical final state when replayed at different frame rates.
- No regressions in frame nesting or outfit capabilities.
- Independent timing preserved for intentional timespace sound effects.

Report the root causes found, changes made, test results, and any remaining limitations.

Do not redesign the story or replace the scene architecture. This iteration is focused on making the construction process feel physically convincing.