import { useEffect } from 'react'
import ControlPanel from './components/ControlPanel'
import EditorPanel from './components/EditorPanel'
import Legend from './components/Legend'
import MapView from './components/MapView'
import { loadRoads } from './lib/roads-loader'
import { loadWaterMask } from './lib/water-mask-loader'
import { useAppStore } from './store'

export default function App() {
  const setRoads = useAppStore((s) => s.setRoads)
  const setWaterMask = useAppStore((s) => s.setWaterMask)
  const editorActive = useAppStore((s) => s.editor.active)
  const editorDirty = useAppStore((s) => s.editor.dirty)
  const toggleEditor = useAppStore((s) => s.toggleEditor)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      // The water mask (D10) loads alongside the graph; it never blocks routing.
      const [roadsResult, waterResult] = await Promise.allSettled([loadRoads(), loadWaterMask()])
      if (cancelled) return
      setWaterMask(waterResult.status === 'fulfilled' ? waterResult.value ?? null : null)
      if (roadsResult.status === 'fulfilled') {
        setRoads(roadsResult.value)
        return
      }
      const err = roadsResult.reason
      setRoads(null, err instanceof Error ? err.message : 'Invalid roads.json')
    })()
    return () => {
      cancelled = true
    }
  }, [setRoads, setWaterMask])

  useEffect(() => {
    if (!editorDirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [editorDirty])

  return (
    <div className="relative h-dvh overflow-hidden bg-neutral-950 text-neutral-100">
      <MapView />
      <ControlPanel />
      <div
        className={`pointer-events-none absolute top-3 right-3 z-[1100] flex w-[min(calc(100%-1.5rem),17.5rem)] flex-col gap-2 max-[479px]:top-auto max-[479px]:right-3 max-[479px]:bottom-28 max-[479px]:w-[min(calc(100%-5.5rem),17.5rem)] max-[479px]:flex-col-reverse ${
          editorActive ? 'items-stretch' : 'items-end'
        }`}
      >
        <button
          type="button"
          aria-pressed={editorActive}
          onClick={() => toggleEditor()}
          className={`pointer-events-auto inline-flex min-h-11 items-center justify-center rounded-xl border px-3 text-sm font-medium shadow-lg backdrop-blur-md ${
            editorActive
              ? 'border-white/20 bg-neutral-100 text-neutral-900'
              : 'border-white/10 bg-neutral-950/80 text-neutral-100 hover:bg-neutral-800/80'
          }`}
        >
          {editorActive ? 'Done editing' : 'Edit roads'}
        </button>
        {editorActive ? (
          <div className="pointer-events-auto">
            <EditorPanel />
          </div>
        ) : null}
        {!editorActive && editorDirty ? (
          <p className="pointer-events-auto px-1 text-xs font-medium text-amber-400">Unsaved changes</p>
        ) : null}
      </div>
      {!editorActive ? <Legend /> : null}
    </div>
  )
}
