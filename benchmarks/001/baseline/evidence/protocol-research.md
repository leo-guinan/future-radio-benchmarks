# Quai x402 Work integration research

Researched 2026-11-12 from the deployment's own documentation and browser source. No solver, mining, paid request, registration or publication was performed in this research. HTTP reads only; two unpaid demo requests issued ephemeral offers which were not solved or settled.

## Verified official sources

- Overview and machine instructions: https://x402.qu.ai/llms.txt
- Payer protocol, byte ordering, test vector and client: https://x402.qu.ai/docs/pay.md
- Seller registration-free facilitator and payout requirements: https://x402.qu.ai/docs/sell.md
- Official browser demonstration: https://x402.qu.ai/demo
- Public unpaid demo API: https://x402.qu.ai/x402/v1/demo/image
- OpenAPI schema: https://x402.qu.ai/openapi.json
- Client package manifest: https://x402.qu.ai/x402-packages.json
- Scheme proposal: https://github.com/dominant-strategies/x402/pull/3
- Official browser demo module observed on this deployment: https://x402.qu.ai/ui/chunk-JPZVINJ6.js
- Official browser worker observed on this deployment: origin `https://x402.qu.ai`, directory `/ui/`, filename `worker-HTYPQLGA.js`
- Official browser offer validator: https://x402.qu.ai/ui/chunk-COKISAOS.js

The fingerprinted JavaScript URLs may change when the deployment updates. Preserve a reviewed local copy and checksum if integrating that implementation rather than dynamically trusting changing remote code.

## Real demo and bounded rehearsal

At 2026-11-12 21:11:06 UTC, `GET /x402/v1/demo/image` returned HTTP 402 and a real work offer:

| Field | Observed value |
| --- | --- |
| scheme / asset | `work` / `hash` |
| network | `quai:9` |
| profile | `quai/sha256d-v1` |
| amount | `40000` expected guesses (not an actual-work cap) |
| payTo | `0x007f5ac8d9d06a27565172cb75f8e5589074f8e4` |
| offer timeout | 15 seconds |
| refresh | Four seconds after issuance in this observed offer |
| protected output | `image/gif` |

This address belongs to the demo's offered payout configuration. No source verified its human/legal owner. **It is not established as Future Radio's address.** A successful demo rehearsal is work for this demo recipient, not a contribution that economically benefits Future Radio.

The official browser implementation explicitly starts on a click, solves in a module Web Worker, caps actual attempts at 250,000 and time at 15,000 ms, and stops at the earlier local deadline, job refresh or expiry. Stop and tab hiding terminate the worker and abort the fetch. A failed attempt does not automatically retry. The worker checks its deadline both before and after each digest. It validates the Quai profile, address format, price and job structure. Its SHA-256d loop uses browser `crypto.subtle`, with nonce plus coinbase extraNonce2. This is the real Quai job format, not a generic local leading-zero puzzle.

For an explicit bounded rehearsal, disclose the demo address and choose one user-initiated attempt with a maximum offer price of 40,000 expected guesses, actual cap of 100,000 guesses, local cap of 3,000 ms, earlier refresh/expiry stop, one worker and no automatic retry. The exact price may change; refuse offers exceeding the configured cap. Missing the target is an honest possible outcome, even at the quoted expected price. No successful receipt has yet been obtained by this research.

The official demo has a fallback/practice distinction: after success it inspects `x-demo-source === live`. When that header differs it labels the work as practice, not network work. A valid access receipt alone is therefore insufficient to assert a live Quai demonstration. A production rehearsal must capture and check this header as well as the receipt.

## Protocol and evidence

1. Fetch the protected resource without a proof. Decode its `payment-required` header, or use its identical JSON body.
2. Before solving, bind the exact protected resource URL, expected seller address, profile, network, amount and live deadline. The amount sets an expected target; separately enforce actual guesses and elapsed time.
3. Solve the accepted offer's Stratum-derived block header with SHA-256d and target `floor(2^256 / amount) - 1`. Use the official worked example to check byte ordering offline.
4. Retry the identical request with base64 JSON `payment-signature`: `{x402Version:2, resource, accepted, payload:{solution}}`; copy resource and accepted exactly.
5. Successful access returns a `payment-response` receipt containing success, a spend fingerprint called transaction, network, amount and extra data. Preserve complete server responses and local actual guesses/time separately.

Seller-side `POST https://x402.qu.ai/v1/facilitator/verify` verifies without consuming work or submitting it. `POST https://x402.qu.ai/v1/facilitator/settle` consumes a valid proof once and submits it upstream only if it also meets the network/share threshold. Both accept `{x402Version:2,paymentPayload,paymentRequirements}`. HTTP 200 can contain failed verification/settlement, so inspect the JSON success fields. Address/resource/price matching prevents proofs for another seller or cheaper resource being accepted. Fresh jobs replace stale ones; do not silently retry/charge after a failure.

`extra.sourceAccepted` describes upstream acknowledgement, not a payout. Receipt transaction is a proof-consumption fingerprint, not evidence of an on-chain reward transaction. The server's quoted amount is expected work, not measured hashes and not currency. Maintain three separate columns: accepted access payments, actual upstream rewards with chain evidence, and production costs. Until reward reconciliation has actually been checked, use unknown/unmeasured, not fabricated zero; report zero only for an explicitly observed interval with evidence.

## Viable production integration

Direct fetch from an independently hosted static page is currently unsuitable: a real unpaid GET sent with `Origin: http://localhost:8890` at 21:11:25 UTC returned HTTP 402 **without Access-Control-Allow-Origin**. The official demo runs same-origin. Its response also denies framing. A separate page can link to https://x402.qu.ai/demo, but an embedded cross-origin demo is not established as supported.

For an actual Future Radio contribution page, use an own same-origin backend with a fixed resource route, e.g. `/api/contribution`, and a worker on the own page. The backend calls the hosted facilitator to issue jobs for the supplied Future Radio reward address, and settles proofs against its own fixed resource/price/address. Keep endpoint origin allowlisted; avoid an arbitrary URL proxy. A static-only Site can host playback and link to the official demo, but cannot honestly claim to have an integrated Future Radio contribution backend without another hosting service.

Official backend library: `x402-work-client` version 0.4.1 at https://x402.qu.ai/x402-work-client-0.4.1.tgz, documented SHA-256 `2a276f40b2598cbc238549071a387c5df76a00729a268ddfa8eac7c8a0b1523a`. Its `workSeller({payTo,amount,profile})` wraps issuance and settlement. It is a Node client/server package, not an established browser import; the official demo uses its separate browser worker. Existing service routes need no marketplace listing or account. Marketplace publication adds domain verification and human review, and is unnecessary for this prototype.

Seller requirements endpoint: `POST https://x402.qu.ai/v1/facilitator/requirements` with required `payTo`, decimal-string `amount`, and `resource:{url,description?,mimeType?}`, plus `profile:quai/sha256d-v1`. For Quai, payTo must be a Cyprus-1 QUAI address (`0x00` followed by 38 hex digits, lowercase or valid checksum). Resource URL must be HTTPS without credentials/query/fragment, except localhost HTTP. The result contains the offered requirements and encoded header. Jobs are currently short-lived; fetching immediately before each explicitly enabled work window matters.

The optional loop needs a second outer session budget in addition to per-job bounds: user-selected duration/duty cycle, total guess cap, one worker, stop on hidden/unload/pause, no work on ordinary playback, and independently recorded playback interruptions. The source protocol authorizes one access payment per proof; ongoing support is an application-level series of voluntary bounded requests, not a protocol promise of continuous income. A timer should describe session duration rather than imply proof of human attention.

## Missing information / honest release boundaries

- A verified, intentionally designated Future Radio Cyprus-1 QUAI reward address. Do not reuse the demo address while implying the show benefits.
- Hosting/origin for the contribution backend and durable public aggregate/ledger. A static export alone cannot provide verifiable settlement aggregation.
- Explicit rehearsal consent including recipient, actual guesses and time cap before running the solver. No computational work was run for this note.
- A real successful receipt, live-source indication, playback timing log and reward reconciliation. Scripted dialogue cannot assert these results before experiments produce them.
- Actual monetary/energy/human costs and genuine reward records. Work counts and provider credits do not convert themselves into dollars or joules.

If these remain unavailable, release the audio with a clearly marked demonstration-in-progress ending, a working optional external official demo link, and a ledger showing status/missing evidence. Do not substitute a local toy hash puzzle and label it real Quai work.
