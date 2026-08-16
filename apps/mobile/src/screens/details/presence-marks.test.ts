import { describe, expect, it } from 'vitest'

import { derivePresenceMarks, MARK_MERGE_GAP } from './presence-marks'

const entry = (identity: string, position: unknown) => ({
  identity,
  position,
  ts: 1,
})

describe('derivePresenceMarks', () => {
  it('returns nothing for an empty or missing room', () => {
    expect(derivePresenceMarks(undefined, 'me')).toEqual([])
    expect(derivePresenceMarks(null, 'me')).toEqual([])
    expect(derivePresenceMarks({}, 'me')).toEqual([])
  })

  it('excludes the current session and keeps others sorted', () => {
    const marks = derivePresenceMarks(
      {
        me: entry('me', 40),
        a: entry('a', 81),
        b: entry('b', 14),
      },
      'me',
    )
    expect(marks.map((m) => m.position)).toEqual([14, 81])
    expect(marks.map((m) => m.identity)).toEqual(['b', 'a'])
  })

  it('drops entries without a finite position and clamps the rest', () => {
    const marks = derivePresenceMarks(
      {
        a: entry('a', Number.NaN),
        b: entry('b', 'high'),
        c: entry('c', -5),
        d: entry('d', 140),
      },
      'me',
    )
    expect(marks.map((m) => m.position)).toEqual([0, 100])
  })

  it('merges marks closer than the merge gap into one', () => {
    const marks = derivePresenceMarks(
      {
        a: entry('a', 50),
        b: entry('b', 50 + MARK_MERGE_GAP),
        c: entry('c', 90),
      },
      'me',
    )
    expect(marks).toHaveLength(2)
    expect(marks[0].position).toBeCloseTo(50 + MARK_MERGE_GAP / 2)
    expect(marks[0].identity).toBe('a')
    expect(marks[1].position).toBe(90)
  })

  it('keys clusters by their lowest identity for stable reconciliation', () => {
    const marks = derivePresenceMarks(
      {
        z: entry('z', 10),
        a: entry('a', 11),
      },
      'me',
    )
    expect(marks).toHaveLength(1)
    expect(marks[0].identity).toBe('a')
  })
})
