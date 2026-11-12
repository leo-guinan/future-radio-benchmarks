# The show becomes the interface

A Future Radio room replaces the experiment dashboard. The central monitor shows an animated three-step introduction, then an SVG studio scene with Leonardo, Borges, Agnolo and Eval, speaker motion and captions timed to the original episode audio. A little robot stands on a treadmill beside the screen. Its run cycle is driven only by the real Worker-computing phase. It rests during requests, confirmation and the interval between jobs.

Play starts the episode. One explicit Turn On switch opts into device work for the user-designated Future Radio wallet. Turn Off immediately aborts requests, terminates the worker and clears scheduled jobs while playback continues. Modes, a separate checkbox, effort slider and separate Stop control are replaced by that single On/Off control and adjacent power-use disclosure. Pause/hiding parks work; the switch stays armed and resumes with visible playback. Episode end turns it Off.

The original per-job bounds, six-second rest and internal one-hour / ten-million reserved-guess session limits remain. Transient errors use fresh jobs after 6–30 seconds of increasing rest. A changed wallet or resource switches Off. The first draft removed the cumulative gates; automatic approval review rejected publication of that scope. They were restored before publishing. The unpublished draft is not the deployed behavior.

`verification.json` describes the offline browser fixtures. No fixture creates public ledger records or submits real proofs. Tests cover the switch, phase-driven animation, stopping, resume, visibility, late offers, retries, episode end, the hour cutoff and mobile widths down to 320 pixels. `scene_ui.py` is copied from the source tests for inspection; run tests/scene_ui.py from the source checkout with Playwright/Chromium installed and SCENE_BASE_URL pointing at a preview. All API/worker work in that script is mocked. Screenshots show fixture states, not mining revenue.

The source archive and its digest are recorded in source-manifest.json. Original audio takes, costs and release assets remain the prior snapshot. This update makes no new voice, image or video provider calls. Agent billing, human effort, power and infrastructure allocation remain unmeasured. A separate real-work check, if performed, is recorded in live-check.json with its actual outcome.

## Trusted-listener exercise

Open the live room on a phone or laptop, press Play, and turn On. Watch the robot alternate between mining and rest. Turn Off while the show continues; pause and resume with On armed; switch tabs and return. Check receipt counts against the ledger and confirm the wallet. Report unclear labels, playback interruptions and confusing robot behavior. Automated browser results do not stand in for those human observations. No invitations or messages are sent by this update.

## Live check

The live single-switch check created one real worker and obtained one accepted facilitator settlement for the show wallet. Observed phases were finding a job → mining → handing in work → rest. Audio advanced from 0.957 to 3.324 seconds during the 2.355-second observation; this is a short diagnostic, not an uninterrupted-episode claim. Turn Off prevented another job during the following 6.5 seconds. There were no page errors. Rewards remain unreconciled. The initial harness wait for network-idle timed out before any activation; it is preserved separately, and readiness was changed to the player’s completed chapter fetch.
