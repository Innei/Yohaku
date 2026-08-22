import { describe, expect, it } from 'vitest'

import { noticeCardHasWash } from './notice-card-theme'

describe('noticeCardHasWash', () => {
  it('keeps the light wash and drops it in dark', () => {
    expect(noticeCardHasWash('light')).toBe(true)
    expect(noticeCardHasWash('dark')).toBe(false)
  })
})
