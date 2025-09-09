# TIM3 Onboarding

Purpose: give any contributor or agent a fast, reliable path to understand the project, deploy/verify processes, sync configuration, and hand off work cleanly.

## TL;DR

- Read: `docs/STATUS.md` (snapshot + Next Steps)
- Check PIDs: `docs/PIDs.md`
- Verify (inside AOS):
  - `aos --load contracts/verify/verify-test-processes.lua`
  - `aos --load contracts/scripts/verify-e2e.lua`
- Handoff: update `docs/STATUS.md`, add bullets to `docs/IMPLEMENTATION_LOG.md`, open a “Next Step” issue if needed.

## Project Overview

- TIM3 is a 1:1 collateralized token minted against USDA (Mock USDA in dev) on AO/AOS.
- Processes:
  - Coordinator (orchestrates mint/burn flows)
  - Lock Manager (collateral lock/unlock)
  - Token Manager (TIM3 balances, mint/burn/transfer)
  - State Manager (positions and health)
  - Mock USDA (development token)

## Key Locations

- Build artifacts (AO processes): `ao/*/build/process.lua`
- Loads (relative .load wrappers): `contracts/loads/*.load`
- Verification (inside AOS):
  - Health: `contracts/verify/verify-test-processes.lua`
  - End-to-end: `contracts/scripts/verify-e2e.lua`
- PIDs (source of truth): `docs/PIDs.md`
- PID sync script: `tools/update_pids.py`
- Handoff + status:
  - `docs/HANDOFF.md`
  - `docs/STATUS.md`
  - `docs/ARCHITECTURE.md` (background)

## Deploy / Redeploy (AOS)

1) Open AOS and create/select a process
2) Load the process code using the relative loaders:
   - `.load contracts/loads/mock-usda.load`
   - `.load contracts/loads/lock-manager.load`
   - `.load contracts/loads/token-manager.load`
   - `.load contracts/loads/state-manager.load`
   - `.load contracts/loads/coordinator.load`
3) Copy the printed `PID: <id>` for each and paste into `docs/PIDs.md` (TEST or PROD)

## Sync PIDs into Code

After updating `docs/PIDs.md`:

```bash
python3 tools/update_pids.py --env TEST
```

This updates:
- `contracts/scripts/configure-integration.lua`
- `contracts/scripts/verify-e2e.lua`
- `contracts/verify/verify-test-processes.lua`

Review with `git diff` and commit.

## Verify in AOS

- Health check:
  - `aos --load contracts/verify/verify-test-processes.lua`
- End-to-end USDA → TIM3 mint demo:
  - `aos --load contracts/scripts/verify-e2e.lua`

 Notes:
 - The E2E demo uses a small 0.01 amount and the deposit-based path:
   - Sets `AllowedUSDAProcess` on the Coordinator so Credit-Notice can initiate mint
   - Sets Token Manager `MinMintAmount=0.01` so small mints succeed
   - Transfers 0.01 Mock USDA to the Coordinator (Credit-Notice) instead of calling `MintTIM3`
 - The script may also apply a runtime Lock Manager transfer-based fix via Eval for testing. It does not change source unless we adopt it.

## Handoff Protocol

- At end of session:
  - Update `docs/STATUS.md` (What works now + Next Steps)
  - Append bullets + commit SHA in `docs/IMPLEMENTATION_LOG.md`
  - If work remains, open an issue using `.github/ISSUE_TEMPLATE/next-step.md`
  - Ensure `docs/PIDs.md` reflects the latest PIDs

## Gotchas

- Deployed processes live on AO; local file moves don’t affect them.
- If PIDs are stale/unreachable, redeploy with the loads and update `docs/PIDs.md`.
- Keep secrets/wallets out of the repo; use your local AOS session.
