import type { ReactNode } from 'react'
import type { ContentLocation } from '../../content/types'
import { toLatLng } from '../../lib/coords'
import { mapRef, useAppStore } from '../../store'
import { PanelButton } from './Section'

const OFF_MAP_TITLE = 'This location is not on the Pywel map'

export default function ShowOnMapButton({
  location,
  children = 'Show',
}: {
  location: ContentLocation
  children?: ReactNode
}) {
  const offMap = location.map !== 'pywel'
  return (
    <PanelButton
      disabled={offMap}
      title={offMap ? OFF_MAP_TITLE : undefined}
      onClick={() => {
        useAppStore.getState().setHighlight(location)
        if (location.map !== 'pywel') return
        const map = mapRef.current
        if (!map) return
        map.setView(toLatLng(location), Math.max(map.getZoom(), 5))
      }}
    >
      {children}
    </PanelButton>
  )
}
