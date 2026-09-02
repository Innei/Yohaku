import { describe, expect, it } from 'vitest'

import { blockReaderLocally, isReaderBlocked } from './blocked-readers'

describe('blocked readers', () => {
  it('marks a blocked reader immediately', () => {
    expect(isReaderBlocked('reader-to-block')).toBe(false)
    blockReaderLocally('reader-to-block')
    expect(isReaderBlocked('reader-to-block')).toBe(true)
  })
})
