import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {
  existsSync,
  mkdirSync,
  cpSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { extname, join, relative, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const SAVE_ROADS_MAX_BYTES = 20 * 1024 * 1024

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
}

/** Resolve `/data/...` to a file under `<root>/data/`, or null if missing/unsafe. */
function resolveDataFile(root: string, url: string): string | null {
  const pathname = url.split('?')[0] ?? ''
  if (!pathname.startsWith('/data/')) return null

  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }
  if (decoded.includes('\0')) return null

  const dataRoot = resolve(root, 'data')
  const candidate = resolve(root, decoded.slice(1))
  const rel = relative(dataRoot, candidate)
  if (rel === '' || rel.startsWith('..') || resolve(dataRoot, rel) !== candidate) {
    return null
  }
  return candidate
}

function readRequestBody(req: IncomingMessage, maxBytes: number): Promise<Buffer> {
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

function isSaveRoadsPayload(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const raw = value as Record<string, unknown>
  return raw.version === 1 && Array.isArray(raw.nodes) && Array.isArray(raw.edges)
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  if (res.writableEnded) return
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function handleSaveRoads(
  req: IncomingMessage,
  res: ServerResponse,
  root: string,
): Promise<void> {
  let raw: Buffer
  try {
    raw = await readRequestBody(req, SAVE_ROADS_MAX_BYTES)
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

  if (!isSaveRoadsPayload(parsed)) {
    sendJson(res, 400, { ok: false, error: 'invalid roads payload' })
    return
  }

  const dest = join(root, 'data', 'roads.json')
  const tmp = join(root, 'data', 'roads.json.tmp')
  try {
    mkdirSync(join(root, 'data'), { recursive: true })
    writeFileSync(tmp, raw)
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
  sendJson(res, 200, { ok: true, bytes: raw.byteLength })
}

function dataDir(): Plugin {
  let root = ''
  let outDir = ''
  let command: 'build' | 'serve' = 'serve'

  return {
    name: 'data-dir',
    configResolved(config) {
      root = config.root
      outDir = resolve(config.root, config.build.outDir)
      command = config.command
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0] ?? ''
        if (req.method === 'POST' && pathname === '/__dev/save-roads') {
          void handleSaveRoads(req, res, server.config.root)
          return
        }
        if (!pathname.startsWith('/data/')) {
          next()
          return
        }
        const url = req.url ?? ''

        const file = resolveDataFile(server.config.root, url)
        const ext = file ? extname(file).toLowerCase() : ''
        const contentType = CONTENT_TYPES[ext]
        if (!file || !contentType) {
          res.statusCode = 404
          res.end()
          return
        }

        try {
          if (!statSync(file).isFile()) {
            res.statusCode = 404
            res.end()
            return
          }
          const body = readFileSync(file)
          res.setHeader('Content-Type', contentType)
          res.end(body)
        } catch {
          res.statusCode = 404
          res.end()
        }
      })
    },
    closeBundle() {
      if (command !== 'build') return
      const copies: [string, string][] = [
        [join(root, 'data', 'roads.json'), join(outDir, 'data', 'roads.json')],
        [
          join(root, 'data', 'map', 'manifest.json'),
          join(outDir, 'data', 'map', 'manifest.json'),
        ],
        [join(root, 'data', 'map', 'tiles'), join(outDir, 'data', 'map', 'tiles')],
      ]
      for (const [src, dest] of copies) {
        if (!existsSync(src)) continue
        mkdirSync(resolve(dest, '..'), { recursive: true })
        cpSync(src, dest, { recursive: true })
        console.log(`copied ${relative(root, src)} -> ${relative(root, dest)}`)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), dataDir()],
})
