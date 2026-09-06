/**
 * Tiny markdown for content bodies (docs/DECISIONS.md D16): paragraphs,
 * `- ` lists, `**bold**` and `[[type:slug]]` entity links. No HTML.
 */
import { isEntityId, LINK_RE } from '../content/ids'

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; children: Inline[] }
  | { kind: 'link'; id: string }

export type Block =
  | { kind: 'paragraph'; children: Inline[] }
  | { kind: 'list'; items: Inline[][] }

function isListLine(line: string): boolean {
  return line.startsWith('- ')
}

/** `[[type:slug]]` at this index when LINK_RE matches and `isEntityId` accepts. */
function entityLinkAt(source: string, index: number): { id: string; length: number } | null {
  if (!source.startsWith('[[', index)) return null
  const re = new RegExp(LINK_RE.source)
  const match = re.exec(source.slice(index))
  if (!match || match.index !== 0) return null
  const id = match[1]
  if (!isEntityId(id)) return null
  return { id, length: match[0].length }
}

function parseInlines(source: string): Inline[] {
  const out: Inline[] = []
  let buf = ''
  let i = 0

  const flush = () => {
    if (buf.length === 0) return
    out.push({ kind: 'text', text: buf })
    buf = ''
  }

  while (i < source.length) {
    if (source.startsWith('**', i)) {
      const close = source.indexOf('**', i + 2)
      if (close === -1) {
        buf += '**'
        i += 2
        continue
      }
      flush()
      out.push({ kind: 'bold', children: parseInlines(source.slice(i + 2, close)) })
      i = close + 2
      continue
    }

    const link = entityLinkAt(source, i)
    if (link) {
      flush()
      out.push({ kind: 'link', id: link.id })
      i += link.length
      continue
    }

    buf += source[i]
    i += 1
  }

  flush()
  return out
}

export function parseMiniMarkdown(source: string): Block[] {
  if (source.length === 0) return []
  const lines = source.split('\n').map((line) => line.trim())
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line === undefined || line === '') {
      i += 1
      continue
    }

    if (isListLine(line)) {
      const items: Inline[][] = []
      while (i < lines.length) {
        const item = lines[i]
        if (item === undefined || !isListLine(item)) break
        items.push(parseInlines(item.slice(2)))
        i += 1
      }
      blocks.push({ kind: 'list', items })
      continue
    }

    const para: string[] = []
    while (i < lines.length) {
      const next = lines[i]
      if (next === undefined || next === '' || isListLine(next)) break
      para.push(next)
      i += 1
    }
    blocks.push({ kind: 'paragraph', children: parseInlines(para.join(' ')) })
  }

  return blocks
}
