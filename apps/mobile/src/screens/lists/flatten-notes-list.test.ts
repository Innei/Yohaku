import { describe, expect, it } from 'vitest'

import { articleIdsFromVisible } from './flatten-posts-list'
import {
  flattenNotesList,
  NOTE_LIST_FOOTER_ID,
  NOTE_LIST_RULE_ID,
  noteYearItemId,
} from './flatten-notes-list'

describe('flattenNotesList', () => {
  it('puts latest first, then older rule, years, and notes', () => {
    expect(
      flattenNotesList({
        latestId: 'n1',
        loadingMore: false,
        groups: [
          { year: 2026, notes: [{ id: 'n2' }] },
          { year: 2025, notes: [{ id: 'n3' }, { id: 'n4' }] },
        ],
      }).map((item) => [item.id, item.type]),
    ).toEqual([
      ['n1', 'latest'],
      [NOTE_LIST_RULE_ID, 'rule'],
      [noteYearItemId(2026), 'year'],
      ['n2', 'note'],
      [noteYearItemId(2025), 'year'],
      ['n3', 'note'],
      ['n4', 'note'],
    ])
  })

  it('appends a footer only while paging', () => {
    expect(
      flattenNotesList({
        latestId: null,
        loadingMore: true,
        groups: [],
      }).at(-1),
    ).toMatchObject({ id: NOTE_LIST_FOOTER_ID, type: 'footer' })
  })
})

describe('note visible ids', () => {
  it('keeps latest and note rows', () => {
    expect(
      articleIdsFromVisible(
        [
          { id: 'n1', type: 'latest' },
          { id: NOTE_LIST_RULE_ID, type: 'rule' },
          { id: 'n2', type: 'note' },
        ],
        ['latest', 'note'],
      ),
    ).toEqual(['n1', 'n2'])
  })
})
