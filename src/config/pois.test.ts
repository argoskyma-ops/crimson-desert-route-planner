import { describe, expect, it } from 'vitest'
import {
  isPoiCheckable,
  poiGroupColor,
  poiGroupDefault,
  POI_FALLBACK_COLOR,
  POI_HIT_RADIUS_CSS_PX,
} from './pois'

describe('poi config', () => {
  it('marks listed types and prefix groups as checkable', () => {
    expect(isPoiCheckable('collection_chest', 'treasures')).toBe(true)
    expect(isPoiCheckable('any_type', 'hidden_legendary')).toBe(true)
    expect(isPoiCheckable('mine_iron', 'mining')).toBe(false)
  })

  it('lets the config default win over the file default', () => {
    expect(poiGroupDefault('abyss', true)).toBe(false)
    expect(poiGroupDefault('zzz_custom', true)).toBe(true)
    expect(poiGroupDefault('mining', true)).toBe(false)
  })

  it('falls back when a group has no colour', () => {
    expect(poiGroupColor('not-a-group')).toBe(POI_FALLBACK_COLOR)
    expect(poiGroupColor('treasures')).toBe('#fde047')
  })

  it('keeps the tap hit radius at 22 CSS px', () => {
    expect(POI_HIT_RADIUS_CSS_PX).toBe(22)
  })
})
