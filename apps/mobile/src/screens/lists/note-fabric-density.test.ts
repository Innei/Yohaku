import { describe, expect, it } from 'vitest'

import { noteListEstimatedHeight, noteYearItemId } from './flatten-notes-list'
import {
  buildFabricRailMarks,
  clampFabricProgress,
  fabricProgressFromFingerX,
  fabricProgressVelocity,
  fabricRail,
  fabricTargetProgress,
  fabricTravel,
  formatFabricRailDate,
  formatFabricRailYear,
  interpolateFabricMarkT,
  snapFabricProgress,
} from './note-fabric-density'

function note(id: string, createdAt: string) {
  return { createdAt: new Date(createdAt), id }
}

describe('buildFabricRailMarks', () => {
  it('returns empty when there are no older notes', () => {
    expect(
      buildFabricRailMarks({
        formatNoteLabel: () => 'x',
        groups: [],
      }),
    ).toEqual([])
  })

  it('emits a year mark and one note mark per letter', () => {
    const marks = buildFabricRailMarks({
      formatNoteLabel: (date) => `d${date.getUTCDate()}`,
      groups: [
        {
          year: 2026,
          notes: [note('n2', '2026-03-14T04:00:00.000Z')],
        },
        {
          year: 2025,
          notes: [
            note('n3', '2025-12-31T04:00:00.000Z'),
            note('n4', '2025-02-01T04:00:00.000Z'),
          ],
        },
      ],
    })

    expect(marks.map((mark) => [mark.id, mark.kind, mark.label])).toEqual([
      [noteYearItemId(2026), 'year', '2026'],
      ['n2', 'note', 'd14'],
      [noteYearItemId(2025), 'year', '2025'],
      ['n3', 'note', 'd31'],
      ['n4', 'note', 'd1'],
    ])
  })

  it('collapses compact note marks into their year band', () => {
    const marks = buildFabricRailMarks({
      formatNoteLabel: () => '',
      groups: [
        { year: 2026, notes: [note('a', '2026-03-01T00:00:00.000Z')] },
        {
          year: 2025,
          notes: [
            note('b', '2025-06-01T00:00:00.000Z'),
            note('c', '2025-01-01T00:00:00.000Z'),
          ],
        },
      ],
    })

    const year2026 = marks.find((mark) => mark.id === noteYearItemId(2026))
    const year2025 = marks.find((mark) => mark.id === noteYearItemId(2025))
    const a = marks.find((mark) => mark.id === 'a')
    const b = marks.find((mark) => mark.id === 'b')
    const c = marks.find((mark) => mark.id === 'c')

    expect(year2026?.compactT).toBe(0)
    expect(year2025?.compactT).toBeCloseTo(1 / 3)
    expect(a?.compactT).toBeCloseTo(0.5 / 3)
    expect(b?.compactT).toBeCloseTo((1 + 0.5) / 3)
    expect(c?.compactT).toBeCloseTo((1 + 1.5) / 3)
    expect(a?.parentItemId).toBe(noteYearItemId(2026))
    expect(c?.parentItemId).toBe(noteYearItemId(2025))
  })

  it('spreads expanded marks by the older-list estimated heights', () => {
    const marks = buildFabricRailMarks({
      formatNoteLabel: () => '',
      groups: [
        { year: 2026, notes: [note('a', '2026-03-01T00:00:00.000Z')] },
        { year: 2025, notes: [note('b', '2025-01-01T00:00:00.000Z')] },
      ],
    })
    const total =
      noteListEstimatedHeight.year * 2 + noteListEstimatedHeight.note * 2
    const year2025 = marks.find((mark) => mark.id === noteYearItemId(2025))
    const b = marks.find((mark) => mark.id === 'b')

    expect(marks[0]?.expandedT).toBe(0)
    expect(year2025?.expandedT).toBeCloseTo(
      (noteListEstimatedHeight.year + noteListEstimatedHeight.note) / total,
    )
    expect(b?.expandedT).toBeCloseTo(
      (noteListEstimatedHeight.year * 2 + noteListEstimatedHeight.note) /
        total,
    )
  })
})

describe('fabricProgressFromFingerX', () => {
  const listWidth = 390
  const compactLeft = listWidth - fabricRail.compactWidth
  const expandedLeft = listWidth - fabricRail.expandedWidth

  it('is 0 at the compact rail edge and 1 at the expanded edge', () => {
    expect(
      fabricProgressFromFingerX({ fingerX: compactLeft, listWidth }),
    ).toBe(0)
    expect(
      fabricProgressFromFingerX({ fingerX: expandedLeft, listWidth }),
    ).toBe(1)
  })

  it('tracks the finger 1:1 between the two rail widths', () => {
    const mid = (compactLeft + expandedLeft) / 2
    expect(
      fabricProgressFromFingerX({ fingerX: mid, listWidth }),
    ).toBeCloseTo(0.5)
  })

  it('clamps outside the travel', () => {
    expect(fabricProgressFromFingerX({ fingerX: 12, listWidth })).toBe(1)
    expect(
      fabricProgressFromFingerX({ fingerX: listWidth + 8, listWidth }),
    ).toBe(0)
  })
})

describe('snapFabricProgress', () => {
  it('snaps open at or past the midpoint', () => {
    expect(snapFabricProgress(0.5)).toBe('expanded')
    expect(snapFabricProgress(0.72)).toBe('expanded')
  })

  it('snaps closed below the midpoint', () => {
    expect(snapFabricProgress(0)).toBe('compact')
    expect(snapFabricProgress(0.49)).toBe('compact')
  })

  it('lets a leftward fling open even from a low progress', () => {
    expect(
      snapFabricProgress(0.2, fabricProgressVelocity(-400, fabricTravel())),
    ).toBe('expanded')
  })

  it('lets a rightward fling close even from a high progress', () => {
    expect(
      snapFabricProgress(0.8, fabricProgressVelocity(400, fabricTravel())),
    ).toBe('compact')
  })

  it('ignores a weak flick and uses the threshold', () => {
    expect(snapFabricProgress(0.4, 0.2)).toBe('compact')
    expect(snapFabricProgress(0.6, -0.2)).toBe('expanded')
  })
})

describe('interpolateFabricMarkT', () => {
  it('lerps compact to expanded', () => {
    const mark = { compactT: 0.2, expandedT: 0.8 }
    expect(interpolateFabricMarkT(mark, 0)).toBeCloseTo(0.2)
    expect(interpolateFabricMarkT(mark, 1)).toBeCloseTo(0.8)
    expect(interpolateFabricMarkT(mark, 0.5)).toBeCloseTo(0.5)
  })
})

describe('fabric helpers', () => {
  it('clamps and maps density targets', () => {
    expect(clampFabricProgress(-1)).toBe(0)
    expect(clampFabricProgress(2)).toBe(1)
    expect(fabricTargetProgress('compact')).toBe(0)
    expect(fabricTargetProgress('expanded')).toBe(1)
    expect(formatFabricRailYear(2026)).toBe('2026')
  })

  it('formats a compact day-and-weekday rail label', () => {
    const date = new Date('2026-03-14T12:00:00+08:00')
    expect(formatFabricRailDate(date, 'en')).toBe('14 Sat')
    expect(formatFabricRailDate(date, 'zh')).toBe('14日 周六')
    expect(formatFabricRailDate(date, 'ja')).toBe('14日 土')
  })
})
