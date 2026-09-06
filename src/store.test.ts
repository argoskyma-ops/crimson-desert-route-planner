import { beforeEach, describe, expect, it } from 'vitest'
import type { PoiFile } from './content/pois-loader'
import { useAppStore } from './store'

function resetEditor() {
  useAppStore.setState({
    selectedEntityId: null,
    highlight: null,
    pois: null,
    poisError: null,
    poiIndex: null,
    poiGroups: {},
    focusedPoiId: null,
    layersOpen: false,
    panelTab: 'search',
    editor: {
      active: false,
      tool: 'draw',
      selectedEdgeId: null,
      draftPoints: [],
      newEdgeClass: 'main',
      dirty: false,
      contentDirty: false,
      mode: 'roads',
      pickTarget: null,
      picked: null,
    },
  })
}

function poiFixture(): PoiFile {
  return {
    version: 1,
    imageSize: [8192, 8192],
    source: 'test',
    fetched: '2026-09-06',
    groups: [
      {
        id: 'abyss',
        label: 'Abyss',
        defaultOn: true,
        category: '',
        types: [{ id: 'abyss_nexus', label: 'Abyss Nexus' }],
      },
      {
        id: 'mining',
        label: 'Mining',
        defaultOn: false,
        category: '',
        types: [{ id: 'mine_iron', label: 'Iron Mine' }],
      },
      {
        id: 'zzz_custom',
        label: 'Custom',
        defaultOn: true,
        category: '',
        types: [{ id: 'custom_node', label: 'Custom' }],
      },
    ],
    nodes: [
      { id: 'abyss_nexus@1:1', type: 'abyss_nexus', x: 10, y: 10 },
      { id: 'mine_iron@1:1', type: 'mine_iron', x: 20, y: 20 },
      { id: 'custom_1', type: 'custom_node', x: 30, y: 30 },
    ],
  }
}

describe('store', () => {
  beforeEach(resetEditor)

  it('resetPick clears pickTarget and picked after a delivered location pick', () => {
    useAppStore.getState().setEditor({ active: true, mode: 'content' })
    useAppStore.getState().armPick('location')
    useAppStore.getState().deliverPick({ x: 1, y: 2 })
    expect(useAppStore.getState().editor.picked).toEqual({ target: 'location', x: 1, y: 2 })

    useAppStore.getState().resetPick()
    expect(useAppStore.getState().editor.pickTarget).toBeNull()
    expect(useAppStore.getState().editor.picked).toBeNull()
  })

  it('selectEntity on an unknown id leaves selectedEntityId null', () => {
    useAppStore.getState().selectEntity('quest:does-not-exist')
    expect(useAppStore.getState().selectedEntityId).toBeNull()
  })

  it('setPois applies config defaults and keeps session toggles on reload', () => {
    const file = poiFixture()
    useAppStore.getState().setPois(file)
    expect(useAppStore.getState().poiGroups).toEqual({
      abyss: false,
      mining: false,
      zzz_custom: true,
    })
    expect(useAppStore.getState().poiIndex).not.toBeNull()

    useAppStore.getState().togglePoiGroup('mining')
    expect(useAppStore.getState().poiGroups.mining).toBe(true)
    useAppStore.getState().setPois(file)
    expect(useAppStore.getState().poiGroups).toEqual({
      abyss: false,
      mining: true,
      zzz_custom: true,
    })
  })

  it('focusPoi enables the node group and ignores unknown ids', () => {
    useAppStore.getState().setPois(poiFixture())
    const before = useAppStore.getState().poiGroups
    expect(before.mining).toBe(false)

    useAppStore.getState().focusPoi('missing-id')
    expect(useAppStore.getState().focusedPoiId).toBeNull()
    expect(useAppStore.getState().poiGroups).toEqual(before)

    useAppStore.getState().focusPoi('mine_iron@1:1')
    expect(useAppStore.getState().focusedPoiId).toBe('mine_iron@1:1')
    expect(useAppStore.getState().poiGroups.mining).toBe(true)
  })

  it('setPois(null) clears the index and focus but keeps group toggles', () => {
    useAppStore.getState().setPois(poiFixture())
    useAppStore.getState().togglePoiGroup('mining')
    useAppStore.getState().focusPoi('mine_iron@1:1')
    const groups = useAppStore.getState().poiGroups

    useAppStore.getState().setPois(null)
    expect(useAppStore.getState().pois).toBeNull()
    expect(useAppStore.getState().poiIndex).toBeNull()
    expect(useAppStore.getState().focusedPoiId).toBeNull()
    expect(useAppStore.getState().poiGroups).toEqual(groups)
  })

  it('setPoiGroups replaces the map in one update', () => {
    useAppStore.getState().setPois(poiFixture())
    let updates = 0
    const unsub = useAppStore.subscribe(() => {
      updates += 1
    })
    useAppStore.getState().setPoiGroups({ mining: true })
    unsub()
    expect(updates).toBe(1)
    expect(useAppStore.getState().poiGroups).toEqual({ mining: true })
  })

  it('setPois clears focusedPoiId when the new file no longer contains it', () => {
    const file = poiFixture()
    useAppStore.getState().setPois(file)
    useAppStore.getState().focusPoi('mine_iron@1:1')
    expect(useAppStore.getState().focusedPoiId).toBe('mine_iron@1:1')
    useAppStore.getState().setPois({
      ...file,
      nodes: file.nodes.filter((node) => node.id !== 'mine_iron@1:1'),
    })
    expect(useAppStore.getState().focusedPoiId).toBeNull()
  })

  it('setPanelTab quests closes layers; search keeps layersOpen', () => {
    useAppStore.setState({ layersOpen: true, panelTab: 'search' })
    useAppStore.getState().setPanelTab('quests')
    expect(useAppStore.getState().panelTab).toBe('quests')
    expect(useAppStore.getState().layersOpen).toBe(false)

    useAppStore.setState({ layersOpen: true })
    useAppStore.getState().setPanelTab('search')
    expect(useAppStore.getState().panelTab).toBe('search')
    expect(useAppStore.getState().layersOpen).toBe(true)

    useAppStore.setState({ layersOpen: false })
    useAppStore.getState().setPanelTab('search')
    expect(useAppStore.getState().layersOpen).toBe(false)
  })

  it('setPois keeps focusedPoiId when the new file still contains it', () => {
    const file = poiFixture()
    useAppStore.getState().setPois(file)
    useAppStore.getState().focusPoi('mine_iron@1:1')
    useAppStore.getState().setPois({ ...file, fetched: '2026-09-07' })
    expect(useAppStore.getState().focusedPoiId).toBe('mine_iron@1:1')
  })
})
