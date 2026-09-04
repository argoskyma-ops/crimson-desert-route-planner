import { useEffect } from 'react'
import ControlPanel from './components/ControlPanel'
import EditorPanel from './components/EditorPanel'
import Legend from './components/Legend'
import MapView from './components/MapView'
import { loadRoads } from './lib/roads-loader'
import { useAppStore } from './store'

export default function App() {
  const setRoads = useAppStore((s) => s.setRoads)
  const editorActive = useAppStore((s) => s.editor.active)
  const editorDirty = useAppStore((s) => s.editor.dirty)
  const toggleEditor = useAppStore((s) => s.toggleEditor)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const roads = await loadRoads()
        if (!cancelled) setRoads(roads)
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Invalid roads.json'
          setRoads(null, message)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setRoads])

  return (
    <div className="relative h-dvh overflow-hidden bg-neutral-950 text-neutral-100">
      <MapView />
      <ControlPanel />
      <div className="pointer-events-auto absolute top-3 right-3 z-[1100] flex w-[min(calc(100%-1.5rem),17.5rem)] flex-col gap-2 max-[479px]:top-auto max-[479px]:right-3 max-[479px]:bottom-28 max-[479px]:flex-col-reverse">
        <button
          type="button"
          aria-pressed={editorActive}
          onClick={() => toggleEditor()}
          className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-medium shadow-lg backdrop-blur-md ${
            editorActive
              ? 'border-white/20 bg-neutral-100 text-neutral-900'
              : 'border-white/10 bg-neutral-950/80 text-neutral-100 hover:bg-neutral-800/80'
          }`}
        >
          {editorActive ? 'Done editing' : 'Edit roads'}
        </button>
        {editorActive ? <EditorPanel /> : null}
        {!editorActive && editorDirty ? (
          <p className="px-1 text-xs font-medium text-amber-400">Unsaved changes</p>
        ) : null}
      </div>
      <Legend />
    </div>
  )
}
