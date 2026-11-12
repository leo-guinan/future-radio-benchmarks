# Future Radio — Agent Implementation Brief
## Nested Actors, Constructible Frames, and Capabilities as Outfits

### Objective

Extend the existing Future Radio prototype so characters can construct new frames containing independently controllable actors, and create wearable outfits that grant reusable capabilities.

**Do not replace the existing scene-log architecture or renderer. Extend the existing system so both scripted and viewer-instructed constructions use the same operations.**

The intended progression is:

**Draw a frame → Draw a character inside it → Activate the character → Give it capabilities → Let it construct things → Save and reuse those capabilities as outfits.**

## Part 1 — Fix the current bug

### Reproduction

The viewer instructed Leonardo:

"Draw a frame on your desk with a Leonardo inside of it."

The renderer produced two unscripted events:

- `INSCRIBE picture-frame-1`, `frame: studio`, `tpl: inline`
- `INSCRIBE leonardo-portrait-2`, `frame: studio`, `tpl: inline`

Both used approximately the same placement coordinates, `[900, 400]`.

This produced visual artwork but did not establish a new nested frame or register the second Leonardo as a controllable character.

### Expected behavior

1. Leonardo draws a physical picture frame positioned on his desk.
2. The frame has a valid local coordinate system and is registered as a child of the studio.
3. Leonardo draws a new instance of himself **inside** that frame.
4. The new character has its own persistent identity, state, and animation controls.
5. The new Leonardo can wake, move, draw, and invoke permitted capabilities inside its containing frame.
6. The original Leonardo remains independently controllable.
7. The construction appears in the scene log with correct provenance.

### Required changes

**A. Separate appearance from world structure**

`INSCRIBE` creates drawable objects.

`FRAME` creates a real nested frame with a parent relationship, coordinate system, dimensions, and child-object registry.

A decorative picture-frame template is not equivalent to a nested world.

A picture frame may have both visual artwork and a functional `FRAME` interior.

**B. Implement parent-relative positioning**

A frame drawn "on the desk" must be positioned relative to the desk's actual geometry.

Do not place it at arbitrary global coordinates.

Represent parent relationships explicitly:

- `studio`
  - `desk`
  - `F1` (existing wall frame)
  - `F2` (new desk picture frame)
    - `leonardo-2`

Maintain transforms between child-frame coordinates and studio/world coordinates.

Render children clipped to their parent frame until an operation explicitly allows them to cross the boundary.

**C. Register character instances**

When an `INSCRIBE` event creates an entity using a character template, instantiate an actual character object, not merely decorative strokes, when the requested intent is to create an actor.

For the current request:

- Template: `leonardo`
- New instance: `leonardo-2`
- Display name: Little Leonardo 2
- Parent: `F2`
- Initial state: drawn/dormant
- Activation: `ANIMATE` with behavior `wake`

Add the new character to the controllable actor registry when instantiated, with its current activation state visible.

Give it unique state, animation controls, inventory, and capability bindings. Reuse Leonardo's visual template without sharing mutable character state.

A portrait explicitly requested as decoration may remain an inert drawing. But a character intended to act must be a character instance.

**D. Resolve natural-language instructions structurally**

The instruction "draw a frame on your desk with a Leonardo inside of it" should resolve to a construction plan containing at least:

1. `FRAME` — create a desk-mounted nested frame.
2. `INSCRIBE` — render the picture frame's visible border.
3. `INSCRIBE` — create a Leonardo instance inside the new frame.
4. `ANIMATE` — optionally wake the new Leonardo when the user requests an active character.

Never silently reduce a requested nested world into two unrelated inline drawings.

**E. Preserve causality and replay**

All state changes must be reconstructible by replaying the scene log.

Do not hide character registration, parent assignment, or capability grants inside renderer-only code.

The state resulting from replay must match the state produced during live execution.

---

## Part 2 — Introduce outfits

### Principle

**An outfit is a drawable, wearable, executable artifact that grants a character a role.**

Characters have persistent identities. Outfits provide temporary or reusable capabilities.

Leonardo should be able to draw an outfit, put it on, use its capabilities, take it off, and hang it somewhere for later use.

Other characters may wear a compatible outfit and receive its capabilities independently.

### New concepts

**Character**

Persistent identity, visual body, personal state, memory references, inventory, and equipped roles.

**Outfit**

A persistent object with appearance, attachment points, role definition, granted capabilities, requirements, and provenance.

**Role**

A named collection of capabilities, available tools, defaults, and operating constraints.

**Capability**

An action a character can invoke on the world, subject to permissions and preconditions.

### Suggested outfit data

Each outfit should support:

- `id`
- `name`
- `creator`
- `visualTemplate` or editable drawing
- `role`
- `capabilities`
- `requirements`
- `attachmentPoints`
- `equippedBy`
- `provenance`
- `cost`

Keep visual appearance separate from executable capabilities, so the same role can have multiple visual designs.

### Add two scene operations

**EQUIP**

Attach an outfit to a character.

Effects:

- Render the outfit on the character.
- Apply the role's capability bindings.
- Update the controllable actor's available operations.
- Persist the equipment change in the scene log.

**UNEQUIP**

Remove the outfit from a character.

Effects:

- Remove the visual attachment.
- Withdraw capabilities granted solely by that outfit.
- Preserve the outfit as a reusable object.
- Return it to inventory or a designated location.

Do not remove capabilities a character independently possesses.

### First outfit: Leonardo's Animator

Give Leonardo the ability to draw a simple animator outfit:

- Graphite-stained apron
- Pencil behind his ear
- Small flipbook in one pocket
- Drawing glove

The outfit grants the `Animator` role.

Initial capabilities:

- `INSCRIBE` — create artwork inside accessible frames.
- `ALTER` — modify existing drawable objects.
- `ANIMATE` — attach supported animation behaviors.
- `FRAME` — create nested drawing surfaces.

The role can be expanded as new functionality is implemented.

Because Leonardo already uses some of these operations, preserve existing baseline capabilities. The outfit should demonstrate reusable role binding, not arbitrarily remove his current abilities.

A newly activated Leonardo instance could begin with only a smaller baseline capability set, then gain the Animator operations when it equips the outfit.

### Outfit rules

1. Drawing an outfit creates an artifact, not an automatic permission grant.
2. Equipping it binds the associated role.
3. Removing it withdraws role-specific capabilities.
4. Outfits can be saved, reused, and modified.
5. Two characters can have distinct instances of the same outfit design.
6. A character's identity persists across outfit changes.
7. Outfits do not automatically grant access to external systems or privileged tools. Those permissions must still be separately authorized.
8. Capability use must be recorded with actor, outfit/role where relevant, target, operation, arguments, and result.

---

## Part 3 — Demonstration scene

Extend "Leonardo Draws Leonardo" with the following sequence.

**Beat 1 — A new world**

Original Leonardo draws a picture frame on his desk.

The picture frame becomes a functional nested frame.

He draws Little Leonardo 2 inside it.

Little Leonardo 2 wakes up.

Both Leonardo instances appear independently in the control interface.

**Beat 2 — A limitation**

The little Leonardo tries to animate a drawing.

He lacks the necessary capability.

The action fails visibly and the scene log records the missing capability, without corrupting world state.

**Beat 3 — A new identity**

Original Leonardo draws an animator's apron and pencil set inside the little character's frame.

The outfit becomes a reusable artifact.

Little Leonardo 2 puts it on using `EQUIP`.

The outfit visibly attaches to his body.

His available capabilities change.

**Beat 4 — The first independent creation**

The little Leonardo invokes `INSCRIBE` to draw a bell.

He invokes `ANIMATE` to ring it.

The resulting sound propagates out of his subframe into the studio.

Original Leonardo hears it.

**Beat 5 — Reuse**

Little Leonardo removes the outfit and places it on a hook.

The outfit remains persistent.

He attempts the same capability again and, if it is not available through another role or his baseline, receives a capability-denied result.

Original Leonardo can later retrieve the outfit for reuse.

---

## Part 4 — Acceptance tests

The implementation is complete when these tests pass:

- [ ] Viewer instruction creates a real nested desk frame, not just decorative strokes.
- [ ] A new Leonardo is registered as a separate controllable actor.
- [ ] The actor renders within the correct nested coordinate system.
- [ ] Moving the desk or picture frame moves its child frame and contents consistently.
- [ ] The nested actor can execute an independent instruction.
- [ ] Character visual templates are reusable without sharing mutable state.
- [ ] An outfit can be drawn as a persistent object.
- [ ] `EQUIP` changes both the actor's visual appearance and capability bindings.
- [ ] `UNEQUIP` reverses outfit-specific effects without deleting the outfit.
- [ ] A restricted action fails cleanly before equipping and succeeds after equipping.
- [ ] The bell's sound can propagate across the frame boundary without promoting the bell itself.
- [ ] The complete scene can be replayed from its event log with identical final world state.
- [ ] Existing scene logs, including the original F1 demonstration, remain compatible.

## Part 5 — Reporting

When finished, report:

1. Files and systems modified.
2. The root cause of the nested-frame/actor-registration bug.
3. The new object, frame, character, outfit, and role models.
4. The exact emitted events for the viewer instruction.
5. Automated tests executed and their results.
6. Any limitations or simulated functionality.
7. A demonstration of an independently controlled nested Leonardo equipping an outfit and using its new capability.

**Do not hardcode the requested viewer instruction as a special case. Implement general construction semantics that will work for arbitrary characters, nested frames, and outfits.**

The long-term goal is a movie where characters gain the ability to construct their world by creating and equipping capabilities. The current milestone is one genuinely independent nested actor and one functioning, reusable outfit.