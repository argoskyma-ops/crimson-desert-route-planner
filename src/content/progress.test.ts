import { describe, expect, it } from 'vitest'
import {
  acquisitionStepKey,
  emptyProgress,
  exportProgress,
  importProgress,
  loadProgress,
  parseProgress,
  PROGRESS_KEY,
  saveProgress,
  stepKey,
  toggleCollected,
  toggleQuest,
  toggleStep,
  type StorageLike,
} from './progress.ts'

function mapStorage(): StorageLike {
  const data = new Map<string, string>()
  return {
    getItem(key) {
      return data.get(key) ?? null
    },
    setItem(key, value) {
      data.set(key, value)
    },
  }
}

describe('progress keys', () => {
  it('builds guide and acquisition step keys', () => {
    expect(stepKey('quest:trial', 0)).toBe('quest:trial#g0')
    expect(stepKey('collectible:bell-1', 2)).toBe('collectible:bell-1#g2')
    expect(acquisitionStepKey('mount:rokade', 0, 1)).toBe('mount:rokade#a0s1')
  })
})

describe('parseProgress', () => {
  it('rejects version 0 and version 2 with a readable message', () => {
    const lists = { steps: [], quests: [], collected: [] }
    expect(() => parseProgress(JSON.stringify({ version: 0, ...lists }))).toThrow(
      'Progress file is version 0; this app reads version 1',
    )
    expect(() => parseProgress(JSON.stringify({ version: 2, ...lists }))).toThrow(
      'Progress file is version 2; this app reads version 1',
    )
  })

  it('accepts extra top-level keys and drops them', () => {
    const parsed = parseProgress(
      JSON.stringify({
        version: 1,
        steps: ['a#g0'],
        quests: [],
        collected: [],
        extra: true,
      }),
    )
    expect(parsed).toEqual({
      version: 1,
      steps: ['a#g0'],
      quests: [],
      collected: [],
    })
    expect(parsed).not.toHaveProperty('extra')
  })

  it('de-duplicates list entries', () => {
    const parsed = parseProgress(
      JSON.stringify({
        version: 1,
        steps: ['a#g0', 'a#g0', 'b#g1'],
        quests: ['q', 'q'],
        collected: ['c'],
      }),
    )
    expect(parsed.steps).toEqual(['a#g0', 'b#g1'])
    expect(parsed.quests).toEqual(['q'])
  })
})

describe('load and save', () => {
  it('round-trips through a Map-backed fake storage', () => {
    const storage = mapStorage()
    const progress = toggleStep(emptyProgress(), 'mount:rokade#a0s0')
    saveProgress(progress, storage)
    expect(storage.getItem(PROGRESS_KEY)).toBeTruthy()
    expect(loadProgress(storage)).toEqual(progress)
  })

  it('returns empty when the key is missing or JSON is invalid', () => {
    expect(loadProgress(mapStorage())).toEqual(emptyProgress())
    const storage = mapStorage()
    storage.setItem(PROGRESS_KEY, '{not json')
    expect(loadProgress(storage)).toEqual(emptyProgress())
  })

  it('returns emptyProgress from loadProgress(null)', () => {
    expect(loadProgress(null)).toEqual(emptyProgress())
  })
})

describe('toggles', () => {
  it('adds then removes and never mutates the input', () => {
    const start = emptyProgress()
    Object.freeze(start)
    Object.freeze(start.steps)
    Object.freeze(start.quests)
    Object.freeze(start.collected)

    const withStep = toggleStep(start, 'quest:x#g0')
    expect(withStep.steps).toEqual(['quest:x#g0'])
    expect(start.steps).toEqual([])
    expect(toggleStep(withStep, 'quest:x#g0').steps).toEqual([])
    expect(withStep.steps).toEqual(['quest:x#g0'])

    const withQuest = toggleQuest(start, 'quest:x')
    expect(withQuest.quests).toEqual(['quest:x'])
    expect(start.quests).toEqual([])
    expect(toggleQuest(withQuest, 'quest:x').quests).toEqual([])

    const withCollected = toggleCollected(start, 'collectible:y')
    expect(withCollected.collected).toEqual(['collectible:y'])
    expect(start.collected).toEqual([])
    expect(toggleCollected(withCollected, 'collectible:y').collected).toEqual([])
  })
})

describe('export and import', () => {
  it('round-trips and sorts keys inside each list', () => {
    const progress = {
      version: 1 as const,
      steps: ['b#g0', 'a#g0'],
      quests: ['quest:z', 'quest:a'],
      collected: ['c2', 'c1'],
    }
    const json = exportProgress(progress)
    expect(JSON.parse(json)).toEqual({
      version: 1,
      steps: ['a#g0', 'b#g0'],
      quests: ['quest:a', 'quest:z'],
      collected: ['c1', 'c2'],
    })
    expect(importProgress(json)).toEqual({
      version: 1,
      steps: ['a#g0', 'b#g0'],
      quests: ['quest:a', 'quest:z'],
      collected: ['c1', 'c2'],
    })
  })
})
