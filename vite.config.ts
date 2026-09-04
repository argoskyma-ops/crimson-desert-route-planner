import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {
  existsSync,
  mkdirSync,
  cpSync,
  readFileSync,
  statSync,
} from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

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
        const url = req.url ?? ''
        if (!url.startsWith('/data/')) {
          next()
          return
        }

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
