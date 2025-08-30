import { TIM3_PROCESSES, ENVIRONMENT } from './processes'
import { sendAOMessage } from './client'

// Mint flow is initiated via the Coordinator by sending Action MintTIM3
// with TIM3 amount in Tags (Amount or Quantity). The coordinator then
// orchestrates LockCollateral and Mint.
export async function requestMintTIM3(tim3Amount: string) {
  console.log('🔄 Starting TIM3 mint request...')
  console.log('📊 Mint details:', {
    tim3Amount,
    coordinatorProcess: TIM3_PROCESSES.coordinator.processId,
    action: 'MintTIM3'
  })
  
  const result = await sendAOMessage({
    processId: TIM3_PROCESSES.coordinator.processId,
    action: 'MintTIM3',
    tags: { Amount: tim3Amount },
  })
  
  console.log('✅ TIM3 mint request sent, result:', result)
  return result
}

// Query USDA balance (adapts to environment)
export async function getUSDABalance(target: string) {
  return sendAOMessage({
    processId: TIM3_PROCESSES.usda.processId,
    action: 'Balance',
    tags: { Target: target },
  })
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

// Configure coordinator with ALL required processes (adapts to environment)
export async function configureCoordinator() {
  return sendAOMessage({
    processId: TIM3_PROCESSES.coordinator.processId,
    action: 'SetProcessConfig',
    tags: { 
      MockUsdaProcess: TIM3_PROCESSES.usda.processId,
      LockManagerProcess: TIM3_PROCESSES.lockManager.processId,
      TokenManagerProcess: TIM3_PROCESSES.tokenManager.processId,
      StateManagerProcess: TIM3_PROCESSES.stateManager.processId,
    },
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


