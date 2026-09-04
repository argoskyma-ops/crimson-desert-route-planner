import { CLASS_COLORS } from '../config/travel'
import { findEdge, isNodeSnap, type DraftSnap } from '../editor/graph-edit'
import { ROAD_CLASSES, type RoadClass } from '../routing/types'
import { useAppStore } from '../store'

const TOOLS = [
  { id: 'draw', label: 'Draw' },
  { id: 'select', label: 'Select' },
] as const

const CLASS_SHORT: Record<RoadClass, string> = {
  main: 'Main',
  sub: 'Sub',
  offroad: 'Off-road',
}

const btn =
  'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium'
const btnBlock =
  'inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-neutral-800/80 px-3 text-sm font-medium text-neutral-100 hover:bg-neutral-700/80 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-neutral-800/80'

function statusLine(
  draftCount: number,
  lastSnap: DraftSnap | undefined,
  selectedEdgeId: string | null,
  selectedClass: RoadClass | null,
  tool: 'draw' | 'select',
): string {
  if (draftCount > 0) {
    const count = draftCount === 1 ? '1 point' : `${draftCount} points`
    if (!lastSnap) return count
    return isNodeSnap(lastSnap) ? `${count}, snapped to node` : `${count}, snapped to edge`
  }
  if (selectedEdgeId) return `Selected ${selectedEdgeId} (${selectedClass ?? 'unknown'})`
  return tool === 'draw' ? 'Tap the map to add vertices' : 'Tap a road to select it'
}

export default function EditorPanel() {
  const tool = useAppStore((s) => s.editor.tool)
  const draftPoints = useAppStore((s) => s.editor.draftPoints)
  const selectedEdgeId = useAppStore((s) => s.editor.selectedEdgeId)
  const newEdgeClass = useAppStore((s) => s.editor.newEdgeClass)
  const dirty = useAppStore((s) => s.editor.dirty)
  const roads = useAppStore((s) => s.roads)
  const setTool = useAppStore((s) => s.setTool)
  const setSelectedClass = useAppStore((s) => s.setSelectedClass)
  const finishDraft = useAppStore((s) => s.finishDraft)
  const undoDraftPoint = useAppStore((s) => s.undoDraftPoint)
  const cancelDraft = useAppStore((s) => s.cancelDraft)
  const deleteSelected = useAppStore((s) => s.deleteSelected)

  const selectedEdge = selectedEdgeId && roads ? findEdge(roads, selectedEdgeId) : undefined
  const pickerClass =
    tool === 'select' && selectedEdge ? selectedEdge.class : newEdgeClass
  const last = draftPoints.at(-1)
  const status = statusLine(
    draftPoints.length,
    last?.snap,
    selectedEdgeId,
    selectedEdge?.class ?? null,
    tool,
  )

  return (
    <section
      className="rounded-xl border border-white/10 bg-neutral-950/80 p-3 text-neutral-100 shadow-lg backdrop-blur-md"
      aria-label="Road editor"
    >
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-neutral-800/90 p-1">
        {TOOLS.map((item) => {
          const selected = tool === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setTool(item.id)}
              className={`${btn} ${
                selected
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-300 hover:bg-neutral-700/70'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-neutral-800/90 p-1">
        {ROAD_CLASSES.map((cls) => {
          const selected = pickerClass === cls
          return (
            <button
              key={cls}
              type="button"
              aria-pressed={selected}
              onClick={() => setSelectedClass(cls)}
              className={`${btn} gap-1.5 ${
                selected
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-300 hover:bg-neutral-700/70'
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CLASS_COLORS[cls] }}
                aria-hidden
              />
              {CLASS_SHORT[cls]}
            </button>
          )
        })}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => finishDraft()}
          disabled={draftPoints.length < 2}
          className={btnBlock}
        >
          Finish
        </button>
        <button
          type="button"
          onClick={() => undoDraftPoint()}
          disabled={draftPoints.length === 0}
          className={btnBlock}
        >
          Undo point
        </button>
        <button
          type="button"
          onClick={() => cancelDraft()}
          disabled={draftPoints.length === 0}
          className={btnBlock}
        >
          Cancel
        </button>
      </div>

      <button
        type="button"
        onClick={() => deleteSelected()}
        disabled={!selectedEdgeId}
        className={`${btnBlock} mt-1`}
      >
        Delete
      </button>

      <p className="mt-2 px-1 text-xs text-neutral-400">{status}</p>
      {dirty ? (
        <p className="mt-1 px-1 text-xs font-medium text-amber-400">Unsaved changes</p>
      ) : null}
    </section>
  )
}
