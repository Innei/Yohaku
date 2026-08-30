import { describe, expect, it } from 'vitest'

import {
  flattenIndexList,
  INDEX_EMPTY_ID,
  INDEX_STATUS_ID,
} from './flatten-index-list'

describe('flattenIndexList', () => {
  it('lists rows after optional status', () => {
    expect(
      flattenIndexList({
        rowIds: ['a', 'b'],
        showEmpty: false,
        showStatus: true,
      }).map((item) => [item.id, item.type]),
    ).toEqual([
      [INDEX_STATUS_ID, 'status'],
      ['a', 'row'],
      ['b', 'row'],
    ])
  })

  it('stops at empty and does not emit rows', () => {
    expect(
      flattenIndexList({
        rowIds: ['a'],
        showEmpty: true,
        showStatus: false,
      }).map((item) => item.id),
    ).toEqual([INDEX_EMPTY_ID])
  })
})
