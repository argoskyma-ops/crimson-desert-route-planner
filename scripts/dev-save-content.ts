/**
 * Dev-server POST /__dev/save-content (docs/DECISIONS.md D19).
 * Shared origin/body helpers are also used by POST /__dev/save-roads.
 */
import { mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join } from 'node:path'
import { ENTITY_TYPES } from '../src/content/ids.ts'
import { ContentFileSchema } from '../src/content/schema.ts'

export const SAVE_CONTENT_MAX_BYTES = 5 * 1024 * 1024

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

/** `hostname:port` from an Origin URL or a Host header, with default ports filled in. */
function hostnamePort(urlLike: string): string | null {
  try {
    const url = urlLike.includes('://') ? new URL(urlLike) : new URL(`http://${urlLike}`)
    const port = url.port || (url.protocol === 'https:' ? '443' : '80')
    return `${url.hostname}:${port}`
  } catch {
    return null
  }
}

export function isAllowedSaveRequest(req: IncomingMessage): boolean {
  if (headerValue(req.headers['sec-fetch-site']) === 'same-origin') return true
  const origin = headerValue(req.headers.origin)
  const host = headerValue(req.headers.host)
  if (!origin || !host) return false
  const originHost = hostnamePort(origin)
  const requestHost = hostnamePort(host)
  return originHost !== null && originHost === requestHost
}

export function readRequestBody(req: IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = []
    let total = 0
    let settled = false
    const fail = (err: Error) => {
      if (settled) return
      settled = true
      reject(err)
    }
    req.on('data', (chunk: Buffer | string) => {
      if (settled) return
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      total += buf.length
      if (total > maxBytes) {
        fail(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(buf)
    })
    req.on('end', () => {
      if (settled) return
      settled = true
      resolveBody(Buffer.concat(chunks))
    })
    req.on('error', (err) => fail(err instanceof Error ? err : new Error('read error')))
  })
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  if (res.writableEnded) return
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export async function handleSaveContent(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
): Promise<void> {
  if (!isAllowedSaveRequest(req)) {
    sendJson(res, 403, { ok: false, error: 'forbidden' })
    req.resume()
    return
  }

  let raw: Buffer
  try {
    raw = await readRequestBody(req, SAVE_CONTENT_MAX_BYTES)
  } catch {
    sendJson(res, 400, { ok: false, error: 'invalid body' })
    return
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw.toString('utf8')) as unknown
  } catch {
    sendJson(res, 400, { ok: false, error: 'invalid json' })
    return
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    sendJson(res, 400, { ok: false, error: 'invalid payload' })
    return
  }
  const body = parsed as { type?: unknown; file?: unknown }
  const type = body.type
  const file = body.file
  if (typeof type !== 'string' || !(ENTITY_TYPES as readonly string[]).includes(type)) {
    sendJson(res, 400, { ok: false, error: 'invalid type' })
    return
  }
  if (typeof file !== 'object' || file === null || Array.isArray(file)) {
    sendJson(res, 400, { ok: false, error: 'invalid file' })
    return
  }
  if ((file as { type?: unknown }).type !== type) {
    sendJson(res, 400, { ok: false, error: 'type mismatch' })
    return
  }

  const result = ContentFileSchema.safeParse(file)
  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue?.path.map(String).join('.') ?? ''
    const message = issue?.message ?? 'invalid file'
    sendJson(res, 400, { ok: false, error: path ? `${path}: ${message}` : message })
    return
  }

  const dest = join(root, 'data', 'content', `${type}.json`)
  const tmp = join(root, 'data', 'content', `${type}.json.tmp`)
  const text = `${JSON.stringify(result.data, null, 2)}\n`
  try {
    mkdirSync(join(root, 'data', 'content'), { recursive: true })
    writeFileSync(tmp, text)
    renameSync(tmp, dest)
  } catch {
    try {
      unlinkSync(tmp)
    } catch {
      /* ignore leftover tmp */
    }
    sendJson(res, 400, { ok: false, error: 'write failed' })
    return
  }
  sendJson(res, 200, { ok: true, bytes: Buffer.byteLength(text) })
}
