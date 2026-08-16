import { describe, expect, it } from 'vitest'

import { groupThinkingsByDay } from './thinking-timeline'

function item(createdAt: Date) {
  return { createdAt }
}

describe('groupThinkingsByDay', () => {
  it('returns empty for no items', () => {
    expect(groupThinkingsByDay([])).toEqual([])
  })

  it('groups a descending list by local calendar day', () => {
    expect(
      groupThinkingsByDay([
        item(new Date(2026, 7, 9, 14, 20)),
        item(new Date(2026, 7, 9, 9, 4)),
        item(new Date(2026, 7, 8, 18, 41)),
        item(new Date(2026, 4, 1, 12, 0)),
      ]).map((group) => ({
        key: group.key,
        count: group.items.length,
      })),
    ).toEqual([
      { key: '2026-08-09', count: 2 },
      { key: '2026-08-08', count: 1 },
      { key: '2026-05-01', count: 1 },
    ])
  })
})
