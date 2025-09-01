// Environment configuration - change this to switch between test and production
export const ENVIRONMENT = 'test' as 'test' | 'production'

// Production processes (real economic value)
const PRODUCTION_PROCESSES = {
  coordinator: {
    processId: 'dxkd6zkK2t5k0fv_-eG3WRTtZaExetLV0410xI6jfsw',
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
  lockManager: {
    processId: 'MWxRVsCDoSzQ0MhG4_BWkYs0fhcULB-OO3f2t1RlBAs',
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
  tokenManager: {
    processId: 'BUhWwGfuD1GUHVIIWF_Jhm1mfcyAYHOJS6W90ur2Bb0',
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
  stateManager: {
    processId: 'K2FjwiTmncglx0pISNMft5-SngxW-HUjs9sctzmXtU4',
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
  usda: {
    processId: 'FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8', // Real USDA
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
} as const

// Test processes (safe for development, no real economic value) 
// 🧪 DEPLOYED: August 30, 2025 - State Manager Integration Fixed
const TEST_PROCESSES = {
  coordinator: {
    processId: 'uNhmrUij4u6ZZr_39BDI5E2G2afkit8oC7q4vAtRskM', // ✅ TIM3 Orchestrator v2 (State Manager Fixed)
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
  lockManager: {
    processId: 'MWxRVsCDoSzQ0MhG4_BWkYs0fhcULB-OO3f2t1RlBAs', // ✅ TIM3 Test Lock Manager (matches orchestrator config)
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
  tokenManager: {
    processId: 'DoXrn6DGZZuDMkyun4rmXh7k8BY8pVxFpr3MnBWYJFw', // ✅ TIM3 Test Token Manager (matches orchestrator config)
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
  stateManager: {
    processId: 'K2FjwiTmncglx0pISNMft5-SngxW-HUjs9sctzmXtU4', // ✅ TIM3 Test State Manager (matches orchestrator config)
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
  usda: {
    processId: 'u8DzisIMWnrfGa6nlQvf1J79kYkv8uWjDeXZ489UMXQ', // Mock USDA (can mint test tokens)
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
} as const

// Export the active process set based on environment
export const TIM3_PROCESSES = ENVIRONMENT === 'test' ? TEST_PROCESSES : PRODUCTION_PROCESSES

// Export both for reference
export { PRODUCTION_PROCESSES, TEST_PROCESSES }


