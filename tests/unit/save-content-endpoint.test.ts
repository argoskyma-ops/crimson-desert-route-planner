import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { handleSaveContent, SAVE_CONTENT_MAX_BYTES } from '../../scripts/dev-save-content.ts'

const root = mkdtempSync(join(tmpdir(), 'cd-save-'))
const contentDir = join(root, 'data', 'content')
mkdirSync(contentDir, { recursive: true })

const SAME_ORIGIN = { 'sec-fetch-site': 'same-origin' }

const questRecord = {
  id: 'quest:r2-save',
  type: 'quest',
  name: 'R2 Save',
  kind: 'side',
  summary: 'A minimal quest for the save-content endpoint test.',
  sources: [{ url: 'https://example.com/page', accessed: '2026-09-05' }],
  confidence: 'reported',
  gameVersion: '2.01.00',
}

function fakeReq(body: Buffer, headers: Record<string, string>): IncomingMessage {
  const stream = new Readable({ read() {} })
  stream.once('newListener', (event) => {
    if (event === 'data') {
      queueMicrotask(() => {
        stream.emit('data', body)
        stream.emit('end')
      })
    }
  })
  return Object.assign(stream, {
    headers,
    destroy() {},
    resume() {},
  }) as unknown as IncomingMessage
}

function fakeRes() {
  const headers: Record<string, string | number | readonly string[]> = {}
  const res = {
    statusCode: 0,
    writableEnded: false,
    body: '',
    headers,
    setHeader(name: string, value: string | number | readonly string[]) {
      headers[name] = value
    },
    end(chunk?: unknown) {
      res.writableEnded = true
      if (chunk !== undefined) res.body = typeof chunk === 'string' ? chunk : String(chunk)
    },
  }
  return res as typeof res & ServerResponse
}

async function post(body: unknown, headers: Record<string, string> = SAME_ORIGIN) {
  const req = fakeReq(Buffer.from(JSON.stringify(body)), headers)
  const res = fakeRes()
  await handleSaveContent(req, res, root)
  return res
}

function listed(): string[] {
  return readdirSync(contentDir)
}

afterAll(() => {
  rmSync(root, { recursive: true, force: true })
})

beforeEach(() => {
  for (const name of readdirSync(contentDir)) {
    unlinkSync(join(contentDir, name))
  }
})

describe('handleSaveContent', () => {
  it('rejects a cross-origin POST with 403 and writes nothing', async () => {
    const res = await post(
      { type: 'quest', file: { version: 1, type: 'quest', records: [questRecord] } },
      { origin: 'http://evil.example', host: 'localhost:5174' },
    )
    expect(res.statusCode).toBe(403)
    expect(listed()).toEqual([])
  })

  it('rejects type "../evil" with 400 and writes nothing', async () => {
    const res = await post({
      type: '../evil',
      file: { version: 1, type: 'quest', records: [questRecord] },
    })
    expect(res.statusCode).toBe(400)
    expect(listed()).toEqual([])
  })

  it('rejects a file.type mismatch with 400 and writes nothing', async () => {
    const res = await post({
      type: 'quest',
      file: { version: 1, type: 'item', records: [] },
    })
    expect(res.statusCode).toBe(400)
    expect(listed()).toEqual([])
  })

  it('rejects a body larger than SAVE_CONTENT_MAX_BYTES with invalid body', async () => {
    const req = fakeReq(Buffer.alloc(SAVE_CONTENT_MAX_BYTES + 1), SAME_ORIGIN)
    const res = fakeRes()
    await handleSaveContent(req, res, root)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ ok: false, error: 'invalid body' })
    expect(listed()).toEqual([])
  })

  it('writes the parsed file and strips extra keys', async () => {
    const res = await post({
      type: 'quest',
      file: {
        version: 1,
        type: 'quest',
        records: [{ ...questRecord, bogus: 1 }],
      },
    })
    expect(res.statusCode).toBe(200)
    const dest = join(contentDir, 'quest.json')
    expect(existsSync(dest)).toBe(true)
    const written = JSON.parse(readFileSync(dest, 'utf8')) as {
      records: Array<Record<string, unknown>>
    }
    expect(written.records[0]?.id).toBe('quest:r2-save')
    expect(written.records[0]).not.toHaveProperty('bogus')
    expect(listed().some((name) => name.endsWith('.tmp'))).toBe(false)
  })
})
