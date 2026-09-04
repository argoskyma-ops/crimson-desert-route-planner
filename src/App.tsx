import { useEffect } from 'react'
import ControlPanel from './components/ControlPanel'
import Legend from './components/Legend'
import MapView from './components/MapView'
import { loadRoads } from './lib/roads-loader'
import { useAppStore } from './store'

export default function App() {
  const setRoads = useAppStore((s) => s.setRoads)

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
      <Legend />
    </div>
  )
}
