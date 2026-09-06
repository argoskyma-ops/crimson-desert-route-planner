import type { Prerequisite } from '../../content/types'
import EntityLink from './EntityLink'
import { Section } from './Section'

export default function PrerequisiteList({
  prerequisites,
}: {
  prerequisites?: Prerequisite[]
}) {
  if (prerequisites === undefined || prerequisites.length === 0) return null
  return (
    <Section title="Prerequisites">
      <ul className="space-y-1.5">
        {prerequisites.map((item, index) => (
          <li key={index} className="text-sm text-neutral-100">
            <p>{item.text}</p>
            {item.ref ? <EntityLink id={item.ref} /> : null}
            {item.value !== undefined ? (
              <p className="text-neutral-400">{String(item.value)}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  )
}
