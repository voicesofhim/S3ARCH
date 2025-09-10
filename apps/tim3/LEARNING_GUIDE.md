TIM3 Learning Guide (Beginner Friendly)

What is AO and aoconnect?
- AO: A decentralized compute layer on Arweave. Code runs as processes that receive messages and send responses.
- aoconnect: A JavaScript SDK to spawn processes, send messages, and read results.

How do our TIM3 contracts work?
- Lua processes define handlers using tags (e.g., Action=Info).
- When you send a message with Action=Info, the process replies with Info-Response.

Where do I run things?
- Local Node scripts (no interactive AOS terminal needed):
  - Runner CLI: deploy/send/result/tail
  - Scenario runner: executes JSON test flows

Configure your wallet (test-only recommended)
- In `.env.local` (repo root), set: `AO_WALLET_FILE=/absolute/path/to/testnet-wallet.json`
- Never commit wallet keys to the repo.

Key commands
- Deploy Lua code into a process:
  - `npm --workspace apps/tim3 run ao:deploy -- --name tim3-coordinator-enhanced --config apps/tim3/processes.yaml --file apps/tim3/tim3-production.lua`
- Send a message and wait for the response:
  - `npm --workspace apps/tim3 run ao:send -- --process <PID> --action Info`
- Tail messages (polling):
  - `npm --workspace apps/tim3 run ao:tail -- --process <PID>`
- Run a baseline scenario (auto-spawn if needed):
  - `npm --workspace apps/tim3 run ao:scenarios -- --file apps/tim3/tests/scenarios/info-stats-balance.json`

How the pieces fit
- aoconnect primitives:
  - spawn: create a new process using a Module + Scheduler
  - message: send a tagged message (e.g., Action=Info)
  - result/results: fetch the response for a message or poll recent outputs
- Our wrappers:
  - `packages/ao-client` gives tiny helpers for tags, signer, YAML config, and deployment
  - `apps/tim3/src/ao/runner.ts` offers a CLI that uses aoconnect directly
  - `apps/tim3/src/ao/scenario-runner.ts` reads JSON to run repeatable flows

What to learn next
- Read `apps/tim3/AO_DEVELOPMENT.md` for more detail
- Skim the code comments in `runner.ts` and `packages/ao-client` to understand each step
- When comfortable, try adding a new scenario JSON with an extra Action

Safety
- Use test processes and wallets until you’re confident
- Keep `.env.local` local; never commit secrets

