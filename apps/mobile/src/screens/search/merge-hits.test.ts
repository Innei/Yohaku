import { describe, expect, it } from 'vitest'

import { mergeHits, routableNoteHit, routablePostHit } from './merge-hits'

describe('mergeHits', () => {
  it('keeps local order and appends unseen remote ids', () => {
    expect(
      mergeHits(
        [
          { id: 'a' },
          { id: 'b' },
        ],
        [
          { id: 'b' },
          { id: 'c' },
          { id: 'a' },
          { id: 'd' },
        ],
      ),
    ).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }])
  })
})

describe('routablePostHit', () => {
  it('keeps hits that can open a native post screen', () => {
    expect(
      routablePostHit({
        id: '1',
        slug: 'hello',
        category: { slug: 'coding' },
      }),
    ).toEqual({
      categorySlug: 'coding',
      id: '1',
      slug: 'hello',
    })
    expect(routablePostHit({ id: '1', slug: 'hello' })).toBeNull()
    expect(
      routablePostHit({ id: '1', slug: 'hello', category: { slug: '' } }),
    ).toBeNull()
  })
})

describe('routableNoteHit', () => {
  it('keeps hits that have a nid', () => {
    expect(routableNoteHit({ id: 'n', nid: 12, hasPassword: true })).toEqual({
      hasPassword: true,
      id: 'n',
      nid: 12,
    })
    expect(routableNoteHit({ id: 'n' })).toBeNull()
  })
})
