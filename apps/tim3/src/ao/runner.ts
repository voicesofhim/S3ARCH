#!/usr/bin/env node
// TIM3 AO Runner - Node/TS CLI using @permaweb/aoconnect
// What this does (high level):
// - Deploy: Spawns an AO process (spawn) then uploads Lua code via an Eval message
// - Send: Sends a tagged message (Action=...) and optionally waits for a response
// - Result: Fetches the response for a specific message ID
// - Tail: Polls recent messages from a process to observe outputs over time
//
// Why: Lets you work in your editor (no AOS terminal copy/paste) and automate deployment/testing.
// Where to learn:
// - Cookbook topics: Spawning Processes, Sending Messages, DataItem Signers, Reading Results
// - Beginner overview: apps/tim3/LEARNING_GUIDE.md
import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import {
  spawn,
  message,
  result,
  results,
  createDataItemSigner,
} from '@permaweb/aoconnect'

type Tag = { name: string; value: string }
type TagMap = Record<string, string | number | boolean>

type ProcessConfig = {
  name: string
  file?: string
  scheduler: string
  module: string
  process_id?: string
  tags?: Tag[]
}

type ProcessesYaml = {
  processes: ProcessConfig[]
}

const repoRootCandidates = [
  // when running via npm workspace scripts, CWD is apps/tim3
  path.resolve(process.cwd(), '..', '..'),
  // fallback to current CWD
  process.cwd(),
]

function loadEnvLocal() {
  // Try to load .env.local from repo root first, then local
  for (const root of repoRootCandidates) {
    const candidate = path.join(root, '.env.local')
    if (fs.existsSync(candidate)) {
      try {
        const content = fs.readFileSync(candidate, 'utf-8')
        for (const line of content.split(/\r?\n/)) {
          const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
          if (m) process.env[m[1]] = m[2]
        }
        break
      } catch {}
    }
  }
}

loadEnvLocal()

function usage() {
  const text = `\nTIM3 AO Runner (aoconnect)\n\nHow to run:\n  - Deploy a process from Lua file:\n      npm --workspace apps/tim3 run ao:deploy -- --name tim3-coordinator-enhanced --config apps/tim3/processes.yaml --file apps/tim3/tim3-production.lua\n\n  - Send a message to a process and await response:\n      npm --workspace apps/tim3 run ao:send -- --process <PROCESS_ID> --action Info --tags Env=dev,Protocol=TIM3\n\n  - Read results for a specific message:\n      npm --workspace apps/tim3 run ao:result -- --process <PROCESS_ID> --message <MESSAGE_ID>\n\n  - Tail recent messages (best-effort polling):\n      npm --workspace apps/tim3 run ao:tail -- --process <PROCESS_ID>\n\nEnv vars (set in .env.local):\n  AO_WALLET_FILE=./wallet.json       # Path to Arweave JWK (Node only; do not commit)\n  AO_MU_URL=https://...              # Optional: override MU endpoint\n  AO_CU_URL=https://...              # Optional: override CU endpoint\n  AO_GATEWAY_URL=https://arweave.net # Optional: gateway\n\nNotes:\n  - Uses @permaweb/aoconnect ^0.0.90 (same as gateway).\n  - Deploy creates a process (spawn) then Eval uploads Lua.\n  - Actions and tags mirror AOS flows to keep behavior consistent.\n`
  console.log(text)
}

function readYamlConfig(configPath: string): ProcessesYaml {
  const content = fs.readFileSync(configPath, 'utf-8')
  return YAML.parse(content)
}

function resolveProcessByName(config: ProcessesYaml, name: string): ProcessConfig | undefined {
  return config.processes.find((p) => p.name === name)
}

function parseTags(input?: string, extra?: TagMap): Tag[] {
  const tags: Tag[] = []
  if (input) {
    // CSV: key=value,key2=value2
    for (const kv of input.split(',')) {
      const [k, ...rest] = kv.split('=')
      if (k && rest.length) tags.push({ name: k, value: rest.join('=') })
    }
  }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) tags.push({ name: k, value: String(v) })
  }
  return tags
}

function loadWallet(): any {
  // Priority: AO_WALLET_JSON (inline) > AO_WALLET_FILE (path)
  const inline = process.env.AO_WALLET_JSON
  if (inline) return JSON.parse(inline)
  const file = process.env.AO_WALLET_FILE || path.resolve(repoRootCandidates[0], 'wallet.json')
  if (!fs.existsSync(file)) {
    throw new Error(`Wallet not found. Set AO_WALLET_FILE or AO_WALLET_JSON. Tried: ${file}`)
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

async function cmdDeploy(argv: any) {
  const configPath = argv.config ? String(argv.config) : 'apps/tim3/processes.yaml'
  const name = String(argv.name || '')
  const file = argv.file ? String(argv.file) : undefined
  const reuse = argv.reuse !== false // default true
  const addTags = parseTags(argv.tags)

  const cfg = readYamlConfig(configPath)
  const proc = name ? resolveProcessByName(cfg, name) : undefined
  if (!proc && !argv.module && !argv.scheduler) {
    throw new Error('Missing process config. Provide --name with --config, or --module and --scheduler')
  }

  const moduleId = String(argv.module || proc?.module)
  const schedulerId = String(argv.scheduler || proc?.scheduler)
  const codeFile = file || proc?.file
  if (!codeFile) throw new Error('Missing --file or file in YAML config')

  const wallet = loadWallet()
  const signer = createDataItemSigner(wallet)

  let processId = proc?.process_id
  if (!processId || !reuse) {
    const tags: Tag[] = [...(proc?.tags || []), ...addTags]
    processId = await spawn({ signer, module: moduleId, scheduler: schedulerId, tags })
    console.log('Spawned process:', processId)
  } else {
    console.log('Reusing existing process:', processId)
  }

  // Load code into the process via Eval
  const absPath = path.resolve(codeFile)
  const code = fs.readFileSync(absPath, 'utf-8')
  const evalTags = parseTags(argv.evalTags, { Action: 'Eval', 'Content-Type': 'text/lua' })
  const evalMsgId = await message({ process: processId!, tags: evalTags, data: code, signer })
  console.log('Eval message ID:', evalMsgId)

  // Await result from Eval for quick validation
  const res = await result({ process: processId!, message: evalMsgId })
  console.log('Eval result:', JSON.stringify(res, null, 2))

  // Print a small summary block
  console.log('\nDeployment summary:')
  console.log('- Process:', processId)
  console.log('- Code file:', absPath)
  console.log('- Module:', moduleId)
  console.log('- Scheduler:', schedulerId)
}

async function cmdSend(argv: any) {
  const processId = String(argv.process)
  const action = String(argv.action)
  const dataFile = argv['data-file'] ? String(argv['data-file']) : undefined
  const dataArg = argv.data !== undefined ? String(argv.data) : undefined
  const waitMs = argv.wait ? Number(argv.wait) : 15000

  const wallet = loadWallet()
  const signer = createDataItemSigner(wallet)

  let data: string | undefined
  if (dataFile) data = fs.readFileSync(path.resolve(dataFile), 'utf-8')
  else if (dataArg !== undefined) data = dataArg

  const tags = parseTags(argv.tags, { Action: action })
  const msgId = await message({ process: processId, tags, data, signer })
  console.log('Message ID:', msgId)

  if (waitMs > 0) {
    const timeout = new Promise((_r, rej) => setTimeout(() => rej(new Error('Timed out waiting for result')), waitMs))
    const resP = result({ process: processId, message: msgId })
    const res = await Promise.race([resP, timeout]).catch((e) => ({ error: String(e) }))
    console.log('Result:', JSON.stringify(res, null, 2))
  }
}

async function cmdResult(argv: any) {
  const processId = String(argv.process)
  const messageId = String(argv.message)
  const res = await result({ process: processId, message: messageId })
  console.log(JSON.stringify(res, null, 2))
}

async function cmdTail(argv: any) {
  const processId = String(argv.process)
  const interval = argv.interval ? Number(argv.interval) : 4000
  let from = argv.from ? String(argv.from) : undefined
  console.log(`Tailing process ${processId} (poll ${interval}ms)... Ctrl+C to stop.`)
  // Best-effort polling using results({ from })
  // If from is undefined, we start from now (skip history)
  // Per cookbook, you may pass from message ID or cursor; using message ID when available
  // We track the last message ID seen and re-use as from on next poll.
  const seen = new Set<string>()
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await results({ process: processId, from })
      const list = (res as any)?.messages || (res as any)?.Messages || []
      for (const m of list) {
        const id = m.Id || m.id
        if (id && !seen.has(id)) {
          seen.add(id)
          console.log('— message —')
          console.log(JSON.stringify(m, null, 2))
          from = id
        }
      }
    } catch (e) {
      console.log('tail error:', e)
    }
    await new Promise((r) => setTimeout(r, interval))
  }
}

async function cmdTest(argv: any) {
  // Minimal test harness to validate connectivity and Eval.
  // You can expand with a JSON test-case file and assertions.
  console.log('Running smoke test...')
  await cmdDeploy({
    config: 'apps/tim3/test-processes-complete.yaml',
    name: 'tim3-coordinator-test',
    file: 'apps/tim3/tim3-quickstart.lua',
    reuse: false,
    tags: 'Environment=development,Test=smoke',
    evalTags: '',
  })
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('tim3-ao')
    .usage('$0 <cmd> [args]')
    .command(
      'deploy',
      'Spawn a process then Eval Lua code',
      (y) =>
        y
          .option('config', { type: 'string', describe: 'YAML config file (processes.yaml)' })
          .option('name', { type: 'string', describe: 'Process name in YAML' })
          .option('module', { type: 'string', describe: 'Module process ID (overrides YAML)' })
          .option('scheduler', { type: 'string', describe: 'Scheduler process ID (overrides YAML)' })
          .option('file', { type: 'string', describe: 'Lua/Wasm code file to Eval' })
          .option('reuse', { type: 'boolean', default: true, describe: 'Reuse existing process_id from YAML when present' })
          .option('tags', { type: 'string', describe: 'Comma-separated tags key=value' })
          .option('evalTags', { type: 'string', describe: 'Additional tags for Eval message (CSV key=value)' }),
      (args) => cmdDeploy(args)
    )
    .command(
      'send',
      'Send a message to a process and await result',
      (y) =>
        y
          .option('process', { type: 'string', demandOption: true })
          .option('action', { type: 'string', demandOption: true })
          .option('tags', { type: 'string', describe: 'Comma-separated tags key=value' })
          .option('data', { type: 'string', describe: 'Raw data (string)' })
          .option('data-file', { type: 'string', describe: 'Path to file for message data' })
          .option('wait', { type: 'number', default: 15000, describe: 'Milliseconds to wait for result (0 to skip)' }),
      (args) => cmdSend(args)
    )
    .command(
      'result',
      'Fetch the result for a message',
      (y) => y.option('process', { type: 'string', demandOption: true }).option('message', { type: 'string', demandOption: true }),
      (args) => cmdResult(args)
    )
    .command(
      'tail',
      'Poll for messages (best-effort)',
      (y) => y.option('process', { type: 'string', demandOption: true }).option('interval', { type: 'number' }).option('from', { type: 'string' }),
      (args) => cmdTail(args)
    )
    .command('test', 'Run a smoke test (spawn + eval)', () => {}, (args) => cmdTest(args))
    .help()
    .parse()

  if (!argv) usage()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
