import type { EntityOf } from '../../content/types'
import { LinkList } from './EntityLink'
import Markdown from './Markdown'
import RewardList from './RewardList'
import { Field, Section } from './Section'

export default function ActivitySection({ record }: { record: EntityOf<'activity'> }) {
  return (
    <>
      <Field label="Kind">{record.kind.replace(/-/g, ' ')}</Field>
      {record.rules ? (
        <Section title="Rules">
          <Markdown source={record.rules} />
        </Section>
      ) : null}
      <RewardList rewards={record.rewards} />
      {record.locations?.length ? (
        <Section title="Locations">
          <LinkList ids={record.locations} />
        </Section>
      ) : null}
    </>
  )
}
