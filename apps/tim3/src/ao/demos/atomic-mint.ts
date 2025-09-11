#!/usr/bin/env tsx
// Atomic mint demo: deploy test TIM3 process, mint mock USDA to self, transfer 0.01 to TIM3, verify Stats
import fs from 'fs'
import path from 'path'
import { readYamlConfig, getProcessByName, createNodeSigner, deployFromFile } from '@s3arch/ao-client'
import { sendAction, waitResult } from '@s3arch/ao-client'

function loadEnvLocal() {
  const repoRoot = path.resolve(process.cwd(), '..', '..')
  const candidate = path.join(repoRoot, '.env.local')
  try {
    const fs = require('fs')
    const content = fs.readFileSync(candidate, 'utf-8')
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) process.env[m[1]] = m[2]
    }
  } catch {}
}

async function main() {
  loadEnvLocal()
  const signer = createNodeSigner()

  // Resolve paths to work from either repo root or apps/tim3 CWD
  const resolvePath = (p: string) => {
    if (fs.existsSync(p)) return p
    const alt = path.join('apps/tim3', p)
    if (fs.existsSync(alt)) return alt
    return p
  }

  // 1) Deploy atomic test process (uses Mock USDA)
  const atomicCfg = readYamlConfig(resolvePath('test-processes-atomic.yaml'))
  const atomicProc = getProcessByName(atomicCfg, 'tim3-atomic-test')!
  const { processId: tim3Pid } = await deployFromFile({
    moduleId: atomicProc.module,
    schedulerId: atomicProc.scheduler,
    codeFile: resolvePath(atomicProc.file!),
    tags: 'Environment=development,Demo=atomic-mint'
  })
  console.log('TIM3 atomic test PID:', tim3Pid)

  // 2) Read mock USDA PID from processes.yaml
  const allCfg = readYamlConfig(resolvePath('processes.yaml'))
  const usdaProc = allCfg.processes.find(p => p.name === 'mock-usda')
  if (!usdaProc?.process_id) throw new Error('mock-usda process_id missing in apps/tim3/processes.yaml')
  const usdaPid = usdaProc.process_id
  console.log('Mock USDA PID:', usdaPid)

  // 3) Mint 0.02 USDA to self (so we can transfer 0.01)
  // Mock-USDA expects numeric Quantity; using 0.02 with 6 decimals precision
  const mintId = await sendAction({ processId: usdaPid, action: 'Mint', tags: { Amount: '0.02' }, signer })
  console.log('Mint msg:', mintId)
  await waitResult(usdaPid, mintId, 20000).catch(() => {})

  // 4) Transfer 0.01 USDA to TIM3 process to trigger Credit-Notice
  const xferId = await sendAction({
    processId: usdaPid,
    action: 'Transfer',
    tags: { Recipient: tim3Pid, Quantity: '0.01' },
    signer
  })
  console.log('Transfer msg:', xferId)
  await waitResult(usdaPid, xferId, 30000).catch(() => {})

  // 5) Query TIM3 Stats to confirm mint registered
  const statsId = await sendAction({ processId: tim3Pid, action: 'Stats', signer })
  const stats = await waitResult(tim3Pid, statsId, 30000)
  console.log('TIM3 Stats:', JSON.stringify(stats, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
