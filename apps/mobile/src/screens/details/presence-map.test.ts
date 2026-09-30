import { describe, expect, it } from 'vitest'

import {
  buildTocPresence,
  otherReaderPositions,
  readingCount,
  sectionIndexAt,
  sectionReaders,
} from './presence-map'

describe('otherReaderPositions', () => {
  it('keeps every other reader unmerged and drops self', () => {
    expect(
      otherReaderPositions(
        {
          a: { identity: 'me', position: 10 },
          b: { identity: 'x', position: 40 },
          c: { identity: 'y', position: 41 },
          d: { identity: 'z', position: 'bad' },
        },
        'me',
      ),
    ).toEqual([40, 41])
  })
})

describe('sectionIndexAt', () => {
  const starts = [0, 30, 70]

  it('finds the last section starting at or before the position', () => {
    expect(sectionIndexAt(starts, 29)).toBe(0)
    expect(sectionIndexAt(starts, 30)).toBe(1)
    expect(sectionIndexAt(starts, 100)).toBe(2)
  })

  it('puts positions above the first heading into the first section', () => {
    expect(sectionIndexAt([12, 50], 3)).toBe(0)
  })
})

describe('sectionReaders', () => {
  it('counts readers per section', () => {
    expect(sectionReaders([0, 30, 70], [5, 31, 35, 90])).toEqual([1, 2, 1])
  })
})

describe('readingCount', () => {
  it('includes you and hides when you read alone', () => {
    expect(readingCount(3)).toBe(4)
    expect(readingCount(0)).toBeNull()
  })
})

describe('buildTocPresence', () => {
  const headings = [
    { blockId: 'h1', level: 2, text: 'A' },
    { blockId: 'h2', level: 2, text: 'B' },
    { blockId: 'h2a', level: 3, text: 'B.1' },
  ]
  const offsets: Record<string, number> = { h1: 100, h2: 600 }

  it('maps readers onto top-level sections by heading offset', () => {
    expect(
      buildTocPresence({
        contentHeight: 1000,
        headings,
        offsetFor: (id) => offsets[id] ?? null,
        readers: [20, 70, 90],
        self: 65,
      }),
    ).toEqual({ perSection: [1, 2], selfSection: 1, total: 4 })
  })

  it('keeps only the total when offsets are unknown', () => {
    expect(
      buildTocPresence({
        contentHeight: 1000,
        headings,
        offsetFor: () => null,
        readers: [20],
        self: 65,
      }),
    ).toEqual({ perSection: null, selfSection: null, total: 2 })
  })
})
