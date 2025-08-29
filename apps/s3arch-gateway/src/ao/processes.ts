export const TIM3_PROCESSES = {
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
  // Production USDA process
  usda: {
    processId: 'FBt9A5GA_KXMMSxA2DJ0xZbAq8sLLU2ak-YJe9zDvg8',
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
  // Keep mock USDA for development reference (inactive)
  mockUsda: {
    processId: 'u8DzisIMWnrfGa6nlQvf1J79kYkv8uWjDeXZ489UMXQ',
    scheduler: '_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA',
  },
} as const


