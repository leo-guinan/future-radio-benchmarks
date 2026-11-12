# Future Radio — The Letter to DHH
## Production Specification v0.1

**Target length:** 75–90 seconds

**Setting:** Leonardo's existing radio studio

**Primary characters:** Leonardo and the enchanted quill

**Recipient:** DHH (David Heinemeier Hansson)

**Purpose:** Create a beautiful, legible sponsorship letter that can become a real outreach artifact after review.

**Technical milestone:** Demonstrate an autonomous instrument converting a character's semantic instructions into a persistent, readable, animated document.

---

## 1. The scene

### 00:00–00:10 — The problem

Leonardo sits at his desk in the existing Future Radio studio.

The room is quiet. His pencil rests beside him.

Agnolo's voice arrives through the radio.

**AGNOLO:** "Leonardo, we have a problem."

**LEONARDO:** "What's that?"

**AGNOLO:** "We've learned how to make things. We haven't learned how to pay for them."

Leonardo looks at the pencil.

**LEONARDO:** "Then perhaps we should make something that asks."

He lifts the pencil.

### 00:10–00:20 — The instrument

Leonardo draws a feather, a metal nib, and a narrow shaft.

An elegant quill appears on the page.

When the drawing is finished, the quill's shadow moves independently.

The feather lifts itself from the paper.

Leonardo puts down the pencil.

**LEONARDO:** "Good morning."

The quill bows slightly.

Leonardo places a fresh sheet of paper beneath it.

### 00:20–00:30 — The command

**LEONARDO:** "I'd like to write to DHH."

The quill moves toward the paper.

**LEONARDO:** "Tell him what we're making. Ask if he'll help us make more of it."

The quill pauses.

**LEONARDO:** "And make it beautiful. But keep it honest."

The quill dips its nib into a small inkwell.

We move into a close-up of the empty sheet.

### 00:30–01:10 — The letter

The quill begins writing.

The letters form in expressive, legible calligraphy. Every stroke follows the nib. Downstrokes are fuller, upstrokes delicate.

The quill writes the following exact text:

**Dear DHH,**

**I was drawn into existence.**

**Now I'm learning to make worlds of my own.**

**We're building Future Radio in public, one experiment at a time.**

**Would you sponsor our next month of work for $3,000?**

**— Leonardo**

The paper stays stable as the camera follows the writing.

Small decorative flourishes appear at the ends of selected lines.

After the signature, the quill draws a tiny illustration of the Future Radio station beneath the letter.

Its little antenna flickers once.

For the first time, a piece of the letter animates independently of the quill.

### 01:10–01:20 — The review

The quill rises and turns toward Leonardo.

Leonardo picks up the letter.

The handwritten page is now a persistent artifact. Its text can be read in full.

**LEONARDO:** "That's rather good."

He examines the tiny illustrated station.

**LEONARDO:** "I think we should send it."

The quill looks toward an empty envelope.

### 01:20–01:30 — The invitation

The quill flies to the envelope.

It writes:

**DHH**

Leonardo folds the letter.

The quill places a decorative flourish on the envelope.

The radio makes a faint sound.

Leonardo looks toward it.

No reply yet.

**CUT TO BLACK.**

**FUTURE RADIO**

*Art asking for the chance to make more art.*

The letter remains saved as a draft ready for human approval and real-world delivery.

---

## 2. Required objects

| Object | Type | Function |
|---|---|---|
| Leonardo | Actor | Commands the quill and reviews the result |
| Pencil | Tool | Constructs the quill |
| Quill | Autonomous instrument | Interprets instruction and writes |
| Paper | Drawable surface | Hosts the letter |
| Inkwell | Prop | Provides a visual source for ink |
| Letter | Semantic + visual artifact | Stores text, glyph paths, and provenance |
| Envelope | Prop / artifact | Prepares the correspondence |
| Radio | Communication instrument | Ambient continuity with Future Radio |

Reuse the existing studio and Leonardo assets.

Only the quill, writing paths, and paper interactions require substantial new behavior.

## 3. New capability: COMMAND

Add a high-level `COMMAND` event for instructing autonomous instruments.

The event should include:

- Actor issuing the instruction.
- Instrument receiving it.
- Intent and recipient.
- Available factual context.
- Requested output type.
- Constraints, including approval requirements.
- Resulting artifact ID.

For this scene, the command instructs the quill to prepare a sponsorship letter addressed to DHH.

The command does not authorize external delivery.

For the initial prototype, the semantic draft may be predefined. Later, an agent can produce a proposed draft from the supplied intent.

## 4. New rendering behavior: WRITE

Implement `WRITE` as a text-specialized capability compiled into `INSCRIBE` events.

Inputs:

- Exact letter text.
- Calligraphy style.
- Page dimensions and margins.
- Glyph stroke paths.
- Stroke sequence.
- Writing speed.
- Ink width and pressure parameters.
- Acting instrument.
- Parent frame.

Outputs:

- Persistent semantic text artifact.
- Corresponding vector paths.
- Quill-tip motion trajectory.
- Timed stroke and sound events.

The first implementation should use one curated calligraphy style, not arbitrary generative lettering.

Text layout should be computed before writing begins so the quill does not run off the page.

## 5. Animation constraints

The scene should work using the existing 2D renderer.

Requirements:

- Stable camera and paper geometry.
- Smooth quill position and orientation.
- Continuous nib-to-stroke alignment.
- Natural pauses between words and lines.
- Correct stroke order for every letter.
- Realistic line-width variation.
- Subtle feather motion.
- No arbitrary movement of already written text.
- Ink remains visible after each stroke completes.

The quill should move to the next word naturally rather than teleporting.

Use a close-up camera view during writing so the text remains legible.

Start with one fixed letter and one calligraphy style. General-purpose writing can come later.

## 6. Sound design

**Pencil construction**

Dry graphite friction with subtle pressure and contact changes.

**Quill activation**

A restrained paper rustle and a light feather movement. Avoid generic magical sparkle sounds.

**Calligraphy**

Small, soft nib-contact sounds. Delicate friction linked to stroke speed and nib pressure.

**Ink dip**

A barely audible liquid/contact sound.

**Letter completion**

Silence as the quill lifts and Leonardo examines the page.

**Radio**

A quiet signal during the closing moment. It must not imply that DHH has responded.

Use actual recorded Foley where practical, with samples controlled by the motion timeline.

## 7. Scene-log event plan

| Time | Operation | Actor → Target |
|---|---|---|
| 0:10 | INSCRIBE | Leonardo → quill-1 |
| 0:16 | ANIMATE | Leonardo → quill-1 (awaken) |
| 0:20 | FRAME | Leonardo → letter-paper-1 |
| 0:23 | COMMAND (new) | Leonardo → quill-1 |
| 0:29 | ANIMATE | quill-1 → ink-dip |
| 0:30 | INSCRIBE (write mode) | quill-1 → letter-1 |
| 1:08 | INSCRIBE | quill-1 → miniature station illustration |
| 1:11 | ANIMATE | illustration → antenna flicker |
| 1:15 | ANIMATE | Leonardo → examine letter |
| 1:20 | INSCRIBE (write mode) | quill-1 → envelope address |
| 1:25 | COMPOSE | Letter + envelope → prepared correspondence |

Event times are targets to refine after reviewing the animation.

A prepared letter does not automatically produce a `DISPATCH` event.

## 8. Artifact requirements

The finished letter must contain:

- A unique artifact ID.
- Exact editable text.
- Readable rendered artwork.
- Vector stroke paths.
- Recipient and intended purpose.
- Authorizing character.
- Creation history and scene-log references.
- Current correspondence status.
- Revision history.

The finished artifact should be exportable as a shareable image and, later, as a printable document.

The semantic text must match the displayed writing.

## 9. Acceptance criteria

- [ ] Leonardo constructs the quill with his pencil.
- [ ] The quill becomes an independently animated instrument.
- [ ] Leonardo can give it a semantic writing instruction.
- [ ] The exact sponsorship letter appears in readable calligraphy.
- [ ] Quill movement remains aligned with the forming letters.
- [ ] The sound feels like writing with ink rather than spray painting.
- [ ] The text survives independently of the rendering.
- [ ] The quill can write another recipient's name without changing its behavior code.
- [ ] A finished letter can be reviewed, revised, and saved.
- [ ] The animation can replay deterministically.
- [ ] No external message is sent without separate explicit authorization.
- [ ] Existing nested-frame and costume demonstrations still work.

## 10. Future extensions

Once the first letter works, the quill can acquire additional abilities:

- Compose several alternative drafts.
- Offer Leonardo different visual styles.
- Rewrite selected sentences.
- Produce recipient-specific versions.
- Create illuminated manuscripts and illustrated invitations.
- Generate letters for other characters.
- Preserve responses and correspondence history.
- Prepare a new animated scene from the content of a response.

These are future capabilities, not prerequisites for this prototype.

**Completion condition:** One enchanted quill, one authentic sponsorship request, one readable and beautiful animated letter, and one reusable correspondence artifact.

The scene itself must demonstrate the capability that it is asking someone to support.

