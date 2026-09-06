import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store'
import EntityBody from './entity/EntityBody'
import EntityHeader from './entity/EntityHeader'
import { LinkList } from './entity/EntityLink'
import Markdown from './entity/Markdown'
import Relations from './entity/Relations'
import { Section } from './entity/Section'
import Sources from './entity/Sources'

export default function EntityPanel() {
  const selectedEntityId = useAppStore((s) => s.selectedEntityId)
  const record = useAppStore((s) =>
    s.selectedEntityId === null ? undefined : s.content.byId.get(s.selectedEntityId),
  )
  const editorActive = useAppStore((s) => s.editor.active)
  const selectEntity = useAppStore((s) => s.selectEntity)
  const [expanded, setExpanded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setExpanded(false)
    scrollRef.current?.scrollTo(0, 0)
  }, [selectedEntityId])

  if (editorActive || selectedEntityId === null || record === undefined) return null

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
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      >
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
    </aside>
  )
}
