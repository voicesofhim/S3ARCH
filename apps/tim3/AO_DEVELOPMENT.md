TIM3 AO Development (Node + aoconnect)

Overview
- Use `@permaweb/aoconnect` from Node to deploy (spawn) AO processes, send messages, await results, and poll outputs.
- Scripts live under `apps/tim3/src/ao/runner.ts` and are exposed via npm scripts.

Related Docs
- Architecture timeline and current foundation: `apps/tim3/TIM3_ARCHITECTURE_TIMELINE.md`

Scenarios
- Preferred (Atomic): `apps/tim3/tests/scenarios/atomic-info-stats-balance.json` using `apps/tim3/test-processes-atomic.yaml`.
- Legacy/Advanced (Coordinator): `apps/tim3/tests/scenarios/*.json` using `apps/tim3/test-processes-complete.yaml`.
- Artifacts: `apps/tim3/.runs/<timestamp>/`. Some nodes lack `json`; prefer Atomic scenarios for reliability.

Atomic Mint Demo (0.01 USDA)
- Run: `npm --workspace apps/tim3 run ao:demo:atomic`
- What it does: Spawns the atomic test contract (wired to Mock USDA), mints 0.02 USDA to your wallet, transfers 0.01 to TIM3, then fetches Stats. Use this to validate 1:1 mint without AOS.

Atomic Burn Demo (0.01 TIM3)
- Run: `npm --workspace apps/tim3 run ao:demo:burn`
- What it does: Deploys the same test contract, performs a 0.01 mint, then burns 0.01 TIM3 by sending `Transfer` with `Recipient=burn`, returning 0.01 USDA to your wallet, and prints final Stats.

Atomic Collateral Model (Mint/Burn)
- Mint (USDA → TIM3 1:1):
  - You transfer USDA to the TIM3 process (Mock USDA emits `Credit-Notice`).
  - The TIM3 process mints the exact amount of TIM3 to you and records the USDA as collateral (held by the TIM3 process).
- Burn (TIM3 → USDA 1:1):
  - You send `Transfer` to TIM3 with `Recipient=burn` and `Quantity=<amount>`.
  - TIM3 burns your TIM3 balance and sends an equal amount of USDA back to you.
  - Partial redemption is supported (e.g., keep 50 TIM3 and burn 50 TIM3 to receive 50 USDA).
- Health/ratio:
  - `TotalSupply` mirrors `UsdaCollateral` and `CollateralRatio` remains 1 when in balance.
  - Stats report swaps/burns/volume and unique users.

Decimals and Ticker
- Decimals: TIM3 and Mock USDA use 6 decimals for simplicity and exact 1:1 math.
- Ticker: Use `TIM3` for the token. Coordinator labels (e.g., `TIM3-COORD`) may appear in legacy flows—treat them as metadata, not the user token.

Requirements
- Node 18+ (repo uses engines >=18)
- Arweave JWK wallet file for signing messages (testnet recommended)
- `.env.local` in repo root for local settings (never commit secrets)

Env vars (read from `.env.local` if present)
- `AO_WALLET_FILE` path to your JWK JSON (e.g. `./wallet.json`)
- `AO_WALLET_JSON` inline JSON for JWK (alternative to file)
- Optional endpoint overrides:
  - `AO_MU_URL`, `AO_CU_URL`, `AO_GATEWAY_URL`

Quick start
- Install workspaces: `npm run install:workspaces`
- Deploy from YAML + Lua (spawns then Eval uploads code):
  - `npm --workspace apps/tim3 run ao:deploy -- --name tim3-coordinator-enhanced --config apps/tim3/processes.yaml --file apps/tim3/tim3-production.lua`
- Send a message and wait for result:
  - `npm --workspace apps/tim3 run ao:send -- --process <PID> --action Info --tags Env=dev`
- Fetch a specific result:
  - `npm --workspace apps/tim3 run ao:result -- --process <PID> --message <MID>`
- Tail outputs (polling):
  - `npm --workspace apps/tim3 run ao:tail -- --process <PID>`

Reproducible scenarios (JSON)
- From the apps/tim3 directory context, use relative paths:
  - `npm --workspace apps/tim3 run ao:scenarios -- --file tests/scenarios/info-stats-balance.json`
  - `npm --workspace apps/tim3 run ao:scenarios -- --file tests/scenarios/mint-burn-smoke.json`
  - Artifacts saved under `apps/tim3/.runs/<timestamp>/`

Notes
- The runner mirrors how AOS is used: first spawn a process with the correct `module` and `scheduler`, then Eval your Lua to load the code.
- YAML files: `apps/tim3/processes.yaml`, `apps/tim3/test-processes-complete.yaml` provide names, Module, Scheduler, and optional `process_id` for reuse.
- For reproducible testing, prefer the `test-processes-complete.yaml` entries and create JSON cases (future step).

Safety
- Never commit wallet keys. Use `.env.local` with `AO_WALLET_FILE` and keep it gitignored.
- Use testnet/mocks until you are ready for production processes.
