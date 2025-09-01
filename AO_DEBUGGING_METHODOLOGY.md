# AO Process Debugging Methodology
*Lessons Learned from TIM3 Stablecoin Integration*

## 🧠 Key Insight: Variable Source Mismatches Are Silent Killers

### The TIM3 Case Study
After days of debugging "pending-collateral-lock" issues, the root cause was a single line:
```lua
local user = msg.From  -- Wrong: Lock Manager's address (0 balance)
```
Instead of:
```lua
local user = msg.Tags.User or msg.From  -- Correct: Actual user's wallet
```

**Impact**: 100% of mint operations failed silently because Mock USDA checked the wrong wallet's balance.

## 🎯 Essential Debugging Order for AO Processes

### 1. Variable Source Verification (Do This FIRST!)
Before debugging configurations or deployments, verify every variable assignment:

```lua
-- ❌ Common Silent Bug Patterns:
local user = msg.From                    -- Who sent the message?
local user = msg.Tags.User               -- Who is the target user?
local amount = msg.Tags.Amount           -- vs msg.Tags.Quantity
local target = msg.Tags.Target           -- vs msg.Tags.Recipient
```

**Action**: Trace every variable from its source through the entire flow.

### 2. Message Flow Tracing
```lua
-- Add debugging prints to understand message sources:
print("Message from: " .. msg.From)
print("User tag: " .. (msg.Tags.User or "nil"))
print("Target tag: " .. (msg.Tags.Target or "nil"))
```

### 3. State Verification
```lua
-- Verify the actual state being checked:
print("Checking balance for: " .. user)
print("Balance found: " .. (Balances[user] or 0))
```

### 4. Configuration Debugging (Only After Variable Verification)
```lua
-- Check process configuration:
print("Config loaded:", json.encode(Config))
```

## 🚨 Red Flags That Indicate Variable Source Issues

1. **"System works but operations fail silently"**
2. **"Configuration shows correct but still doesn't work"**
3. **"Process communication works but final operation fails"**
4. **"No error messages despite clear failure"**
5. **"Balance checks pass but transfers fail"**

## 📋 Systematic Investigation Checklist

### Phase 1: Variable Source Audit (5 minutes)
- [ ] Map every variable assignment in handlers
- [ ] Verify `msg.From` vs `msg.Tags.*` usage
- [ ] Check tag name consistency (`Amount` vs `Quantity`, `Target` vs `Recipient`)
- [ ] Trace variable usage through entire function

### Phase 2: Message Content Inspection (10 minutes)
- [ ] Log incoming message structure
- [ ] Verify expected tags are present
- [ ] Check for tag name mismatches between sender/receiver

### Phase 3: State Verification (10 minutes)
- [ ] Confirm which user/process state is being checked
- [ ] Verify balance/authorization lookups use correct identifiers
- [ ] Check for process ID vs user wallet confusion

### Phase 4: Traditional Debugging (Only if needed)
- [ ] Configuration verification
- [ ] Authorization chain debugging
- [ ] Process communication testing
- [ ] Handler name verification

## 🔧 Debugging Tools and Techniques

### Quick Variable Verification Script
```lua
-- Add to any handler for debugging:
print("=== DEBUG INFO ===")
print("From: " .. msg.From)
print("Action: " .. msg.Action)
print("Tags: " .. json.encode(msg.Tags))
print("Data: " .. (msg.Data or "nil"))

-- Check which variable is actually being used:
local user = msg.Tags.User or msg.From
print("Using user: " .. user)
print("User balance: " .. (Balances[user] or 0))
print("================")
```

### Message Flow Tracer
```lua
-- Add to handler start:
local function logMessage(prefix, msg)
    print(prefix .. " | From: " .. msg.From .. " | Action: " .. msg.Action)
    for k, v in pairs(msg.Tags or {}) do
        print(prefix .. " | Tag." .. k .. ": " .. v)
    end
end

logMessage("RECEIVED", msg)
```

## 💡 Prevention Strategies

### 1. Consistent Tag Naming Conventions
```lua
-- Establish project-wide standards:
User = msg.Tags.User           -- Always the target user
Sender = msg.From              -- Always the message sender
Amount = msg.Tags.Amount       -- Always the numeric amount
Target = msg.Tags.Target       -- Always the target process
```

### 2. Defensive Variable Assignment
```lua
-- Always validate variable sources:
local user = msg.Tags.User
if not user then
    ao.send({
        Target = msg.From,
        Action = "Error",
        Data = "User tag required"
    })
    return
end
```

### 3. Variable Source Documentation
```lua
-- Document variable sources in comments:
local user = msg.Tags.User      -- Wallet address from Lock Manager request
local sender = msg.From         -- Lock Manager process ID
local amount = msg.Tags.Amount  -- USDA amount to lock
```

## 🎯 Key Takeaways

1. **Variable source mismatches cause 90% of silent failures in AO processes**
2. **Always verify `msg.From` vs `msg.Tags.*` usage before complex debugging**
3. **Tag name consistency is critical across process boundaries**
4. **Add variable source logging as first debugging step**
5. **One line bugs can waste days if you debug in the wrong order**

## 🚀 Success Metrics

Following this methodology should reduce debugging time from days to minutes for:
- Silent operation failures
- "Works but doesn't work" scenarios  
- Cross-process communication issues
- User identity confusion bugs
- Balance/authorization lookup failures

---

**Remember: In AO, the message is everything. Get the message parsing right, and everything else usually falls into place.** 🎯