-- TIM3 Historic First Mint Test
-- Using correct production PIDs from handoff documentation

print("🎯 HISTORIC TIM3 MINT TEST")
print("==========================")

-- Correct Production PIDs
COORDINATOR = "dxkd6zkK2t5k0fv_-eG3WRTtZaExetLV0410xI6jfsw"
TOKEN_MANAGER = "BUhWwGfuD1GUHVIIWF_Jhm1mfcyAYHOJS6W90ur2Bb0"
LOCK_MANAGER = "MWxRVsCDoSzQ0MhG4_BWkYs0fhcULB-OO3f2t1RlBAs"
USDA_PROCESS = "FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8"
WANDER_WALLET = "2fSKy8T_MWCk4RRBtZwGL8TECg9wDCuQD90Y2IeyRQg"

function checkTIM3Balance()
    print("💰 Checking current TIM3 balance...")
    Send({
        Target = TOKEN_MANAGER,
        Action = "Balance",
        Tags = {Target = WANDER_WALLET}
    })
    print("✅ Balance check sent - check Inbox[#Inbox]")
end

function checkUsdaBalance()
    print("💵 Checking USDA collateral balance...")
    Send({
        Target = USDA_PROCESS,
        Action = "Balance",
        Tags = {Recipient = WANDER_WALLET}
    })
    print("✅ USDA balance check sent - check Inbox[#Inbox]")
end

function checkLockManagerStatus()
    print("🔒 Checking Lock Manager configuration...")
    Send({
        Target = LOCK_MANAGER,
        Action = "Info"
    })
    print("✅ Lock Manager info sent - check Inbox[#Inbox]")
end

function setLockManagerConfig()
    print("⚙️ Setting Lock Manager USDA configuration...")
    Send({
        Target = LOCK_MANAGER,
        Action = "Eval",
        Data = "Config.mockUsdaProcess='" .. USDA_PROCESS .. "'; print('USDA Process set:', Config.mockUsdaProcess)"
    })
    print("✅ Configuration sent - check Inbox[#Inbox]")
end

function mintTIM3()
    print("🚀 EXECUTING HISTORIC TIM3 MINT!")
    print("Amount: 1 TIM3")
    Send({
        Target = COORDINATOR,
        Action = "MintTIM3",
        Tags = {Amount = "1"}
    })
    print("✅ Historic mint command sent!")
    print("🎉 Check Inbox[#Inbox] for mint progress...")
    print("⏳ Wait for mint to complete, then run checkTIM3Balance()")
end

print("🎯 Available functions:")
print("• checkTIM3Balance() - Check current TIM3 balance")
print("• checkUsdaBalance() - Check USDA collateral")  
print("• checkLockManagerStatus() - Check Lock Manager config")
print("• setLockManagerConfig() - Fix Lock Manager USDA config")
print("• mintTIM3() - Execute the historic first mint!")
print("")
print("🚀 SEQUENCE FOR FIRST MINT:")
print("1. checkTIM3Balance() - Should show 0")
print("2. checkUsdaBalance() - Should show 5+ USDA")
print("3. checkLockManagerStatus() - Check config status")
print("4. setLockManagerConfig() - Fix if needed")
print("5. mintTIM3() - MAKE HISTORY!")
print("6. checkTIM3Balance() - Should show 1000000000000!")
print("")
print("✨ Let there be light! ✨")