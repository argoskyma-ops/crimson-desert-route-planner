import type { EntityOf } from '../../content/types'
import { LinkList } from './EntityLink'
import { Field, Section } from './Section'

export default function StorylineSection({ record }: { record: EntityOf<'storyline'> }) {
  return (
    <>
      <Field label="Kind">{record.kind.replace(/-/g, ' ')}</Field>
      <Section title="Chapters">
        <div className="space-y-3">
          {record.chapters.map((chapter) => (
            <div key={chapter.title}>
              <h4 className="text-sm font-medium text-neutral-100">{chapter.title}</h4>
              {chapter.pointsOfNoReturn?.map((line) => (
                <p key={line} className="text-xs text-amber-400">
                  {line}
                </p>
              ))}
              <LinkList ids={chapter.quests} />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Branches">
        {record.branches?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-200">
            {record.branches.map((branch) => (
              <li key={branch}>{branch}</li>
            ))}
          </ul>
        ) : null}
      </Section>
      <Section title="Points of no return">
        {record.pointsOfNoReturn?.length ? (
          <ul className="space-y-1">
            {record.pointsOfNoReturn.map((line) => (
              <li key={line} className="text-xs text-amber-400">
                {line}
              </li>
            ))}
          </ul>
        ) : null}
      </Section>
    </>
  )
}
