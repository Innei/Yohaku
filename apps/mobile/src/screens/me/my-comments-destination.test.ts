import { describe, expect, it } from 'vitest'

import type { ApiMyComment } from '@/api/types'

import { myCommentDestination } from './my-comments-destination'

function comment(overrides: Partial<ApiMyComment>): ApiMyComment {
  return {
    createdAt: '2026-08-15T00:00:00.000Z',
    id: 'c1',
    refId: 'r1',
    refType: 'post',
    source: null,
    sourceTitle: null,
    text: 'hi',
    ...overrides,
  }
}

describe('myCommentDestination', () => {
  it('opens a post when category and slug are present', () => {
    expect(
      myCommentDestination(
        comment({
          source: { categorySlug: 'coding', slug: 'hello' },
          sourceTitle: 'Hello',
        }),
      ),
    ).toEqual({
      kind: 'post',
      category: 'coding',
      slug: 'hello',
      commentId: 'c1',
    })
  })

  it('opens a note when nid is present', () => {
    expect(
      myCommentDestination(
        comment({
          refType: 'note',
          source: { nid: 12 },
          sourceTitle: 'Note',
        }),
      ),
    ).toEqual({ kind: 'note', nid: 12, commentId: 'c1' })
  })

  it('opens thinking when the recently ref still exists', () => {
    expect(
      myCommentDestination(
        comment({
          refId: 't9',
          refType: 'recently',
          source: {},
          sourceTitle: 'thinking',
        }),
      ),
    ).toEqual({ kind: 'thinking', refId: 't9' })
  })

  it('is unavailable when the joined source is missing', () => {
    expect(myCommentDestination(comment({ source: null }))).toEqual({
      kind: 'unavailable',
    })
    expect(
      myCommentDestination(
        comment({ refType: 'recently', source: null, sourceTitle: null }),
      ),
    ).toEqual({ kind: 'unavailable' })
    expect(
      myCommentDestination(comment({ refType: 'note', source: { slug: 'x' } })),
    ).toEqual({ kind: 'unavailable' })
  })
})
