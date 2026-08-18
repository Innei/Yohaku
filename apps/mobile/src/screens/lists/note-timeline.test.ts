import { describe, expect, it } from 'vitest'

import {
  groupNotesByYear,
  hasMoreNotes,
  letterCountLabel,
  nextNoteListPage,
  notePreviewIsClipped,
  noteShowsInlineBody,
  splitLatestNote,
} from './note-timeline'

function note(createdAt: string) {
  return { createdAt: new Date(createdAt) }
}

describe('groupNotesByYear', () => {
  it('returns empty for no notes', () => {
    expect(groupNotesByYear([])).toEqual([])
  })

  it('groups a pre-sorted descending list by year', () => {
    expect(
      groupNotesByYear([
        note('2026-03-14T04:00:00.000Z'),
        note('2026-01-02T04:00:00.000Z'),
        note('2025-12-31T04:00:00.000Z'),
        note('2025-02-01T04:00:00.000Z'),
      ]).map((group) => ({
        year: group.year,
        count: group.notes.length,
      })),
    ).toEqual([
      { year: 2026, count: 2 },
      { year: 2025, count: 2 },
    ])
  })
})

describe('letterCountLabel', () => {
  it('uses the editorial English plural', () => {
    expect(letterCountLabel(1)).toBe('1 letter')
    expect(letterCountLabel(12)).toBe('12 letters')
  })
})

describe('splitLatestNote', () => {
  it('returns null latest when the list is empty', () => {
    expect(splitLatestNote([])).toEqual({ latest: null, older: [] })
  })

  it('takes the first note as latest and leaves the rest as older', () => {
    const latest = note('2026-03-14T04:00:00.000Z')
    const older = [
      note('2026-01-02T04:00:00.000Z'),
      note('2025-12-31T04:00:00.000Z'),
    ]
    expect(splitLatestNote([latest, ...older])).toEqual({ latest, older })
  })

  it('returns empty older when there is only one note', () => {
    const latest = note('2026-03-14T04:00:00.000Z')
    expect(splitLatestNote([latest])).toEqual({ latest, older: [] })
  })
})

describe('notePreviewIsClipped', () => {
  it('treats a measured height at the cap as clipped', () => {
    expect(notePreviewIsClipped(360, 360)).toBe(true)
  })

  it('treats taller content as clipped', () => {
    expect(notePreviewIsClipped(480, 360)).toBe(true)
  })

  it('ignores empty measurements and short previews', () => {
    expect(notePreviewIsClipped(0, 360)).toBe(false)
    expect(notePreviewIsClipped(200, 360)).toBe(false)
  })
})

describe('noteShowsInlineBody', () => {
  it('shows a lexical body that is unlocked and present', () => {
    expect(
      noteShowsInlineBody({
        content: '{"root":{}}',
        contentFormat: 'lexical',
        hasPassword: false,
      }),
    ).toBe(true)
  })

  it('hides password-protected, markdown, and empty bodies', () => {
    expect(
      noteShowsInlineBody({
        content: '{"root":{}}',
        contentFormat: 'lexical',
        hasPassword: true,
      }),
    ).toBe(false)
    expect(
      noteShowsInlineBody({
        content: '# hi',
        contentFormat: 'markdown',
        hasPassword: false,
      }),
    ).toBe(false)
    expect(
      noteShowsInlineBody({
        content: null,
        contentFormat: 'lexical',
        hasPassword: false,
      }),
    ).toBe(false)
  })
})

describe('nextNoteListPage', () => {
  it('asks for page 2 after a full first page', () => {
    expect(nextNoteListPage(20, 0)).toBe(2)
  })

  it('skips pages already sitting in the local cache', () => {
    expect(nextNoteListPage(40, 1)).toBe(3)
  })

  it('does not go backwards when fetched page is ahead of the cache', () => {
    expect(nextNoteListPage(20, 3)).toBe(4)
  })
})

describe('hasMoreNotes', () => {
  it('stops when the loaded count reaches the known total', () => {
    expect(hasMoreNotes(20, 20)).toBe(false)
    expect(hasMoreNotes(20, 45)).toBe(true)
  })

  it('assumes more pages only when a full page is already loaded', () => {
    expect(hasMoreNotes(20, null)).toBe(true)
    expect(hasMoreNotes(15, null)).toBe(false)
    expect(hasMoreNotes(0, null)).toBe(false)
  })
})
