import { TIM3_PROCESSES } from './processes'
import { sendAOMessage } from './client'

// Mint flow is initiated via the Coordinator by sending Action MintTIM3
// with TIM3 amount in Tags (Amount or Quantity). The coordinator then
// orchestrates LockCollateral and Mint.
export async function requestMintTIM3(tim3Amount: string) {
  return sendAOMessage({
    processId: TIM3_PROCESSES.coordinator.processId,
    action: 'MintTIM3',
    tags: { Amount: tim3Amount },
  })
}

// Query USDA balance (production USDA)
export async function getUSDABalance(target: string) {
  return sendAOMessage({
    processId: TIM3_PROCESSES.usda.processId,
    action: 'Balance',
    tags: { Target: target },
  })
}

// DEPRECATED: Mint test USDA tokens (kept for reference, inactive)
// Production USDA does not have a mint function
export async function mintTestUSDA(amount: string = '1000') {
  console.warn('mintTestUSDA is deprecated - production USDA does not support minting')
  return Promise.reject(new Error('Production USDA does not support minting'))
}

// Check coordinator status/logs
export async function getCoordinatorStatus() {
  return sendAOMessage({
    processId: TIM3_PROCESSES.coordinator.processId,
    action: 'Status',
    tags: {},
  })
}

// Configure coordinator with production USDA process
export async function configureCoordinator() {
  return sendAOMessage({
    processId: TIM3_PROCESSES.coordinator.processId,
    action: 'SetMockUsdaProcess',
    tags: { ProcessId: TIM3_PROCESSES.usda.processId },
  })
}

// Get coordinator configuration
export async function getCoordinatorConfig() {
  return sendAOMessage({
    processId: TIM3_PROCESSES.coordinator.processId,
    action: 'GetConfig',
    tags: {},
  })
}

// Burn flow entrypoint (if exposed in UI later)
export async function requestBurnTIM3(tim3Amount: string) {
  return sendAOMessage({
    processId: TIM3_PROCESSES.coordinator.processId,
    action: 'BurnTIM3',
    tags: { Amount: tim3Amount },
  })
}


