import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import { spawn, message, createDataItemSigner } from '@permaweb/aoconnect'
import { parseTags, Tag } from './core'
// Node-specific helpers:
// - Read YAML configs
// - Load wallet from env / file
// - Create signer (JWK)
// - Deploy code: spawn + Eval

export type ProcessConfig = {
  name: string
  file?: string
  scheduler: string
  module: string
  process_id?: string
  tags?: Tag[]
}

export type ProcessesYaml = {
  processes: ProcessConfig[]
}

export function readYamlConfig(configPath: string): ProcessesYaml {
  const content = fs.readFileSync(configPath, 'utf-8')
  return YAML.parse(content)
}

export function getProcessByName(cfg: ProcessesYaml, name: string): ProcessConfig | undefined {
  return cfg.processes.find((p) => p.name === name)
}

export function loadWalletFromEnv(): any {
  const inline = process.env.AO_WALLET_JSON
  if (inline) return JSON.parse(inline)
  const repoRoot = path.resolve(process.cwd(), '..', '..')
  const file = process.env.AO_WALLET_FILE || path.join(repoRoot, 'wallet.json')
  if (!fs.existsSync(file)) throw new Error(`Wallet not found: ${file}`)
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

export function createNodeSigner() {
  const jwk = loadWalletFromEnv()
  return createDataItemSigner(jwk)
}

export async function deployFromFile(opts: {
  moduleId: string
  schedulerId: string
  codeFile: string
  reuseProcessId?: string
  tags?: string
}) {
  const signer = createNodeSigner()
  let processId = opts.reuseProcessId
  if (!processId) {
    const tags = parseTags(opts.tags)
    processId = await spawn({ signer, module: opts.moduleId, scheduler: opts.schedulerId, tags })
  }
  const code = fs.readFileSync(path.resolve(opts.codeFile), 'utf-8')
  const evalTags = parseTags(undefined, { Action: 'Eval', 'Content-Type': 'text/lua' })
  const evalId = await message({ process: processId!, tags: evalTags, data: code, signer })
  return { processId: processId!, evalMessageId: evalId }
}
