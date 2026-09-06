import { poiProgressKey } from '../../config/pois'
import type { EntityOf } from '../../content/types'
import { useAppStore } from '../../store'
import { LinkList } from './EntityLink'
import RewardList from './RewardList'
import { Field, Section } from './Section'

export default function CollectionSection({ record }: { record: EntityOf<'collection'> }) {
  const collectibles = useAppStore((s) => s.content.byType.collectible)
  const collected = useAppStore((s) => s.progress.collected)
  const poiIndex = useAppStore((s) => s.poiIndex)
  const members = collectibles.filter(
    (entity): entity is EntityOf<'collectible'> =>
      entity.type === 'collectible' && entity.collection === record.id,
  )
  const collectedSet = new Set(collected)
  let found = 0
  for (const member of members) {
    if (collectedSet.has(member.id)) found += 1
  }
  let poiCount = 0
  if (record.poiType !== undefined && poiIndex !== null) {
    for (const node of poiIndex.nodes) {
      if (node.type !== record.poiType) continue
      poiCount += 1
      if (collectedSet.has(poiProgressKey(node.id))) found += 1
    }
  }
  let total: number | undefined
  if (record.total !== undefined) {
    total = record.total
  } else if (record.poiType !== undefined && poiIndex !== null) {
    total = members.length + poiCount
  } else if (members.length > 0) {
    total = members.length
  }
  const heading =
    record.total !== undefined ? `Members (${members.length} of ${record.total})` : 'Members'
  return (
    <>
      <Field label="Total">{record.total}</Field>
      {total !== undefined ? (
        <p className="mt-1.5 text-sm tabular-nums text-neutral-100">
          Found {found} of {total}
        </p>
      ) : null}
      <RewardList rewards={record.reward ? [record.reward] : undefined} title="Reward" />
      <Field label="POI type">{record.poiType}</Field>
      {members.length > 0 || record.total !== undefined ? (
        <Section title={heading}>
          {members.length > 0 ? (
            <LinkList ids={members.map((item) => item.id)} />
          ) : (
            <p className="text-sm text-neutral-400">None recorded yet</p>
          )}
        </Section>
      ) : null}
    </>
  )
}
