# 🏭 TIM3 Production Deployment Guide

**Created**: August 30, 2025  
**Purpose**: Deploy State Manager-fixed orchestrator to production environment  
**Status**: Ready for production deployment when needed

## 🎯 **Overview**

This guide covers deploying the State Manager-fixed orchestrator from TEST environment to PRODUCTION environment with real economic value.

## ⚠️ **Pre-Deployment Checklist**

### **Test Environment Validation** ✅
- [x] State Manager integration tested in TEST environment ✅ **COMPLETED 8/30/25**
- [x] Process Flow Diagram shows State Manager activity during mint/burn ✅ **VISUALLY CONFIRMED**
- [ ] Integration tests pass with TEST processes ⚠️ **Token Manager auth needed**
- [x] No regressions in existing functionality ✅ **CONFIRMED**

### **Critical Learnings from Test Deployment**
- ✅ **AOS Environment**: `os.time()` not available - removed from responses
- ✅ **Configuration Method**: Use `Data` field instead of `Tags` for reliability
- ✅ **Process Authorization**: Each process needs explicit coordinator authorization
- ✅ **Frontend Sync**: Process IDs must match exactly between frontend/backend

### **Production Readiness**
- [ ] Real USDA process confirmed: `FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8`
- [ ] Production processes verified and operational
- [ ] Backup plan established (can revert to old coordinator)
- [ ] Team approval for production deployment

## 🚀 **Production Deployment Steps**

### **Step 1: Deploy Orchestrator to Production AO**
```bash
# Use same built orchestrator from test environment
cd /Users/ryanjames/Documents/CRØSS/W3B/S3ARCH/apps/tim3

# Deploy to production AO network
aos tim3-orchestrator-production

# Essential JSON compatibility
json = require('json')

# Load same orchestrator code
.load ao/coordinator/build/process.lua
```

### **Step 2: Configure with PRODUCTION Process IDs**
```lua
-- Configure with PRODUCTION processes (REAL ECONOMIC VALUE)
Send({ Target = ao.id, Action = "SetMockUsdaProcess", Tags = { ProcessId = "FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8" }})

Send({ Target = ao.id, Action = "SetStateManagerProcess", Tags = { ProcessId = "K2FjwiTmncglx0pISNMft5-SngxW-HUjs9sctzmXtU4" }})

Send({ Target = ao.id, Action = "SetLockManagerProcess", Tags = { ProcessId = "MWxRVsCDoSzQ0MhG4_BWkYs0fhcULB-OO3f2t1RlBAs" }})

Send({ Target = ao.id, Action = "SetTokenManagerProcess", Tags = { ProcessId = "BUhWwGfuD1GUHVIIWF_Jhm1mfcyAYHOJS6W90ur2Bb0" }})
```

### **Step 3: Verify Production Configuration**
```lua
Send({ Target = ao.id, Action = "GetConfig" })
```

### **Step 4: Update Frontend for Production**
```typescript
// File: apps/s3arch-gateway/src/ao/processes.ts
export const ENVIRONMENT = 'production' as 'test' | 'production'

// Update production coordinator process ID
const PRODUCTION_PROCESSES = {
  coordinator: {
    processId: 'NEW_PRODUCTION_ORCHESTRATOR_PROCESS_ID', // From Step 1
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
  // ... other processes remain the same
}
```

## 🧪 **Production Verification**

### **Critical Tests**
1. **Process Flow Diagram**: State Manager should show activity during operations
2. **Small Test Mint**: Use minimal real USDA amount to verify flow
3. **State Manager Logging**: Verify UpdatePosition calls in console
4. **Rollback Test**: Ensure old coordinator still accessible if needed

### **Success Criteria**
- ✅ State Manager integration active in production
- ✅ All existing functionality preserved  
- ✅ Real USDA operations work correctly
- ✅ No economic value lost during deployment

## 🛡️ **Rollback Plan**

If production deployment fails:
1. **Immediate**: Revert frontend to old production coordinator
2. **Verify**: Old coordinator still functional with real USDA
3. **Debug**: Use Process Flow Diagram to identify issues
4. **Fix**: Address issues in test environment first
5. **Retry**: Re-attempt production deployment after fixes

## 📋 **Process ID Reference**

### **Production Environment**
- **Real USDA**: `FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8`
- **State Manager**: `K2FjwiTmncglx0pISNMft5-SngxW-HUjs9sctzmXtU4`
- **Lock Manager**: `MWxRVsCDoSzQ0MhG4_BWkYs0fhcULB-OO3f2t1RlBAs`
- **Token Manager**: `BUhWwGfuD1GUHVIIWF_Jhm1mfcyAYHOJS6W90ur2Bb0`

### **Test Environment (Reference)**
- **Mock USDA**: `u8DzisIMWnrfGa6nlQvf1J79kYkv8uWjDeXZ489UMXQ`
- **Test Orchestrator**: `uNhmrUij4u6ZZr_39BDI5E2G2afkit8oC7q4vAtRskM`

## 🎯 **Key Advantages**

1. **Same Code**: Orchestrator code identical between test and production
2. **Proven**: State Manager integration tested thoroughly in test environment
3. **Safe**: Configuration-based approach minimizes deployment risk
4. **Reversible**: Can rollback to old coordinator if needed
5. **Visual**: Process Flow Diagram provides immediate feedback

---

**Ready for production when test validation is complete!** 🚀

---

## 🧩 Coordinator v2 (Deposit-Based, 1:1) – Spec and Migration

The production path is simplified to a deposit-triggered mint with no Lock Manager dependency. Users deposit USDA directly to the Coordinator (acts as custody for now). The Coordinator mints TIM3 1:1 on USDA Credit-Notice. All coordination remains deterministic on AO.

### Decisions (Confirmed)
- collateralRatio: 1.0 (no fees)
- Deposit recipient: Coordinator now; Vault later
- Reuse production Token Manager and USDA PIDs recorded in this repo
- Frontend is non-authoritative; logic runs in AO processes

### Coordinator v2 – Configuration
- tokenManagerProcess: `BUhWwGfuD1GUHVIIWF_Jhm1mfcyAYHOJS6W90ur2Bb0`
- stateManagerProcess: `K2FjwiTmncglx0pISNMft5-SngxW-HUjs9sctzmXtU4` (optional)
- allowedUSDAProcess: `FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8`
- collateralRatio: `1.0`
- systemActive: `true`

### Coordinator v2 – Handlers
- SetProcessConfig
  - Tags: `TokenManagerProcess`, `StateManagerProcess`, `AllowedUSDAProcess`, `CollateralRatio`
  - Emits: `Configure-Response`
- Credit-Notice (mint trigger)
  - Guards: `msg.From == allowedUSDAProcess`, `msg.To == ao.id`
  - Parse Tags: `Sender`, `Quantity`
  - Compute: `tim3Amount = Quantity` (1:1)
  - Send → Token Manager: `Action=Mint`, Tags: `Recipient=<Sender>`, `Amount=<tim3Amount>`, `Purpose=TIM3-mint-<id>`
  - Optional: persist position to State Manager; emit user progress/complete events
- RedeemTIM3 (optional, phase 2)
  - Burn first, then USDA `Transfer` back to user for the same amount

### Message Tags (Wire Protocol)
- Deposit (user → USDA):
  - `Action: Transfer`
  - Tags: `Recipient=<CoordinatorPID>`, `Quantity=<amount>`
- USDA → Coordinator (mint trigger):
  - `Action: Credit-Notice`
  - Tags: includes `Sender`, `Quantity`
- Coordinator → Token Manager (mint):
  - `Action: Mint`
  - Tags: `Recipient=<Sender>`, `Amount=<Quantity>`, `Purpose=TIM3-mint-<id>`

### Migration Plan (No Vault yet)
1) Deploy Coordinator v2 (new process) from `apps/tim3/ao/coordinator/build/process.lua`.
2) Configure processes via `SetProcessConfig` with the PIDs above; set `CollateralRatio=1.0` and `SystemActive=true`.
3) Ensure Token Manager authorizes Coordinator v2 for minting (add to `allowedMinters`).
4) Update the UI (or scripts) to set USDA `Transfer.Recipient = <Coordinator v2 PID>` for deposits.
5) Verify on `ao.link` that `Credit-Notice → Mint` emits as expected; perform a small live mint test.

### Rollback
- Change the USDA `Transfer.Recipient` back to the prior Coordinator PID.
- Optionally pause Coordinator v2 via an emergency flag if implemented.

### Notes
- Lock Manager is not used in this deposit-based 1:1 model; keep the process deployed but inactive.
- Introduce a minimal Vault later for custody separation (Coordinator becomes logic-only).

