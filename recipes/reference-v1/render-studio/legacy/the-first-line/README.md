# The First Line (legacy)

The first Future Radio cold open, kept as it shipped: a standalone page (`index.html` with `vo/`) that predates the shared engine.

- `export_frames.py` captures frames through the page's own `window.__exportFrame(t)` hook and writes `audio_env.json`.
- `mix_audio.py` synthesizes the effects from that envelope and mixes in the voice files.

Both scripts have hard-coded paths from the original session. `mix_audio.py` expects WAV voice files, but only the MP3s are kept here. To use them, convert the MP3s with ffmpeg and adjust the paths.
