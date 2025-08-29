import { TIM3_PROCESSES, ENVIRONMENT } from './processes'
import { sendAOMessage, queryBalance } from './client'

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

// Query USDA balance (adapts to environment)
export async function getUSDABalance(target: string) {
  return queryBalance(
    TIM3_PROCESSES.usda.processId,
    TIM3_PROCESSES.usda.scheduler,
    target
  )
}

// Mint test USDA tokens (only available in test environment)
export async function mintTestUSDA(amount: string = '1000') {
  if (ENVIRONMENT !== 'test') {
    console.warn('mintTestUSDA is only available in test environment - production USDA does not support minting')
    return Promise.reject(new Error('Production USDA does not support minting'))
  }
  
  return sendAOMessage({
    processId: TIM3_PROCESSES.usda.processId, // In test mode, this will be the mock USDA
    action: 'Mint',
    tags: { Amount: amount },
  })
}

// Check coordinator status/logs
export async function getCoordinatorStatus() {
  return sendAOMessage({
    processId: TIM3_PROCESSES.coordinator.processId,
    action: 'Status',
    tags: {},
  })
}

// Configure coordinator with appropriate USDA process (adapts to environment)
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

// Get TIM3 balance from the Token Manager
export async function getTIM3Balance(target: string) {
  return queryBalance(
    TIM3_PROCESSES.tokenManager.processId,
    TIM3_PROCESSES.tokenManager.scheduler,
    target
  )
}

// Configure all test processes to work together (Coordinator, Lock Manager, Token Manager, Mock USDA)
export async function configureAllProcesses() {
  // 1) Configure Coordinator with all dependent processes
  await sendAOMessage({
    processId: TIM3_PROCESSES.coordinator.processId,
    action: 'SetProcessConfig',
    tags: {
      MockUsdaProcess: TIM3_PROCESSES.usda.processId,
      StateManagerProcess: TIM3_PROCESSES.stateManager.processId,
      LockManagerProcess: TIM3_PROCESSES.lockManager.processId,
      TokenManagerProcess: TIM3_PROCESSES.tokenManager.processId,
    },
  })

  // 2) Configure Lock Manager to trust the Coordinator and know Mock USDA
  await sendAOMessage({
    processId: TIM3_PROCESSES.lockManager.processId,
    action: 'Configure',
    tags: { ConfigType: 'CoordinatorProcess', Value: TIM3_PROCESSES.coordinator.processId },
  })
  await sendAOMessage({
    processId: TIM3_PROCESSES.lockManager.processId,
    action: 'Configure',
    tags: { ConfigType: 'MockUsdaProcess', Value: TIM3_PROCESSES.usda.processId },
  })
  // Optional: provide state manager reference if needed by your flows
  await sendAOMessage({
    processId: TIM3_PROCESSES.lockManager.processId,
    action: 'Configure',
    tags: { ConfigType: 'StateManagerProcess', Value: TIM3_PROCESSES.stateManager.processId },
  })

  // 3) Configure Token Manager to trust the Coordinator
  await sendAOMessage({
    processId: TIM3_PROCESSES.tokenManager.processId,
    action: 'Configure',
    tags: { ConfigType: 'CoordinatorProcess', Value: TIM3_PROCESSES.coordinator.processId },
  })
  // Optional: provide state manager reference
  await sendAOMessage({
    processId: TIM3_PROCESSES.tokenManager.processId,
    action: 'Configure',
    tags: { ConfigType: 'StateManagerProcess', Value: TIM3_PROCESSES.stateManager.processId },
  })
}


