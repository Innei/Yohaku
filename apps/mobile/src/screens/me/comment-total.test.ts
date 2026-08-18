import { describe, expect, it } from 'vitest'

import { commentTotalFromPage } from './comment-total'

describe('commentTotalFromPage', () => {
  it('sets total on success', () => {
    expect(commentTotalFromPage(null, { total: 4 })).toBe(4)
    expect(commentTotalFromPage(2, { total: 0 })).toBe(0)
  })

  it('keeps the previous total on error', () => {
    expect(commentTotalFromPage(7, { error: new Error('offline') })).toBe(7)
  })

  it('stays null when the first request fails', () => {
    expect(commentTotalFromPage(null, { error: new Error('offline') })).toBe(
      null,
    )
  })
})
