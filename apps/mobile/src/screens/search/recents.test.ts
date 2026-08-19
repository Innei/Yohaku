import { describe, expect, it } from 'vitest'

import {
  clearRecents,
  EMPTY_RECENTS,
  forgetRecent,
  parseRecents,
  rememberRecent,
  serializeRecents,
} from './recents'

describe('rememberRecent', () => {
  it('ignores blank keywords', () => {
    expect(rememberRecent(EMPTY_RECENTS, 'posts', '  ')).toEqual(EMPTY_RECENTS)
  })

  it('moves a repeat to the front and caps at 10', () => {
    let state = EMPTY_RECENTS
    for (let i = 0; i < 12; i += 1) {
      state = rememberRecent(state, 'posts', `q${i}`)
    }
    expect(state.posts).toEqual([
      'q11',
      'q10',
      'q9',
      'q8',
      'q7',
      'q6',
      'q5',
      'q4',
      'q3',
      'q2',
    ])
    expect(rememberRecent(state, 'posts', 'q5').posts[0]).toBe('q5')
    expect(rememberRecent(state, 'posts', 'q5').posts).toHaveLength(10)
  })

  it('isolates scopes', () => {
    const state = rememberRecent(
      rememberRecent(EMPTY_RECENTS, 'posts', 'react'),
      'notes',
      '手记',
    )
    expect(state.posts).toEqual(['react'])
    expect(state.notes).toEqual(['手记'])
    expect(state.thinking).toEqual([])
  })
})

describe('forget and clear', () => {
  it('removes one query or the whole scope', () => {
    const state = rememberRecent(
      rememberRecent(EMPTY_RECENTS, 'posts', 'a'),
      'posts',
      'b',
    )
    expect(forgetRecent(state, 'posts', 'b').posts).toEqual(['a'])
    expect(clearRecents(state, 'posts').posts).toEqual([])
    expect(clearRecents(state, 'posts').notes).toEqual(state.notes)
  })
})

describe('parse and serialize', () => {
  it('round-trips and rejects junk', () => {
    const state = rememberRecent(EMPTY_RECENTS, 'thinking', '余白')
    expect(parseRecents(serializeRecents(state))).toEqual(state)
    expect(parseRecents(null)).toEqual(EMPTY_RECENTS)
    expect(parseRecents('{')).toEqual(EMPTY_RECENTS)
    expect(parseRecents('{"posts":"nope"}')).toEqual(EMPTY_RECENTS)
  })
})
