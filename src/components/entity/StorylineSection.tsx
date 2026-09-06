import { useMemo } from 'react'
import { storylineProgress } from '../../content/storyline'
import type { EntityOf } from '../../content/types'
import { useAppStore } from '../../store'
import EntityLink from './EntityLink'
import { Badge, Field, PanelButton, Section } from './Section'

function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : (done / total) * 100
  return (
    <div className="h-1.5 rounded bg-neutral-800">
      <div className="h-1.5 rounded bg-sky-400" style={{ width: `${percent}%` }} />
    </div>
  )
}

export default function StorylineSection({ record }: { record: EntityOf<'storyline'> }) {
  const quests = useAppStore((s) => s.progress.quests)
  const toggleQuestDone = useAppStore((s) => s.toggleQuestDone)
  const selectEntity = useAppStore((s) => s.selectEntity)
  const doneSet = useMemo(() => new Set(quests), [quests])
  const progress = useMemo(() => storylineProgress(record, doneSet), [record, doneSet])

  return (
    <>
      <Field label="Kind">{record.kind.replace(/-/g, ' ')}</Field>
      <p className="mt-1.5 text-sm tabular-nums text-neutral-100">
        {progress.done} of {progress.total} quests
      </p>
      <div className="mt-1">
        <ProgressBar done={progress.done} total={progress.total} />
      </div>
      {progress.nextQuestId ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-500">Next</span>
          <EntityLink id={progress.nextQuestId} />
          <PanelButton onClick={() => selectEntity(progress.nextQuestId)}>Continue</PanelButton>
        </div>
      ) : null}
      <Section title="Chapters">
        <div className="space-y-3">
          {progress.chapters.map((chapter) => (
            <div key={chapter.title}>
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-sm font-medium text-neutral-100">{chapter.title}</h4>
                {chapter.total > 0 ? (
                  <span className="text-xs tabular-nums text-neutral-400">
                    {chapter.done}/{chapter.total}
                  </span>
                ) : null}
              </div>
              {chapter.pointsOfNoReturn.map((line) => (
                <p key={line} className="text-xs text-amber-400">
                  {line}
                </p>
              ))}
              <ul>
                {chapter.quests.map((id) => {
                  const isNext = id === progress.nextQuestId
                  return (
                    <li key={id}>
                      <label
                        className={`flex min-h-11 items-center gap-2 ${
                          isNext ? 'border-l-2 border-sky-400 pl-2' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={doneSet.has(id)}
                          onChange={() => toggleQuestDone(id)}
                        />
                        <span
                          className="min-w-0 flex-1"
                          onClick={(event) => event.preventDefault()}
                        >
                          <EntityLink id={id} />
                        </span>
                        {isNext ? <Badge>Next</Badge> : null}
                      </label>
                    </li>
                  )
                })}
              </ul>
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
