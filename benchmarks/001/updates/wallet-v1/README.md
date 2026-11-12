# Post-release update: Future Radio payout wallet

The user designated `0x005A3560C44e506626A26352466429cC963F9fB7` for Future Radio. The API uses its lowercase equivalent. The public Site now requests SHA-256d offers from the official facilitator for that wallet and its own fixed `/api/contribution` resource, rather than proxying the official demo resource. Only matching, independently checked proofs and successful facilitator settlements count as show work receipts.

The original benchmark audio, receipts and artifacts remain the recording-time snapshot. The earlier demo receipt retains its original recipient and does not count toward this wallet. Current configuration and ledger are on the live page. No additional voice generation or mining was performed for this configuration change. An unpaid requirements request validated the address; a separate live Site check is recorded in verification.json.

Accepted work is distinct from a network payout. Actual rewards remain unreconciled. The same consent and bounds remain: one worker, 100,000 guesses / 3,000 ms per job, at most 40,000 expected guesses per offer, at least six seconds of rest, and ten million reserved guesses / 60 minutes per session. Failures, Stop, hidden page and audio pause stop work.

`source-manifest.json` records the new Site source commit and archive digest. The source archive is an additional release asset named site-source-show-wallet-v1.tar.gz. The original release assets and their recorded hashes remain intact.

Validation includes independent hash verification, offline wallet/resource/settlement rejection contracts, TypeScript, production build, and a live requirements-only check. It does not establish successful settlement or a reward for the newly configured wallet.

Incremental synthesis cost: zero requests and zero credits. Incremental agent, hosting and network dollar costs, human time and electricity are unmeasured; no complete dollar total is asserted.
