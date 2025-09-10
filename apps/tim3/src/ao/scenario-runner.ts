#!/usr/bin/env node
// JSON-driven scenario runner (foundation for reproducible tests)
// High level:
// - Reads a JSON scenario: which process to use and which Actions to send
// - Finds process details from YAML config (module/scheduler/process_id)
// - If no process_id, it will spawn a new one and Eval the Lua code
// - Sends each step, waits for result, checks simple expectations

import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { readYamlConfig, getProcessByName, createNodeSigner, parseTags, deployFromFile } from '@s3arch/ao-client'
import { message, result } from '@permaweb/aoconnect'

type Step = {
  action: string
  tags?: string
  data?: string
  expect?: {
    actionIncludes?: string
  }
}

type Scenario = {
  name: string
  config: string
  processName: string
  steps: Step[]
}

async function runScenario(filePath: string) {
  const content = fs.readFileSync(path.resolve(filePath), 'utf-8')
  const sc: Scenario = JSON.parse(content)
  const cfg = readYamlConfig(sc.config)
  const proc = getProcessByName(cfg, sc.processName)
  if (!proc) throw new Error(`Process not found in YAML: ${sc.processName}`)

  const signer = createNodeSigner()
  let processId = proc.process_id
  if (!processId) {
    if (!proc.file) throw new Error(`process_id missing and no file provided in YAML for ${sc.processName}`)
    const { processId: pid } = await deployFromFile({
      moduleId: proc.module,
      schedulerId: proc.scheduler,
      codeFile: proc.file,
      tags: 'Environment=development,Scenario=auto'
    })
    processId = pid
  }

  console.log(`Running scenario: ${sc.name}`)
  for (const [i, step] of sc.steps.entries()) {
    const tags = parseTags(step.tags, { Action: step.action })
    const msgId = await message({ process: processId, tags, data: step.data, signer })
    const res = await result({ process: processId, message: msgId })
    console.log(`Step ${i + 1} [${step.action}] -> ${msgId}`)
    if (step.expect?.actionIncludes) {
      const msgs = (res as any).Messages || (res as any).messages || []
      const ok = msgs.some((m: any) => {
        const t = m.Tags || []
        const a = t.find((x: any) => x.name === 'Action')?.value || ''
        return a.includes(step.expect!.actionIncludes!)
      })
      if (!ok) throw new Error(`Expectation failed: actionIncludes=${step.expect.actionIncludes}`)
    }
  }
  console.log('Scenario completed successfully')
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('tim3-scenarios')
    .usage('$0 --file <path>')
    .option('file', { type: 'string', demandOption: true })
    .help()
    .parse()
  // @ts-ignore
  await runScenario(argv.file as string)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
