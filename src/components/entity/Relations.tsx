import { related, type RelationName } from '../../content/db'
import { useAppStore } from '../../store'
import { LinkList } from './EntityLink'
import { Section } from './Section'

const RELATION_HEADINGS = {
  soldBy: 'Sold by',
  droppedBy: 'Dropped by',
  rewardedBy: 'Rewarded by',
  usedIn: 'Used in',
  foundIn: 'Found in',
  memberOf: 'Member of',
} as const satisfies Record<RelationName, string>

const RELATION_ORDER: RelationName[] = [
  'soldBy',
  'droppedBy',
  'rewardedBy',
  'usedIn',
  'foundIn',
  'memberOf',
]

export default function Relations({ id }: { id: string }) {
  const db = useAppStore((s) => s.content)
  const groups = RELATION_ORDER
    .map((name) => ({ name, ids: related(db, name, id) }))
    .filter((group) => group.ids.length > 0)
  if (groups.length === 0) return null
  return (
    <>
      {groups.map((group) => (
        <Section key={group.name} title={RELATION_HEADINGS[group.name]}>
          <LinkList ids={group.ids} />
        </Section>
      ))}
    </>
  )
}
