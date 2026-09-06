import { ENTITY_LABELS, type Entity } from '../../content/types'
import { useAppStore } from '../../store'
import EntityLink, { UnknownId } from './EntityLink'
import { Badge, PanelButton } from './Section'
import ShowOnMapButton from './ShowOnMap'

export default function EntityHeader({
  record,
  expanded,
  onToggleExpand,
  onClose,
}: {
  record: Entity
  expanded: boolean
  onToggleExpand: () => void
  onClose: () => void
}) {
  const region = useAppStore((s) =>
    record.region === undefined ? undefined : s.content.byId.get(record.region),
  )
  return (
    <header className="shrink-0 border-b border-white/10 px-3 pt-3 pb-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">{record.name}</h2>
            <Badge>{ENTITY_LABELS[record.type]}</Badge>
          </div>
          {record.region ? (
            <div className="mt-1 text-sm">
              {region ? <EntityLink id={record.region} /> : <UnknownId id={record.region} />}
            </div>
          ) : null}
          <p className="mt-1 text-xs text-neutral-400">
            {record.confidence} · checked against {record.gameVersion}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <PanelButton hiddenOnMd expanded={expanded} onClick={onToggleExpand}>
            {expanded ? 'Collapse' : 'Expand'}
          </PanelButton>
          <PanelButton onClick={onClose}>Close</PanelButton>
        </div>
      </div>
      {record.location ? (
        <div className="mt-2">
          <ShowOnMapButton location={record.location}>Show on map</ShowOnMapButton>
        </div>
      ) : null}
    </header>
  )
}
