import { describe, expect, it } from 'vitest'

import {
  liveDeskQueryDataFromSocket,
  liveDeskQueryKey,
} from './companion-presence'

describe('liveDeskQueryKey', () => {
  it('matches the public presence query', () => {
    expect(liveDeskQueryKey).toEqual(['companion', 'presence', 'public'])
  })
})

describe('liveDeskQueryDataFromSocket', () => {
  it('wraps a bare public state so the REST query shape stays', () => {
    const state = { schemaVersion: 2, projection: null, revision: 3 }
    expect(liveDeskQueryDataFromSocket(state)).toEqual({ state })
  })

  it('passes through an already-wrapped envelope', () => {
    const state = { schemaVersion: 2, projection: { availability: 'idle' } }
    expect(liveDeskQueryDataFromSocket({ state })).toEqual({ state })
  })

  it('ignores empty payloads', () => {
    expect(liveDeskQueryDataFromSocket(null)).toBeUndefined()
    expect(liveDeskQueryDataFromSocket('nope')).toBeUndefined()
  })
})
