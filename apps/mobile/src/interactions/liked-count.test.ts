import { describe, expect, it } from 'vitest'

import { likedActivityCount } from './liked-count'

describe('likedActivityCount', () => {
  it('ignores thinking downvotes', () => {
    expect(
      likedActivityCount([
        { kind: 'post' },
        { kind: 'note' },
        { kind: 'recently-up' },
        { kind: 'recently-down' },
      ]),
    ).toBe(3)
  })
})
