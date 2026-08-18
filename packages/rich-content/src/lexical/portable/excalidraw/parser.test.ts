import { describe, expect, it } from 'vitest'

import { normalizeScene, parseSnapshot } from './parser'

const scene = {
  appState: { viewBackgroundColor: '#fff' },
  elements: [{ id: 'r', type: 'rectangle', x: 0, y: 0, width: 10, height: 10 }],
  files: {},
}

describe('parseSnapshot', () => {
  it('treats an already-parsed scene object as inline', () => {
    expect(parseSnapshot(scene as never, undefined)).toEqual({
      kind: 'inline',
      scene: {
        type: 'excalidraw',
        elements: scene.elements,
        appState: scene.appState,
        files: {},
      },
    })
  })

  it('parses a remote http snapshot line', () => {
    expect(
      parseSnapshot('https://cdn.example/base.excalidraw.json', undefined),
    ).toEqual({
      kind: 'remote',
      fetchUrl: 'https://cdn.example/base.excalidraw.json',
    })
  })

  it('resolves a ref: snapshot against apiBase', () => {
    expect(
      parseSnapshot('ref:file/excalidraw.json', 'https://api.example'),
    ).toEqual({
      kind: 'remote',
      fetchUrl: 'https://api.example/objects/file/excalidraw.json',
    })
  })
})

describe('normalizeScene', () => {
  it('unwraps a JSON string payload', () => {
    expect(normalizeScene(JSON.stringify(scene))).toEqual({
      type: 'excalidraw',
      elements: scene.elements,
      appState: scene.appState,
      files: {},
    })
  })

  it('unwraps a { data } envelope', () => {
    expect(normalizeScene({ data: scene })).toEqual({
      type: 'excalidraw',
      elements: scene.elements,
      appState: scene.appState,
      files: {},
    })
  })

  it('returns null for a non-scene object', () => {
    expect(normalizeScene({ ok: true })).toBeNull()
  })
})
