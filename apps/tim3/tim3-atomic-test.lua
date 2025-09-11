-- TIM3 Atomic Test Contract (Test-only variant)
-- Mirrors tim3-production.lua but uses Mock USDA for Credit-Notice and sets production flags off

json = require('json')

-- Token Configuration
Name = Name or "TIM3 Test"
Ticker = Ticker or "TIM3"
Denomination = Denomination or 6
Logo = Logo or "TIM3_TEST_LOGO"

-- Process Configuration (Test)
-- Use Mock USDA process for development Credit-Notice
USDA_PROCESS_ID = "u8DzisIMWnrfGa6nlQvf1J79kYkv8uWjDeXZ489UMXQ"

-- Admin Configuration
ADMIN_ADDRESS = ADMIN_ADDRESS or ao.id -- not used in this demo
IS_PRODUCTION = false

-- State Variables
Balances = Balances or {}
TotalSupply = TotalSupply or 0
UsdaCollateral = UsdaCollateral or 0

-- Statistics
SwapStats = SwapStats or {
    totalSwaps = 0,
    totalBurns = 0,
    totalVolume = 0,
    uniqueUsers = 0,
    lastSwapTime = 0
}

-- User tracking
UniqueUsers = UniqueUsers or {}

local function isAdmin(address)
    return address == ADMIN_ADDRESS
end

local function mint(recipient, amount)
    if not UniqueUsers[recipient] then
        UniqueUsers[recipient] = true
        SwapStats.uniqueUsers = SwapStats.uniqueUsers + 1
    end
    Balances[recipient] = (Balances[recipient] or 0) + amount
    TotalSupply = TotalSupply + amount
    SwapStats.lastSwapTime = os.time()
end

local function burn(user, amount)
    local balance = Balances[user] or 0
    if balance >= amount then
        Balances[user] = balance - amount
        TotalSupply = TotalSupply - amount
        return true
    end
    return false
end

Handlers.add("Info", Handlers.utils.hasMatchingTag("Action", "Info"), function(msg)
    ao.send({
        Target = msg.From,
        Action = "Info-Response",
        Data = json.encode({
            Name = Name,
            Ticker = Ticker,
            Logo = Logo,
            Denomination = Denomination,
            TotalSupply = tostring(TotalSupply),
            UsdaCollateral = tostring(UsdaCollateral),
            SwapStats = SwapStats,
            ProcessId = ao.id,
            UsdaProcess = USDA_PROCESS_ID,
            IsProduction = IS_PRODUCTION
        })
    })
end)

Handlers.add("Balance", Handlers.utils.hasMatchingTag("Action", "Balance"), function(msg)
    local target = msg.Tags.Target or msg.Tags.Recipient or msg.From
    local balance = tostring(Balances[target] or 0)
    ao.send({
        Target = msg.From,
        Action = "Balance-Response",
        Data = json.encode({ target = target, balance = balance, account = target, ticker = Ticker })
    })
end)

Handlers.add("Balances", Handlers.utils.hasMatchingTag("Action", "Balances"), function(msg)
    ao.send({ Target = msg.From, Action = "Balances-Response", Data = json.encode(Balances) })
end)

-- Receive USDA transfers and mint TIM3 (1:1)
Handlers.add("USDA-Credit-Notice", Handlers.utils.hasMatchingTag("Action", "Credit-Notice"), function(msg)
    if msg.From ~= USDA_PROCESS_ID then return end
    local creditData = json.decode(msg.Data or "{}")
    local user = creditData.Sender or creditData.sender or creditData.from
    local amount = tonumber(creditData.Quantity or creditData.quantity or creditData.amount or "0")
    if not user or amount <= 0 then return end
    mint(user, amount)
    UsdaCollateral = UsdaCollateral + amount
    SwapStats.totalSwaps = SwapStats.totalSwaps + 1
    SwapStats.totalVolume = SwapStats.totalVolume + amount
    ao.send({
        Target = user,
        Action = "Swap-Success",
        Data = json.encode({
            usdaReceived = tostring(amount),
            tim3Minted = tostring(amount),
            newBalance = tostring(Balances[user]),
            swapId = user .. "-swap-" .. tostring(os.time()),
            timestamp = os.time()
        })
    })
end)

Handlers.add("Stats", Handlers.utils.hasMatchingTag("Action", "Stats"), function(msg)
    ao.send({
        Target = msg.From,
        Action = "Stats-Response",
        Data = json.encode({
            TotalSupply = tostring(TotalSupply),
            UsdaCollateral = tostring(UsdaCollateral),
            CollateralRatio = UsdaCollateral > 0 and (TotalSupply / UsdaCollateral) or 0,
            SwapStats = SwapStats,
            UniqueUsers = SwapStats.uniqueUsers,
            IsHealthy = (TotalSupply == UsdaCollateral)
        })
    })
end)

print("TIM3 ATOMIC TEST LOADED (USDA: " .. USDA_PROCESS_ID .. ")")

