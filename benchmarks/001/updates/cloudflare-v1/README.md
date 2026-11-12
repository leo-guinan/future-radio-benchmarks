# Native Cloudflare deployment

Live: https://future-radio.leo-guinan.workers.dev

This checkout derives from published scene source 70dcaaf07550e16ba94bc98e762bdf89abdc7fe9. It is a native Cloudflare Worker with Static Assets and a dedicated D1 database, independent of the Sites preview. The exact wallet and all scene/work lifecycle controls are retained. The canonical contribution resource is this deployment's /api/contribution URL.

The complete application is the release asset `future-radio-cloudflare-v1-source.tar.gz` in the benchmark-001-v1 release. Extract it before running the commands below; this directory keeps deployment evidence and the small range-handler regression separately.

## Rebuild and deploy

Install the package-lock dependencies with npm ci, authenticate Wrangler to the intended Cloudflare account, and configure the Worker name, account ID and D1 ID in wrangler.jsonc. Update lib/work.ts if changing the deployment origin; offer validation intentionally binds that exact URL. The Vite inline config selects the source entrypoint and assets binding; D1 is configured once in wrangler.jsonc. No secret is stored in source.

```sh
npm run build
node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --remote --config wrangler.jsonc
node node_modules/wrangler/bin/wrangler.js deploy --config wrangler.jsonc
```

Use wrangler deploy --dry-run before a changed deployment. Cloudflare's static asset service handles captions, worker JavaScript and frontend assets. Only /episode.mp3 routes through the Worker first: lib/audio-range.ts streams byte ranges from ASSETS for seeking and Safari, without buffering the whole file. The Worker serves the scene and API routes. DB is the ledger binding; ASSETS is the asset binding.

## Ledger history

lib/legacy-ledger.json preserves the prior host's public aggregate totals and its latest 25 receipts at the recorded asOf timestamp. The original database remains at the original preview host. Cloudflare D1 durably stores new offers and receipts; the ledger combines these new totals with the timestamped prior-hosting totals and exposes historySnapshot provenance. Later writes at the old host are not automatically synced. This is a historical snapshot, not a claim that all prior database rows were copied into D1.

The independent preview remains at https://future-radio-computational-treadmill.hitchhiker2thefuture.chatgpt.site/ . Use the workers.dev URL for new contribution sessions on this deployment.

## Verification and costs

The native deployment is checked for SSR, real audio playback, matching MP3 byte ranges, correct recipient/resource in a D1-backed offer, retained ledger totals, rejection of cross-origin/nonconsensual writes, switch behavior and mobile overflow. The deployment check runs no solver and settles no proof. Existing protocol contracts and TypeScript checks pass. No new synthesis, image or video generation is used. Cloudflare account billing, agent cost, energy and human effort are not independently allocated; no zero-dollar total is claimed.

Range behavior reference: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
