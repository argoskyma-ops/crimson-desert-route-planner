import type { EntityOf } from '../../content/types'
import EntityLink from './EntityLink'
import RewardList from './RewardList'
import { Field } from './Section'
import StepList from './StepList'

export default function CollectibleSection({ record }: { record: EntityOf<'collectible'> }) {
  return (
    <>
      <Field label="Collection">
        <EntityLink id={record.collection} />
      </Field>
      <Field label="Index">{record.index}</Field>
      <StepList steps={record.guide} title="Guide" />
      <RewardList rewards={record.reward ? [record.reward] : undefined} title="Reward" />
    </>
  )
}
