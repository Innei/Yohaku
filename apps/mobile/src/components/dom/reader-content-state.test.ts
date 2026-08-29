import { describe, expect, it } from 'vitest'

import { activePreparedContent } from './reader-content-state'

describe('activePreparedContent', () => {
  it('hands prepared content back to live props once the new host catches up', () => {
    const prepared = { content: 'article B', id: 'b' }

    expect(activePreparedContent(prepared, 'a', 'article A')).toBe(prepared)
    expect(activePreparedContent(prepared, 'b', 'article B')).toBeNull()
    expect(activePreparedContent(null, 'b', 'article B')).toBeNull()
  })
})
