# Pipeline contracts

[`reference-v1.json`](../pipeline/reference-v1.json) defines the DAG. Every stage has
an ID, dependencies, a command array, input globs, output globs and a paid-stage flag.
Commands run in an isolated run workspace. No shell interpolation is used.

| Stage | Input | Output | Replace to test |
| --- | --- | --- | --- |
| validate-inputs | Brief, script, structured events, voice plan | Exact-source validation | Another importer/schema |
| synthesize | Source-bound dialogue and voices | Nine raw takes, alignments, receipts | Voice provider/model/voice selection |
| mix | Takes, alignment, script directions | WAV/MP3, captions, cue and dialogue timelines | Sound design, pacing, mixer, normalization |
| plan-visuals | Timed dialogue/cues | Frozen visual spec | Storyboard/shot planner |
| test-renderer | Renderer source | Regression report | Alternative renderer acceptance suite |
| check-visuals | Visual spec and renderer | Replay report, contact sheet | Visual QA method |
| style-sample | Visual plan, full radio mix | 10.5-second preview | Style exploration |
| render | Visual spec, radio master, chapters | 720p30 MP4 | Rendering/capture method |
| verify-media | Finished media and evidence | Decode/stream/level/frame checks | Independent verifier |

The preserved original baseline used a standalone renderer, not a custom imported
MCP run. Its 39 regression tests check the engine; exact dialogue/alignment and
full media checks are separate. The local renderer uses constructed boards,
limited character movement and camera cuts. Crowd sounds are procedural approximations.

## Change a step

```sh
cp -R recipes/reference-v1 recipes/my-mix-v1
cp pipeline/reference-v1.json pipeline/my-mix-v1.json
```

Change the config's `recipe` field to `recipes/my-mix-v1`, then edit the copied
`build_episode.py` (for example, compare another sound-design or normalization
method while preserving all spoken text). Run:

```sh
python tools/benchmark.py --config pipeline/my-mix-v1.json run --run-id my-mix-001 --target mix
python tools/benchmark.py verify-run --run-id my-mix-001
```

New run workspaces freeze the recipe/input selection. Subsequent edits to the
repository recipe do not silently mutate an existing run. Use a new run ID to
capture a revised recipe. You may edit files inside a run workspace deliberately;
input/output hashes determine which downstream stages must run again.

Replacing a step requires preserving its downstream file contracts or changing
the consumers too. These contracts include the ElevenLabs-style character/voice
alignment consumed by the bundled mixer. A different provider needs an adapter,
not merely an endpoint substitution. Define your adapter and tests in your recipe.

## Fresh synthesis

Copy the reference input directory into a new input set, retaining script/character
files but excluding cached `audio-v1/` takes and their resolved request markers.
Point the copied config's `reference` at that directory. Configure your own verified
voices in its dialogue plan. Use a fresh run ID, set `ELEVENLABS_API_KEY`, then:

```sh
python tools/benchmark.py --config pipeline/my-voices.json run --run-id fresh-001 --target synthesize --allow-paid
```

The key is read only from the environment, never written to logs. A cached take is
reused only when the request and audio hashes match. Paid submissions leave request
markers before dispatch and stop on unresolved requests rather than silently retrying.
A fixed seed does not guarantee identical provider-generated audio.

## Evidence and cache behavior

A stage signature binds its definition and actual input contents. A checkpoint is
reused only if the signature and every recorded output hash match. The hash-linked
event journal records start and completion/failure separately. Attempt costs are
incremental; earlier failed or superseded attempts remain visible. Rerunning a
cached stage does not add fake CPU time or repeat synthesis credits.

`verify-run` checks journal integrity and current checkpoint output hashes. File
hashes, dependency versions and CPU architecture provide provenance, not a guarantee
of byte-identical numerical/codec output on all machines. Compare requested text,
line/scene coverage, duration, loudness, visual findings and independent listening.
Human editorial acceptance is a separate result; local preview rendering does not
publish media or contact anyone.
