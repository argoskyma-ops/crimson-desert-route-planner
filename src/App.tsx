import ControlPanel from './components/ControlPanel'
import MapView from './components/MapView'

export default function App() {
  return (
    <div className="relative h-dvh overflow-hidden bg-neutral-950 text-neutral-100">
      <MapView />
      <ControlPanel />
    </div>
  )
}
