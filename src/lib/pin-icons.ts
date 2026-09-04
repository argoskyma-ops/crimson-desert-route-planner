import L from 'leaflet'

const PIN_COLORS = { A: '#22c55e', B: '#ef4444' } as const

/** Badge diameter. The pointer adds 8 px below, so the icon is 32 x 40. */
const BADGE = 32
const POINTER = 8
const ICON_H = BADGE + POINTER

/**
 * Draggable A/B pin. The geographic point is the pointer tip (bottom-centre).
 * `className` replaces Leaflet's `leaflet-div-icon` so we do not get a white box.
 */
export function makePinIcon(label: 'A' | 'B'): L.DivIcon {
  const color = PIN_COLORS[label]
  return L.divIcon({
    className: 'cd-pin',
    iconSize: [BADGE, ICON_H],
    iconAnchor: [BADGE / 2, ICON_H],
    html: `<div style="position:relative;width:${BADGE}px;height:${ICON_H}px">
  <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #fff;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))"></div>
  <div style="position:absolute;left:50%;bottom:2px;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color}"></div>
  <div style="position:absolute;top:0;left:0;box-sizing:border-box;width:${BADGE}px;height:${BADGE}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);color:#fff;font:700 14px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center">${label}</div>
</div>`,
  })
}
