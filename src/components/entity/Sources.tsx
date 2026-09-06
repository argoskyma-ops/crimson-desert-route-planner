import type { Source } from '../../content/types'
import { Section } from './Section'

function sourceLabel(source: Source): string {
  if (source.title) return source.title
  try {
    return new URL(source.url).hostname
  } catch {
    return source.url
  }
}

export default function Sources({ sources }: { sources: Source[] }) {
  return (
    <Section title="Sources">
      <ul className="space-y-1.5">
        {sources.map((source) => (
          <li key={source.url} className="text-xs text-neutral-400">
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:text-sky-300"
            >
              {sourceLabel(source)}
            </a>
            <span> · {source.accessed}</span>
            {source.note ? <span> · {source.note}</span> : null}
          </li>
        ))}
      </ul>
    </Section>
  )
}
