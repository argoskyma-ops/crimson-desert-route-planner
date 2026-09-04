import MapView from './components/MapView'

export default function App() {
  return (
    <div className="relative h-dvh overflow-hidden bg-neutral-950 text-neutral-100">
      <MapView />
      <aside className="absolute top-3 left-3 z-[1100] rounded-md border border-neutral-800 bg-neutral-900/90 px-3 py-2 shadow-lg backdrop-blur-sm">
        <p className="text-xs text-neutral-400">Crimson Desert Route Planner</p>
      </aside>
    </div>
  )
}
