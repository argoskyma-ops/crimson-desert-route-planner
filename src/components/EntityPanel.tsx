import { useRef, useState } from 'react'
import { exportProgress, importProgress } from '../content/progress'
import type { Entity } from '../content/types'
import { useAppStore } from '../store'
import EntityBody from './entity/EntityBody'
import EntityHeader from './entity/EntityHeader'
import { LinkList } from './entity/EntityLink'
import Markdown from './entity/Markdown'
import Relations from './entity/Relations'
import { Section } from './entity/Section'
import Sources from './entity/Sources'

const btnBlock =
  'inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-neutral-800/80 px-3 text-sm font-medium text-neutral-100 hover:bg-neutral-700/80'

export default function EntityPanel() {
  const selectedEntityId = useAppStore((s) => s.selectedEntityId)
  const record = useAppStore((s) =>
    s.selectedEntityId === null ? undefined : s.content.byId.get(s.selectedEntityId),
  )
  const editorActive = useAppStore((s) => s.editor.active)

  if (editorActive || selectedEntityId === null || record === undefined) return null

  return <EntityPanelInner key={selectedEntityId} record={record} />
}

function EntityPanelInner({ record }: { record: Entity }) {
  const selectEntity = useAppStore((s) => s.selectEntity)
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      className={`pointer-events-auto fixed inset-x-0 bottom-0 z-[1200] flex flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-neutral-950/90 text-neutral-100 shadow-lg backdrop-blur-md ${
        expanded ? 'max-h-[92dvh]' : 'max-h-[50dvh]'
      } md:absolute md:inset-x-auto md:top-[4.25rem] md:right-3 md:bottom-3 md:w-[24rem] md:max-h-none md:rounded-xl`}
    >
      <EntityHeader
        record={record}
        expanded={expanded}
        onToggleExpand={() => setExpanded((value) => !value)}
        onClose={() => selectEntity(null)}
      />
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-3">
        <p className="text-sm text-neutral-300">{record.summary}</p>
        {record.body ? (
          <div className="mt-3">
            <Markdown source={record.body} />
          </div>
        ) : null}
        <EntityBody record={record} />
        <Relations id={record.id} />
        {record.related?.length ? (
          <Section title="Related">
            <LinkList ids={record.related} />
          </Section>
        ) : null}
        {record.aliases?.length || record.tags?.length ? (
          <p className="mt-4 text-xs text-neutral-500">
            {record.aliases?.length ? `Also known as ${record.aliases.join(', ')}` : null}
            {record.aliases?.length && record.tags?.length ? ' · ' : null}
            {record.tags?.length ? record.tags.join(' · ') : null}
          </p>
        ) : null}
        <Sources sources={record.sources} />
      </div>
      <ProgressFooter />
    </aside>
  )
}

function downloadProgress(json: string) {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'cd-companion-progress.json'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function ProgressFooter() {
  const progress = useAppStore((s) => s.progress)
  const replaceProgress = useAppStore((s) => s.replaceProgress)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <footer className="shrink-0 border-t border-white/10 px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={btnBlock}
          onClick={() => downloadProgress(exportProgress(progress))}
        >
          Export progress
        </button>
        <button type="button" className={btnBlock} onClick={() => fileRef.current?.click()}>
          Import progress
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file === undefined) return
          void (async () => {
            try {
              replaceProgress(importProgress(await file.text()))
              setImportError(null)
            } catch (error) {
              setImportError(error instanceof Error ? error.message : 'Could not import progress')
            }
          })()
        }}
      />
      {importError ? <p className="mt-2 text-xs text-amber-300">{importError}</p> : null}
      <p className="mt-2 text-xs text-neutral-500">
        {progress.steps.length} steps, {progress.quests.length} quests,{' '}
        {progress.collected.length} collected
      </p>
    </footer>
  )
}
