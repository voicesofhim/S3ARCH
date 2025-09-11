# TIM3 Architecture Timeline and Foundation

Purpose
- Capture the evolution of TIM3 within the s3arch monorepo, decisions made, and the current foundation to continue development confidently with Node + aoconnect (no AOS terminal dependency).

Executive Summary
- Began with a multi‑process design (Coordinator + Lock/Token/State + Mock USDA).
- Hit reliability/interop issues (authorization edges, message ordering, json preload variance across nodes).
- Introduced a single atomic production contract for 1:1 USDA→TIM3 mint/burn; this path produced the first successful mint and is the recommended foundation going forward.
- Keep coordinator + sub‑process flows for research/advanced scenarios, not the core mint path.

Key Timeline (highlights)
- 2025‑01‑27/28: All 5 processes deployed to AOS; json preload issues identified and fixed; multi‑process integration validated.
- 2025‑08‑28: All processes deployed; coordinator and integration docs expanded.
- 2025‑08‑29: Ticker cleanup “TIM3‑COORD → TIM3”; production swap UI work; state‑manager bug discovered and triaged.
- 2025‑08‑30: Coordinator v2 spec recorded (deposit→Credit‑Notice→Mint via Token Manager).
- 2025‑09‑01: “95% Production System Ready” across 5 processes; one config from first mint.
- 2025‑09‑02: First successful mint milestone with atomic approach (Node + aoconnect).

Current Architecture
- Atomic Production Contract: Single process handles Info/Stats/Balance, mints 1:1 on USDA Credit‑Notice, burns by returning USDA.
  - Source: `apps/tim3/tim3-production.lua`
  - aoconnect CLI: `apps/tim3/src/ao/runner.ts` (spawn + Eval + send + result + tail)
- Coordinator + Sub‑Processes (legacy/advanced): Orchestrator sequences Lock→Token→State with circuit breakers and monitoring.
  - Coordinator: `apps/tim3/ao/coordinator/src/process.lua`
  - Test config: `apps/tim3/test-processes-complete.yaml`
  - JSON scenarios: `apps/tim3/tests/scenarios/*.json`

Operational Guidance (Node + aoconnect)
- Deploy/Eval/Send without AOS terminal:
  - Deploy: `npm --workspace apps/tim3 run ao:deploy -- --name tim3-coordinator-enhanced --config apps/tim3/processes.yaml --file apps/tim3/tim3-production.lua`
  - Send Info: `npm --workspace apps/tim3 run ao:send -- --process <PID> --action Info --wait 10000`
  - Fetch Result: `npm --workspace apps/tim3 run ao:result -- --process <PID> --message <MID>`
- Env: `.env.local` with `AO_WALLET_FILE` or `AO_WALLET_JSON` (never commit secrets).

Ticker and Decimals
- Ticker
  - Atomic contract default: `Ticker = "TIM3"`.
  - Coordinator Info sometimes reports `ticker: "TIM3-COORD"` (runtime label on coordinator), which is not the user token ticker.
  - Action: keep current runtime labels during validation; finalize on “TIM3” for production token identity.
- Decimals
  - Atomic contract sets `Denomination = 6` in `tim3-production.lua`.
  - Prior notes suggest 12 decimals (1e12 = 1 TIM3). This is a mismatch.
  - Action: choose 6 or 12 and align contract, gateway math, docs, and scenarios before production UX hardening.

Testing Notes and Known Pitfalls
- json preload variance
  - Some nodes present `aos-0.2.1` without `json` global; handlers using `json.decode/encode` fail (“attempt to index a nil value (global 'json')”).
  - Workarounds: deploy to nodes with json preloaded (e.g., environments showing `aos-2.0.4`) or ensure code includes `json = require('json')` when applicable to the runtime.
- Scenarios
  - JSON scenarios currently target the coordinator test process and may fail on nodes missing json.
  - Consider dedicated test configs for the atomic contract and pinning to known‑good module/scheduler pairs for reliability.

Design Decision Record (ADR)
- Decision: Use a single atomic process for USDA→TIM3 1:1 mint/burn as the production foundation.
- Rationale: Simplifies authorization, retries, and observability; proved to work with first successful mint via aoconnect.
- Status: Accepted; coordinator + sub‑process flows remain available for advanced scenarios and future extensions.

Action Items
- Standardize token identity: finalize ticker as “TIM3” and align all outputs.
- Decide decimals (6 vs 12) and update contract, gateway, docs, and scenarios accordingly.
- Add atomic‑focused scenarios and a test YAML pointing to known‑good nodes.
- Keep coordinator scenarios labeled “advanced/legacy”; improve json robustness if we continue to test them broadly.

Pointers (evidence & entry points)
- Atomic contract: `apps/tim3/tim3-production.lua`
- Orchestrator (coordinator): `apps/tim3/ao/coordinator/src/process.lua`
- aoconnect CLI: `apps/tim3/src/ao/runner.ts`
- Scenarios: `apps/tim3/tests/scenarios/*.json`
- Process configs: `apps/tim3/test-processes-complete.yaml`, `apps/tim3/processes.yaml`

