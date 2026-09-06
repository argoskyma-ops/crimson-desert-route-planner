import { z, type ZodObject } from 'zod'
import { isEntityType, makeId, slugify, type EntityType } from '../content/ids'
import { EntitySchema, parseContentFile } from '../content/schema'
import type { ContentFile, ContentFileInput } from '../content/types'

export type FieldKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'id'
  | 'id-list'
  | 'string-list'
  | 'location'
  | 'steps'
  | 'sources'
  | 'json'

export interface FieldSpec {
  key: string
  kind: FieldKind
  required: boolean
  multiline?: boolean
  options?: readonly string[]
  entityType?: EntityType | 'any'
  defaultValue?: unknown
}

const MULTILINE = new Set(['body', 'strategy', 'rules', 'notes', 'summary'])
const KEEP_KEYS = new Set(['sources', 'steps'])

interface ZodNode {
  def: {
    type: string
    innerType?: ZodNode
    defaultValue?: unknown
    element?: ZodNode
    shape?: Record<string, ZodNode>
    values?: readonly unknown[]
  }
  shape?: Record<string, ZodNode>
  options?: readonly string[]
  meta: () => { entityType?: unknown } | undefined
}

function asNode(field: unknown): ZodNode {
  return field as ZodNode
}

function readDefault(value: unknown): unknown {
  return typeof value === 'function' ? (value as () => unknown)() : value
}

function unwrap(field: ZodNode): { inner: ZodNode; required: boolean; defaultValue?: unknown } {
  let inner = field
  let required = true
  let defaultValue: unknown
  while (inner.def.type === 'optional' || inner.def.type === 'default') {
    required = false
    if (inner.def.type === 'default' && defaultValue === undefined) {
      defaultValue = readDefault(inner.def.defaultValue)
    }
    if (!inner.def.innerType) break
    inner = inner.def.innerType
  }
  return { inner, required, defaultValue }
}

function objectShape(node: ZodNode): Record<string, ZodNode> | undefined {
  return node.shape ?? node.def.shape
}

function enumOptions(node: ZodNode): readonly string[] {
  if (node.options && node.options.length > 0) return node.options
  const entries = (node.def as { entries?: Record<string, string> }).entries
  return entries ? Object.values(entries) : []
}

function entityTypeOf(node: ZodNode): EntityType | 'any' | undefined {
  const registered = z.globalRegistry.get(node as never)
  const meta = (typeof node.meta === 'function' ? node.meta() : undefined) ?? registered
  const value =
    meta && typeof meta === 'object' && 'entityType' in meta ? meta.entityType : undefined
  if (value === 'any' || isEntityType(value)) return value
  return undefined
}

function literalValue(field: ZodNode | undefined): unknown {
  if (!field || field.def.type !== 'literal') return undefined
  return field.def.values?.[0]
}

function classify(key: string, field: ZodNode): FieldSpec {
  const { inner, required, defaultValue } = unwrap(field)
  const spec: FieldSpec = { key, kind: 'json', required }
  if (defaultValue !== undefined) spec.defaultValue = defaultValue

  if (inner.def.type === 'string') {
    const entityType = entityTypeOf(inner)
    if (entityType !== undefined) {
      spec.kind = 'id'
      spec.entityType = entityType
      return spec
    }
    spec.kind = 'text'
    if (MULTILINE.has(key)) spec.multiline = true
    return spec
  }
  if (inner.def.type === 'enum') {
    spec.kind = 'enum'
    spec.options = enumOptions(inner)
    return spec
  }
  if (inner.def.type === 'number') {
    spec.kind = 'number'
    return spec
  }
  if (inner.def.type === 'boolean') {
    spec.kind = 'boolean'
    return spec
  }
  if (inner.def.type === 'array') {
    if (key === 'sources') {
      spec.kind = 'sources'
      return spec
    }
    const element = inner.def.element
    if (element) {
      const el = unwrap(element).inner
      if (el.def.type === 'string') {
        const entityType = entityTypeOf(el)
        if (entityType !== undefined) {
          spec.kind = 'id-list'
          spec.entityType = entityType
          return spec
        }
        spec.kind = 'string-list'
        return spec
      }
      const shape = el.def.type === 'object' ? objectShape(el) : undefined
      // StepSchema has `text` + `action`. Reward/prerequisite also have `text`.
      if (shape && 'text' in shape && 'action' in shape) {
        spec.kind = 'steps'
        return spec
      }
    }
    spec.kind = 'json'
    return spec
  }
  if (inner.def.type === 'object') {
    const shape = objectShape(inner)
    if (shape && 'map' in shape && 'x' in shape && 'y' in shape) {
      spec.kind = 'location'
      return spec
    }
  }
  spec.kind = 'json'
  return spec
}

export function schemaFor(type: EntityType): ZodObject<z.core.$ZodLooseShape> {
  for (const option of EntitySchema.options) {
    const shape = asNode(option).shape
    if (literalValue(shape?.type) === type) {
      return option as unknown as ZodObject<z.core.$ZodLooseShape>
    }
  }
  throw new Error(`no schema for ${type}`)
}

export function fieldSpecs(type: EntityType): FieldSpec[] {
  const shape = asNode(schemaFor(type)).shape ?? {}
  const specs: FieldSpec[] = []
  for (const key of Object.keys(shape)) {
    if (key === 'type') continue
    specs.push(classify(key, shape[key]))
  }
  return specs
}

export function emptyRecord(type: EntityType): Record<string, unknown> {
  const record: Record<string, unknown> = {
    type,
    id: '',
    name: '',
    summary: '',
    sources: [],
  }
  for (const spec of fieldSpecs(type)) {
    if (spec.kind === 'enum' && spec.required && spec.options && spec.options.length > 0) {
      record[spec.key] = spec.options[0]
    }
  }
  return record
}

export function suggestId(type: EntityType, name: string): string {
  const slug = slugify(name)
  if (slug === '') return ''
  return makeId(type, slug)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEmptyValue(value: unknown): boolean {
  if (value === '' || value === undefined || value === null) return true
  if (Array.isArray(value) && value.length === 0) return true
  if (isPlainObject(value) && Object.keys(value).length === 0) return true
  return false
}

function stripEmptyKeys(value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(value)) {
    const cleaned = cleanNode(raw)
    if (!isEmptyValue(cleaned)) out[key] = cleaned
  }
  return out
}

function cleanNode(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => (isPlainObject(item) ? stripEmptyKeys(item) : item))
  }
  if (isPlainObject(value)) return stripEmptyKeys(value)
  return value
}

export function applySaveDefaults(
  record: Record<string, unknown>,
  gameVersion: string,
  today: string,
): Record<string, unknown> {
  const type = record.type
  const required = new Set<string>(['type'])
  if (isEntityType(type)) {
    for (const spec of fieldSpecs(type)) {
      if (spec.required) required.add(spec.key)
    }
  }

  const next: Record<string, unknown> = { ...record }
  if (isEmptyValue(next.confidence)) next.confidence = 'verified'
  if (isEmptyValue(next.gameVersion)) next.gameVersion = gameVersion
  if (Array.isArray(next.sources)) {
    next.sources = next.sources.map((source) => {
      if (!isPlainObject(source)) return source
      const row = { ...source }
      if (isEmptyValue(row.accessed)) row.accessed = today
      return stripEmptyKeys(row)
    })
  }

  const out: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(next)) {
    const cleaned = cleanNode(raw)
    if (KEEP_KEYS.has(key) || required.has(key) || !isEmptyValue(cleaned)) {
      out[key] = cleaned
    }
  }
  return out
}

export function recordExists(file: ContentFileInput, id: string): boolean {
  return file.records.some((item) => item.id === id)
}

export function upsertRecord(
  file: ContentFileInput,
  record: Record<string, unknown>,
): ContentFileInput {
  const id = record.id
  const entry = record as ContentFileInput['records'][number]
  const index = file.records.findIndex((item) => item.id === id)
  if (index === -1) return { ...file, records: [...file.records, entry] }
  const records = file.records.slice()
  records[index] = entry
  return { ...file, records }
}

export function validateContentFile(
  value: unknown,
  label?: string,
): { ok: true; file: ContentFile } | { ok: false; message: string } {
  try {
    return { ok: true, file: parseContentFile(value, label) }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'invalid content file' }
  }
}

export function serializeContentFile(file: ContentFileInput): string {
  return `${JSON.stringify(file, null, 2)}\n`
}

export async function fetchContentFile(
  type: EntityType,
  fetchImpl: typeof fetch = fetch,
): Promise<ContentFileInput> {
  const res = await fetchImpl(`/data/content/${type}.json`)
  if (!res.ok) throw new Error(`failed to fetch ${type}.json (${res.status})`)
  const data: unknown = await res.json()
  if (!isPlainObject(data) || !Array.isArray(data.records)) {
    throw new Error(`${type}.json: invalid content file`)
  }
  return data as ContentFileInput
}

export async function saveContentDev(
  type: EntityType,
  file: ContentFileInput,
): Promise<{ ok: boolean; message: string }> {
  if (!import.meta.env.DEV) return { ok: false, message: 'dev only' }
  try {
    const res = await fetch('/__dev/save-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, file }),
    })
    const data: unknown = await res.json().catch(() => null)
    const error =
      isPlainObject(data) && typeof data.error === 'string' ? data.error : `HTTP ${res.status}`
    if (res.ok) return { ok: true, message: 'saved' }
    return { ok: false, message: error }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'save failed' }
  }
}

export function downloadContentFile(type: EntityType, file: ContentFileInput): void {
  const blob = new Blob([serializeContentFile(file)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${type}.json`
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
