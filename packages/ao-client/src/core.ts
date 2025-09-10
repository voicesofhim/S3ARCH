import { message, result, results } from '@permaweb/aoconnect'
// Core helpers used by Node and browser code.
// - parseTags: turn CSV or map into aoconnect Tag[]
// - sendAction: send a message with Action=... and return the message ID
// - waitResult: await the result for a given message
// - tailProcess: poll recent messages (best-effort)

export type Tag = { name: string; value: string }
export type TagMap = Record<string, string | number | boolean>

export function parseTags(input?: string, extra?: TagMap): Tag[] {
  const tags: Tag[] = []
  if (input) {
    for (const kv of input.split(',')) {
      const [k, ...rest] = kv.split('=')
      if (k && rest.length) tags.push({ name: k, value: rest.join('=') })
    }
  }
  if (extra) for (const [k, v] of Object.entries(extra)) tags.push({ name: k, value: String(v) })
  return tags
}

export async function sendAction(opts: {
  processId: string
  action: string
  tags?: string | TagMap
  data?: string
  signer: any
}) {
  const tags = Array.isArray(opts.tags)
    ? (opts.tags as unknown as Tag[])
    : parseTags(typeof opts.tags === 'string' ? (opts.tags as string) : undefined, { Action: opts.action })
  const id = await message({ process: opts.processId, tags, data: opts.data, signer: opts.signer })
  return id
}

export async function waitResult(processId: string, messageId: string, timeoutMs = 15000) {
  const timeout = new Promise((_r, rej) => setTimeout(() => rej(new Error('Timed out waiting for result')), timeoutMs))
  return Promise.race([result({ process: processId, message: messageId }), timeout])
}

export async function tailProcess(processId: string, from?: string): Promise<any> {
  return results({ process: processId, from })
}
