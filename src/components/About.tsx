import { useAppStore } from '../store'
import { Section } from './entity/Section'

const REPO_URL = 'https://github.com/argoskyma-ops/crimson-desert-route-planner'
const SOURCE_URL =
  'https://github.com/argoskyma-ops/crimson-desert-route-planner/blob/main/SOURCE.md'
const TH_GL_URL = 'https://crimsondesert.th.gl'
const FAN_GUIDELINES_URL =
  'https://crimsondesert.pearlabyss.com/en-us/Policy?_policyNo=130'

const linkClass =
  'flex min-h-11 items-center text-sky-300 underline underline-offset-2 hover:text-sky-200'

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
      {children}
    </a>
  )
}

export default function About({ onClose }: { onClose: () => void }) {
  const meta = useAppStore((s) => s.content.meta)
  const recordCount = useAppStore((s) => s.content.byId.size)
  const contentError = useAppStore((s) => s.contentError)
  const roadEdgeCount = useAppStore((s) => s.roads?.edges.length)
  const fastTravelCount = useAppStore((s) => s.fastTravel.length)
  const poiCount = useAppStore((s) => (s.pois === null ? null : s.pois.nodes.length))

  return (
    <aside
      aria-label="About"
      className="w-full rounded-xl border border-white/10 bg-neutral-950/80 p-3 text-neutral-100 shadow-lg backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">About</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-neutral-800/80 px-3 text-sm font-medium text-neutral-100 hover:bg-neutral-700/80"
        >
          Close
        </button>
      </div>

      <div className="max-h-[50dvh] overflow-y-auto overscroll-contain md:max-h-[70dvh]">
        <Section title="Disclosure">
          <p className="text-sm text-neutral-300">
            Unofficial fan project. Not affiliated with or endorsed by Pearl Abyss.
            Crimson Desert is a trademark of Pearl Abyss. Free to use: no paywall, no
            accounts, no tracking.
          </p>
        </Section>

        <Section title="Game version">
          {meta === null ? (
            <>
              <p className="text-sm text-neutral-300">Content metadata unavailable</p>
              {contentError ? (
                <p className="mt-1 text-sm text-amber-400">{contentError}</p>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-300">
                {meta.game.edition
                  ? `${meta.game.name} · ${meta.game.edition}`
                  : meta.game.name}
              </p>
              <p className="mt-1 text-sm text-neutral-300">
                Version {meta.game.version} ({meta.game.versionDate})
              </p>
              {meta.game.notesUrl ? (
                <ExternalLink href={meta.game.notesUrl}>Patch notes</ExternalLink>
              ) : null}
              {meta.expansions.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {meta.expansions.map((expansion) => (
                    <li key={expansion.name} className="text-sm text-neutral-300">
                      {expansion.date
                        ? `${expansion.name} · ${expansion.date} · ${expansion.status}`
                        : `${expansion.name} · ${expansion.status}`}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </Section>

        <Section title="Data in this build">
          <ul className="space-y-1 text-sm text-neutral-300">
            <li>{formatCount(recordCount)} content records</li>
            {roadEdgeCount !== undefined ? (
              <li>{formatCount(roadEdgeCount)} road edges</li>
            ) : null}
            <li>{formatCount(fastTravelCount)} fast-travel points</li>
            <li>
              {poiCount === null
                ? 'not generated'
                : `${formatCount(poiCount)} map points of interest`}
            </li>
          </ul>
        </Section>

        <Section title="Sources and licences">
          <p className="text-sm text-neutral-300">Code: MIT.</p>
          <ExternalLink href={REPO_URL}>Repository</ExternalLink>
          <p className="text-sm text-neutral-300">
            Map tiles and points of interest: from The Hidden Gaming Lair's Crimson
            Desert map, a fan site with no stated reuse licence; downloaded to this
            machine for personal use, never redistributed by this project.
          </p>
          <ExternalLink href={TH_GL_URL}>crimsondesert.th.gl</ExternalLink>
          <p className="text-sm text-neutral-300">
            Game content records: written for this project, facts checked against
            the sources each record cites, prose original, no copied wiki text and
            no third-party images.
          </p>
          <p className="mt-1 text-sm text-neutral-300">
            Committed road graph, water mask and fast-travel points: derived from
            fan-hosted renders and node dumps of the in-game map, provided for
            personal use with no claim over the underlying map.
          </p>
          <ExternalLink href={SOURCE_URL}>Full provenance: SOURCE.md</ExternalLink>
          <ExternalLink href={FAN_GUIDELINES_URL}>
            Pearl Abyss Fan Content Guidelines
          </ExternalLink>
        </Section>

        <Section title="Progress">
          <p className="text-sm text-neutral-300">
            Progress (steps, quests, collected) is stored in this browser only.
            Export and import it from any entity panel.
          </p>
        </Section>
      </div>
    </aside>
  )
}
