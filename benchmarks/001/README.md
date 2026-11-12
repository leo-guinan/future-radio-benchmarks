# 001 — The Computational Treadmill

A seven-scene Future Radio experiment in voluntary bounded browser work. The episode uses the permitted demonstration-in-progress ending. Human attention, mining revenue, and an uninterrupted hour have not been established.

[Listen and try the experiment](https://future-radio-computational-treadmill.hitchhiker2thefuture.chatgpt.site/) · [Durable public ledger](https://future-radio-computational-treadmill.hitchhiker2thefuture.chatgpt.site/ledger) · [Release assets](https://github.com/leo-guinan/future-radio-benchmarks/releases/tag/benchmark-001-v1)

`pipeline.json` defines the stages and their dependencies. `reference/` contains the exact treatment, adapted script, structured dialogue plan, four voice IDs, raw generated takes and provider alignment/cost receipts. `baseline/evidence/` contains the finished production measurements and real rehearsal results. `cost-ledger.json` separates measured credit use from unknown dollar, labor, power, infrastructure and agent costs. Account-wide subscription information and credentials are excluded.

## Replay or modify

Requires Python 3.11+, ffmpeg/ffprobe on PATH and `python3 -m pip install -r requirements.txt`.

```sh
python3 pipeline.py plan
python3 pipeline.py verify
python3 pipeline.py replay --output /tmp/treadmill-replay-001
```

Replay uses cached voice takes and submits no paid request. The mix is deterministic for fixed inputs and environment; codec/library differences may affect byte identity. The original receipts remain immutable. Inspect the new run's `run-evidence.json` and `release-v1/receipt.json`.

For a variant, copy this benchmark, edit the structured script and dialogue plan together, update their SHA-256 fields and the input manifest, and keep your results in a new directory. New voice synthesis requires your own authorized access to the listed voices and an ElevenLabs key in the environment:

```sh
python3 pipeline.py generate --allow-paid --output /tmp/treadmill-new-takes
```

The generator refuses ambiguous prior requests and never retries automatically. API/model/voice availability and stochastic generation prevent a guarantee of identical new speech. The editorial adaptation step is a frozen human/agent input, not an algorithmic reproduction claim.

## Browser branch

`site-source.tar.gz` in the release preserves the source accompanying this episode. Its README documents setup and offline checks. Public source contains schema migrations, fixed-resource proxy, independent SHA-256d verification, bounded worker, controls and ledger. Deploying a replica requires its own runtime/D1 configuration; publishing and real work are deliberate separate actions, outside the audio replay command.

The configured recipient is the official demonstration recipient, not a Future Radio address. Live-source and practice receipts are separate. A service receipt does not prove a block reward. The rehearsal evidence describes only its actual short observation interval. No experiment or paid synthesis runs automatically when cloning or verifying this benchmark.

## Observed results

The approved trial recorded one accepted live-source receipt, with one worker and one completion request, while audio advanced during a 1.915-second observation. Work stopped before the next job. The first UI trial failed before a worker started because the edge runtime disallowed `redirect: error`; the deployed fix uses manual redirects and exact status checks. Both trials are preserved. No hour-long or independent attention experiment was performed. Actual mining rewards remain unreconciled.

Production used 5,849 provider credits across seven requests (91.731 seconds combined request wall time). The 462.96-second MP3 decoded completely, measured −16.27 LUFS / −1.72 dBTP, and retained all 91 aligned lines and seven chapters. A same-machine cached replay spent zero new synthesis credits and matched all ten baseline asset hashes. Human listening review remains pending.
