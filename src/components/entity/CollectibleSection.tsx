import { stepKey } from '../../content/progress'
import type { EntityOf } from '../../content/types'
import { useAppStore } from '../../store'
import GuideSteps from '../GuideSteps'
import EntityLink from './EntityLink'
import RewardList from './RewardList'
import { Field, Section } from './Section'

export default function CollectibleSection({ record }: { record: EntityOf<'collectible'> }) {
  const collected = useAppStore((s) => s.progress.collected.includes(record.id))
  const toggleCollectedDone = useAppStore((s) => s.toggleCollectedDone)
  return (
    <>
      <label className="mt-1.5 flex min-h-11 items-center gap-2 text-sm text-neutral-100">
        <input
          type="checkbox"
          checked={collected}
          onChange={() => toggleCollectedDone(record.id)}
        />
        Collected
      </label>
      <Field label="Collection">
        <EntityLink id={record.collection} />
      </Field>
      <Field label="Index">{record.index}</Field>
      <Section title="Guide">
        <GuideSteps
          entityId={record.id}
          steps={record.guide ?? []}
          keyFor={(j) => stepKey(record.id, j)}
        />
      </Section>
      <RewardList rewards={record.reward ? [record.reward] : undefined} title="Reward" />
    </>
  )
}
