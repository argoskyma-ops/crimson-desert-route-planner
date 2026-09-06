export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getPath(root: Record<string, unknown>, path: string): unknown {
  let current: unknown = root
  for (const part of path.split('.')) {
    if (Array.isArray(current)) {
      current = current[Number(part)]
      continue
    }
    if (!isRecord(current)) return undefined
    current = current[part]
  }
  return current
}

function setAt(current: unknown, parts: string[], value: unknown): unknown {
  if (parts.length === 0) return value
  const [head, ...rest] = parts
  if (head === undefined) return value
  const index = Number(head)
  const asArray = Number.isInteger(index) && String(index) === head
  if (asArray) {
    const next = Array.isArray(current) ? current.slice() : []
    next[index] = setAt(next[index], rest, value)
    return next
  }
  const obj = isRecord(current) ? { ...current } : {}
  obj[head] = setAt(obj[head], rest, value)
  return obj
}

export function setPath(
  root: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  return setAt(root, path.split('.'), value) as Record<string, unknown>
}
