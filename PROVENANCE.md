# Provenance and scope

The reference screenplay and production instructions were supplied by Leo Guinan
on November 12, 2026. The exact brief and spoken script are preserved. Only the
spaced speaker label `AGN OLO` is normalized to the existing Agnolo identity in
structured data. No script-generation model was called for this episode.

The baseline was produced in the user's `future-radio-studio` workspace using the
standalone scene engine and the local production renderer. The connected studio
checkout was based on commit `54f4c73f1d31472c967c8cafd5de56406fdbe73a` of
`leo-guinan/future-radio-studio`; the rendering copy originated in the newer local
`plugins/future-radio-production/animation-studio`. The bundled renderer contains
its existing demos and assets needed by the regression suite. This was not an
approved custom-script import into the newer production MCP.

The three ElevenLabs voices are the established Leonardo, Borges and Agnolo IDs,
verified against the account before production. They are supplied as identifiers,
not a promise another account can access them. Voice output is model-generated;
seeds and API endpoints are recorded. The original account was grant-backed.
The Unspoken Orchestra and stylized effects are deterministic local synthesis.
No Hashference or Bitaxe inference funding was used.

The repository preparation changed only credential loading/paid opt-in in the
portable voice producer, pinned the observed Playwright version, added explicit
input validation and a pipeline/metering wrapper. The production mixer and
renderer are preserved. `original-production-sources.json` records the original
file hashes; `source-manifest.json` records this portable recipe and input snapshot.

Original media and provider response receipts are retained as evidence. Global
account usage/quota were removed from the copied readiness preflight; per-request
credits, hashes, IDs and alignment remain. Credentials, local authorization/chat
history, unrelated memory and workspace files are not included. The original
receipt refers to its earlier local packaging; its unshipped original ZIP is not
misrepresented as the new portable recipe archive. `artifacts.json` is the index
for this repository's downloadable assets.

License terms for imported code, scripts, provider voices and generated recordings
have not been separately designated here. No blanket relicensing is asserted.
The public benchmark publishes source and evidence with that limitation recorded.
