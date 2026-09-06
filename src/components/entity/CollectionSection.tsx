import type { EntityOf } from '../../content/types'
import { useAppStore } from '../../store'
import { LinkList } from './EntityLink'
import RewardList from './RewardList'
import { Field, Section } from './Section'

export default function CollectionSection({ record }: { record: EntityOf<'collection'> }) {
  const collectibles = useAppStore((s) => s.content.byType.collectible)
  const members = collectibles.filter(
    (entity): entity is EntityOf<'collectible'> =>
      entity.type === 'collectible' && entity.collection === record.id,
  )
  const heading =
    record.total !== undefined ? `Members (${members.length} of ${record.total})` : 'Members'
  return (
    <>
      <Field label="Total">{record.total}</Field>
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
