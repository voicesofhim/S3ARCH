# TIM3 First Principles Investigation Plan
*Created: September 1, 2025*

## 🧠 Core Problem Statement

Despite all configurations being correct and all processes communicating successfully, TIM3 mints consistently fail at the "pending-collateral-lock" stage. The Lock Manager acknowledges mint requests but never progresses to "LockCollateral-Success".

## 🔍 Three Primary Hypotheses

### Hypothesis 1: USDA Process Authorization Gap
**Theory**: The Lock Manager can send messages to the USDA process but lacks authorization to actually transfer/lock USDA tokens.

**Evidence Supporting**:
- Lock Manager shows `mockUsdaConfigured: true`
- Lock Manager accepts Coordinator requests (no "Unauthorized caller" errors)
- But locks never complete despite having sufficient USDA balance

**Test Plan**:
1. Direct USDA process query from Lock Manager terminal
2. Check if Lock Manager address is authorized in USDA process
3. Verify USDA process handlers accept Lock Manager requests

### Hypothesis 2: Missing USDA Lock Handler Implementation
**Theory**: The Lock Manager's USDA interaction logic is incomplete or the USDA process doesn't implement expected locking handlers.

**Evidence Supporting**:
- Configuration works but actual lock operations fail
- No clear error messages about failed USDA interactions
- Lock remains perpetually "pending"

**Test Plan**:
1. Examine Lock Manager source code for USDA lock implementation
2. Check USDA process handlers for lock/transfer operations
3. Trace exact message flow: Lock Manager → USDA Process → Lock Manager

### Hypothesis 3: Asynchronous Response Handling Bug
**Theory**: Lock Manager sends USDA lock request but fails to process the response correctly, leaving it in pending state.

**Evidence Supporting**:
- Initial request succeeds ("LockCollateral-Pending" is created)
- No progression to success state suggests response handling issue
- Could be timing issue, handler mismatch, or response parsing problem

**Test Plan**:
1. Monitor Lock Manager inbox during mint operations
2. Check for USDA process responses that aren't being handled
3. Verify Lock Manager response handlers match USDA process response format

## 📋 Systematic Investigation Protocol

### Phase 1: Direct USDA Interaction Test
**Objective**: Verify Lock Manager can communicate with USDA process directly

```lua
-- From Lock Manager Terminal (MWxRVsCDoSzQ0MhG4_BWkYs0fhcULB-OO3f2t1RlBAs)

-- 1. Test basic USDA process communication
Send({Target="FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8", Action="Info"})

-- 2. Check Lock Manager's authorization with USDA process
Send({Target="FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8", Action="Balance", Tags={Recipient="MWxRVsCDoSzQ0MhG4_BWkYs0fhcULB-OO3f2t1RlBAs"}})

-- 3. Monitor responses
Inbox[#Inbox]  -- Check latest response
```

### Phase 2: Handler Discovery and Verification
**Objective**: Identify exact handlers implemented by USDA process

```bash
# Examine USDA process handlers (if source available)
grep -r "Handlers.add" /path/to/usda/source/
grep -r "Action.*Transfer\|Action.*Lock" /path/to/usda/source/

# Examine Lock Manager USDA interaction code
grep -r "mockUsdaProcess\|USDA" apps/tim3/ao/lock-manager/src/
```

### Phase 3: End-to-End Message Flow Tracing
**Objective**: Trace complete message chain during mint operation

```lua
-- Setup monitoring before mint attempt
-- Lock Manager Terminal: Clear inbox for clean trace
-- Then execute mint and monitor each step:

-- Step 1: User initiates mint
-- Wander Wallet Terminal:
Send({Target="dxkd6zkK2t5k0fv_-eG3WRTtZaExetLV0410xI6jfsw", Action="MintTIM3", Tags={Amount="1"}})

-- Step 2: Monitor Coordinator response
-- Coordinator Terminal:
Inbox[#Inbox]

-- Step 3: Monitor Lock Manager inbox for new messages
-- Lock Manager Terminal:
Inbox[#Inbox]
Inbox[#Inbox-1]
Inbox[#Inbox-2]

-- Step 4: Check for USDA process responses
-- Continue monitoring Lock Manager inbox for USDA responses
```

### Phase 4: Source Code Investigation
**Objective**: Understand actual implementation vs expected behavior

**Files to examine**:
1. `apps/tim3/ao/lock-manager/src/process.lua` - Lock Manager USDA interaction logic
2. Lock Manager handlers for processing USDA responses
3. Expected USDA process API (Transfer/Lock handlers)

**Key questions**:
- What handler does Lock Manager use to lock USDA?
- What response format does Lock Manager expect from USDA?
- Are there timing dependencies or state requirements?

## 🎯 Success Criteria

### Investigation Complete When:
1. **Root cause identified**: One of the three hypotheses confirmed or new hypothesis developed
2. **Precise failure point located**: Exact step in USDA interaction where failure occurs
3. **Fix strategy defined**: Clear action plan to resolve the blocking issue

### Mint Success When:
1. **TIM3 balance changes**: User balance 0 → 1000000000000 (1 TIM3)
2. **USDA locked**: Corresponding USDA amount locked as collateral
3. **System status clean**: All processes show successful completion

## 📝 Documentation Strategy

### Real-time Investigation Log
Create `TIM3_INVESTIGATION_LOG.md` to track:
- Exact commands executed
- Responses received
- Hypotheses tested and results
- New discoveries and insights

### Updated Handoff Documentation
Update `DEAR_CLAUDE_ITS_TIM3_HANDOFF.md` with:
- Investigation findings
- Confirmed working vs broken components
- Precise fix instructions (once identified)
- Lessons learned from debugging approach

## 🔧 Debugging Tools and Commands

### Essential Monitoring Commands
```lua
-- Process status checks
Send({Target="PROCESS_ID", Action="Info"})

-- Balance verification
Send({Target="BUhWwGfuD1GUHVIIWF_Jhm1mfcyAYHOJS6W90ur2Bb0", Action="Balance", Tags={Target="USER_WALLET"}})
Send({Target="FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8", Action="Balance", Tags={Recipient="USER_WALLET"}})

-- Message flow tracing
Inbox[#Inbox]     -- Latest message
Inbox[#Inbox-1]   -- Previous message
Inbox[#Inbox-2]   -- Two messages back

-- Configuration verification
Config  -- Show all config values
```

### Process PIDs Reference
```
Coordinator:    dxkd6zkK2t5k0fv_-eG3WRTtZaExetLV0410xI6jfsw
Token Manager:  BUhWwGfuD1GUHVIIWF_Jhm1mfcyAYHOJS6W90ur2Bb0
Lock Manager:   MWxRVsCDoSzQ0MhG4_BWkYs0fhcULB-OO3f2t1RlBAs
USDA Process:   FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8
Wander Wallet:  2fSKy8T_MWCk4RRBtZwGL8TECg9wDCuQD90Y2IeyRQg
```

---

**This investigation plan shifts focus from configuration assumptions to systematic flow tracing and root cause analysis. The goal is understanding the actual USDA interaction failure, not reconfiguring already-working components.**