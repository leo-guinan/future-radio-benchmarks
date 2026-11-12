# Cost accounting

The machine-readable baseline is [`costs.json`](../benchmarks/000/baseline/costs.json).
Every number points to original receipts; nine per-scene synthesis rows sum to
6,689 credits and 146.400 seconds. The original production account was grant-backed.
A reported credit is a provider accounting unit, not a US dollar charge.

| Cost boundary | Recorded evidence | Missing evidence |
| --- | --- | --- |
| Source/brief and character development | Frozen supplied text; no separate script-generation call | Prior authoring and character/voice creation effort |
| Agent planning, coding and review | Completed turn telemetry: 6,990,861 input (6,904,448 cached), 38,353 output (10,971 reasoning), gpt-6.1-sol; 1,103.259 s turn elapsed | Actual agent cash charge, human active authoring time |
| Voice/model readiness preflight | Voice IDs, model availability, planned characters | Preflight duration; account-wide quota intentionally omitted |
| Nine synthesis calls | Exact request, response ID, alignment, raw take hash, credits, request wall seconds | Cash debit/invoice; provider compute and energy |
| Alignment, procedural effects and mix | Two mix attempt receipts, 114.770 s total | Full child-process CPU, power, manual decisions |
| Renderer tests and visual QA | 39 tests; style sample and frame QA | Historical test/inspection time, human active minutes |
| Style sample | 4.606 s local wall time | Process power and hardware allocation |
| Full video + initial mux | 245.544 s local wall time | Process power; final replacement-audio mux time |
| Decode/loudness checks and packaging | Final hashes, scans, chapters and archive evidence | Original verification/packaging resource time |
| Repository preparation/upload/hosting | Git history and release assets | Agent cost, active effort, bandwidth/storage invoice |
| Existing tooling, canonical voices and other assets | Reuse is disclosed in provenance | Historical cost and amortization denominator |
| Human work | No independently tracked active-time log | Writing, approvals, listening, interventions, review |
| Electricity and hardware | OS/architecture/dependency versions | Wall-plug measurement, watts estimate, depreciation model |

**No complete cash total can be calculated from this evidence.** Grant-backed or
subscription usage still consumes a scarce allowance. Unknown values remain null.
There is no defensible claim that the episode cost $0.

The recorded local stage sum is **364.920 seconds**, not a complete local-work total.
Provider timers include network/provider waiting. Do not add overlapping clocks
or call the 991.9-second orchestration clock human labor. The older `localMixCpuSeconds`
field measures only the Python parent process and omits FFmpeg children.

## Optional scenarios

Copy `pipeline/rates.example.json` and supply rates you can justify. For example,
add your actual credit valuation, measured/assumed average watts, electricity rate
and independently tracked active human minutes. Keep supporting invoices or readings.

```sh
python tools/benchmark.py costs --rates my-rates.json --out my-cost-scenario.json
```

Results are explicitly labeled scenarios. They never overwrite measured evidence.
Energy scenarios cover only recorded local stage time, omitting unrecorded work
and all cloud energy. A dollar value for credits is a valuation unless supported
by an actual bill. Do not combine both a full subscription allocation and its same
credit expenditure as separate cash charges.

## New experiments

The runner measures every attempted stage using a monotonic wall clock and POSIX
child-process user/system CPU counters. Failed attempts remain in `events.jsonl`.
New synthesis credits count only newly produced provider receipts. Cached takes
carry the baseline's historical synthesis cost, with **zero new synthesis credits**.
If a paid request is unresolved, new credit cost is unknown until reconciled.

Missing agent usage for new runs, power, human time and cash charges stay null. Attach independent
measurements or invoices with their own scope and hashes. Do not relabel the credits
reported by a reused production receipt as fresh spending on the replay.

## Recovered original agent usage

The original local Codex session retains cumulative usage counters. A content-free
extraction of the completed episode production turn recovers **6,990,861 input
 tokens**, including **6,904,448 cached** (86,413 uncached), plus **38,353 output
 tokens**, including **10,971 reasoning**. Total is 7,029,214 input-plus-output tokens.
Repeated context processing is included; this is not a unique-text word count.
Cached input and reasoning output are subsets, not additional token categories.

`evidence/agent-usage.json` records the selected model/turn, start/end counters and
derivation; `agent-token-events.json` contains only timestamped counters, with no
conversation, instruction or tool payloads. `tools/extract_agent_usage.py` can
repeat the extraction from a locally retained rollout. The extraction deliberately
excludes the later repository-building turn and cached replay.

Full original model-turn elapsed time is **1,103.259 seconds**. The older **991.9 s**
clock stopped earlier during packaging. Both are retained with separate scopes;
neither is measured human effort. No actual agent invoice is available. Optional
per-million cached/uncached/output rates produce scenarios, not billed charges.
