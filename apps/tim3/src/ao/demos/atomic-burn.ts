#!/usr/bin/env tsx
// Atomic burn demo: deploy test TIM3, mint 0.02 USDA, transfer 0.01 to TIM3, burn 0.01 back to USDA, check Stats
import fs from 'fs'
import path from 'path'
import { readYamlConfig, getProcessByName, createNodeSigner, deployFromFile } from '@s3arch/ao-client'
import { sendAction, waitResult } from '@s3arch/ao-client'

function loadEnvLocal() {
  const repoRoot = path.resolve(process.cwd(), '..', '..')
  const candidate = path.join(repoRoot, '.env.local')
  try {
    const content = fs.readFileSync(candidate, 'utf-8')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) process.env[m[1]] = m[2]
    }
  } catch {}
}

function resolvePath(p: string) {
  if (fs.existsSync(p)) return p
  const alt = path.join('apps/tim3', p)
  if (fs.existsSync(alt)) return alt
  return p
}

async function main() {
  loadEnvLocal()
  const signer = createNodeSigner()

  // Deploy atomic test process
  const atomicCfg = readYamlConfig(resolvePath('test-processes-atomic.yaml'))
  const atomicProc = getProcessByName(atomicCfg, 'tim3-atomic-test')!
  const { processId: tim3Pid } = await deployFromFile({
    moduleId: atomicProc.module,
    schedulerId: atomicProc.scheduler,
    codeFile: resolvePath(atomicProc.file!),
    tags: 'Environment=development,Demo=atomic-burn'
  })
  console.log('TIM3 atomic test PID:', tim3Pid)

  // Read mock USDA PID
  const allCfg = readYamlConfig(resolvePath('processes.yaml'))
  const usda = allCfg.processes.find(p => p.name === 'mock-usda')
  if (!usda?.process_id) throw new Error('mock-usda process_id missing')
  const usdaPid = usda.process_id
  console.log('Mock USDA PID:', usdaPid)

  // Mint 0.02 to self
  const mintId = await sendAction({ processId: usdaPid, action: 'Mint', tags: 'Amount=0.02', signer })
  console.log('Mint msg:', mintId)
  await waitResult(usdaPid, mintId, 20000).catch(() => {})

  // Transfer 0.01 to TIM3 to mint
  const xferId = await sendAction({ processId: usdaPid, action: 'Transfer', tags: `Recipient=${tim3Pid},Quantity=0.01`, signer })
  console.log('Transfer msg:', xferId)
  await waitResult(usdaPid, xferId, 30000).catch(() => {})

  // Burn 0.01 TIM3 back to USDA
  const burnId = await sendAction({ processId: tim3Pid, action: 'Transfer', tags: 'Recipient=burn,Quantity=0.01', signer })
  console.log('Burn msg:', burnId)
  await waitResult(tim3Pid, burnId, 30000).catch(() => {})

  // Check Stats
  const statsId = await sendAction({ processId: tim3Pid, action: 'Stats', signer })
  const stats = await waitResult(tim3Pid, statsId, 30000)
  console.log('Final TIM3 Stats:', JSON.stringify(stats, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })

