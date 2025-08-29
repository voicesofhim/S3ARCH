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

// Burn flow entrypoint (if exposed in UI later)
export async function requestBurnTIM3(tim3Amount: string) {
  return sendAOMessage({
    processId: TIM3_PROCESSES.coordinator.processId,
    action: 'BurnTIM3',
    tags: { Amount: tim3Amount },
  })
}


