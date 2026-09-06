import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './store'

function resetEditor() {
  useAppStore.setState({
    selectedEntityId: null,
    highlight: null,
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
})
