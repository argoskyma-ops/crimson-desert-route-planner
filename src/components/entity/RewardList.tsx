import type { Reward } from '../../content/types'
import EntityLink from './EntityLink'
import { Section } from './Section'

export default function RewardList({
  rewards,
  title = 'Rewards',
}: {
  rewards?: Reward[]
  title?: string
}) {
  if (rewards === undefined || rewards.length === 0) return null
  return (
    <Section title={title}>
      <ul className="space-y-1.5">
        {rewards.map((reward, index) => (
          <li key={index} className="text-sm">
            <span className="capitalize text-neutral-400">{reward.kind.replace(/-/g, ' ')}</span>
            {reward.amount !== undefined ? (
              <span className="ml-2 tabular-nums text-neutral-100">{reward.amount}</span>
            ) : null}
            {reward.text ? <p className="text-neutral-100">{reward.text}</p> : null}
            {reward.ref ? <EntityLink id={reward.ref} /> : null}
          </li>
        ))}
      </ul>
    </Section>
  )
}
