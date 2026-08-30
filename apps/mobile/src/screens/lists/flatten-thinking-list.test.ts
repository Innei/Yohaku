import { describe, expect, it } from 'vitest'

import {
  flattenThinkingList,
  THINKING_CHROME_ID,
  thinkingDayItemId,
} from './flatten-thinking-list'

describe('flattenThinkingList', () => {
  it('keeps chrome, day kickers, and thinking rows', () => {
    expect(
      flattenThinkingList({
        groups: [
          { key: '2026-08-30', items: [{ id: 't1' }, { id: 't2' }] },
          { key: '2026-08-29', items: [{ id: 't3' }] },
        ],
      }).map((item) => [item.id, item.type]),
    ).toEqual([
      [THINKING_CHROME_ID, 'chrome'],
      [thinkingDayItemId('2026-08-30'), 'day'],
      ['t1', 'thinking'],
      ['t2', 'thinking'],
      [thinkingDayItemId('2026-08-29'), 'day'],
      ['t3', 'thinking'],
    ])
  })
})
