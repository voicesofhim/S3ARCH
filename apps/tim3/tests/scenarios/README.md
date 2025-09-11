# TIM3 Scenarios

- Preferred: Atomic contract scenarios for day-to-day testing.
  - `atomic-info-stats-balance.json` (uses `test-processes-atomic.yaml`)
- Legacy/Advanced: Coordinator orchestrator scenarios (require multiple processes and json availability).
  - `info-stats-balance.json`, `mint-burn-smoke.json` (use `test-processes-complete.yaml`)

Notes
- These rely on Node + aoconnect via the scenario runner.
- Artifacts are saved under `apps/tim3/.runs/<timestamp>/`.
- Some nodes lack `json` preloads; prefer atomic scenarios or ensure `json` is available for coordinator flows.
