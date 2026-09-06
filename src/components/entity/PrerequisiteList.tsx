import type { PrerequisiteState } from '../../content/storyline'
import type { Prerequisite } from '../../content/types'
import EntityLink from './EntityLink'
import { Badge, Section } from './Section'

export default function PrerequisiteList({
  prerequisites,
  states,
}: {
  prerequisites?: Prerequisite[]
  states?: readonly PrerequisiteState[]
}) {
  if (prerequisites === undefined || prerequisites.length === 0) return null
  return (
    <Section title="Prerequisites">
      <ul className="space-y-1.5">
        {prerequisites.map((item, index) => {
          const state = states?.[index]
          return (
            <li key={index} className="text-sm text-neutral-100">
              <div className="flex flex-wrap items-center gap-1.5">
                <p>{item.text}</p>
                {state === 'met' ? <Badge>Met</Badge> : null}
                {state === 'unmet' ? <Badge warning>Not yet</Badge> : null}
              </div>
              {item.ref ? <EntityLink id={item.ref} /> : null}
              {item.value !== undefined ? (
                <p className="text-neutral-400">{String(item.value)}</p>
              ) : null}
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
