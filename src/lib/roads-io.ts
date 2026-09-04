import { validateRoads } from './roads-loader'
import type { RoadsFile } from '../routing/types'

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Diff-friendly JSON: one compact node/edge object per line, coords rounded to 1 decimal. */
export function serializeRoads(roads: RoadsFile): string {
  const nodes = roads.nodes.map((node) => ({
    id: node.id,
    x: round1(node.x),
    y: round1(node.y),
  }))
  const edges = roads.edges.map((edge) => ({
    id: edge.id,
    from: edge.from,
    to: edge.to,
    class: edge.class,
    points: edge.points.map(([x, y]) => [round1(x), round1(y)] as [number, number]),
  }))
  const lines: string[] = [
    '{',
    '  "version": 1,',
    `  "imageSize": [${roads.imageSize[0]}, ${roads.imageSize[1]}],`,
    '  "nodes": [',
  ]
  for (let index = 0; index < nodes.length; index += 1) {
    const comma = index < nodes.length - 1 ? ',' : ''
    lines.push(`    ${JSON.stringify(nodes[index])}${comma}`)
  }
  lines.push('  ],')
  lines.push('  "edges": [')
  for (let index = 0; index < edges.length; index += 1) {
    const comma = index < edges.length - 1 ? ',' : ''
    lines.push(`    ${JSON.stringify(edges[index])}${comma}`)
  }
  lines.push('  ]')
  lines.push('}')
  return `${lines.join('\n')}\n`
}

/** Trigger a browser download of the serialized roads file. */
export function downloadRoads(roads: RoadsFile, filename = 'roads.json'): void {
  const blob = new Blob([serializeRoads(roads)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** Parse a user-picked JSON file with the same checks as `/data/roads.json`. */
export function readRoadsFile(file: File): Promise<RoadsFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : ''
        resolve(validateRoads(JSON.parse(text) as unknown))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read file'))
    }
    reader.readAsText(file)
  })
}

/**
 * POST the serialized graph to the Vite dev save endpoint.
 * Returns true only on a 2xx response; always false in production builds.
 */
export async function saveRoadsDev(roads: RoadsFile): Promise<boolean> {
  if (!import.meta.env.DEV) return false
  try {
    const res = await fetch('/__dev/save-roads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serializeRoads(roads),
    })
    return res.ok
  } catch {
    return false
  }
}
