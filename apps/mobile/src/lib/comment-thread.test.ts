import { describe, expect, it } from 'vitest'

import type { ApiComment, ApiCommentRoot } from '@/api/types'

import {
  buildThread,
  commentAvatar,
  commentDisplayName,
  mergeReplies,
  replyTargetAuthor,
} from './comment-thread'

function comment(overrides: Partial<ApiComment> & { id: string }): ApiComment {
  return {
    author: 'guest',
    avatar: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    parentCommentId: null,
    reader: null,
    refId: 'ref-1',
    rootCommentId: null,
    text: 'hi',
    url: null,
    ...overrides,
  }
}

function root(
  overrides: Partial<ApiCommentRoot> & { id: string },
): ApiCommentRoot {
  return {
    ...comment({ id: overrides.id }),
    replies: [],
    replyWindow: null,
    ...overrides,
  }
}

describe('mergeReplies', () => {
  it('dedupes by id and sorts by createdAt', () => {
    const a = comment({ id: 'a', createdAt: '2026-08-01T00:00:02.000Z' })
    const b = comment({ id: 'b', createdAt: '2026-08-01T00:00:01.000Z' })
    const b2 = comment({
      id: 'b',
      createdAt: '2026-08-01T00:00:01.000Z',
      text: 'updated',
    })
    expect(mergeReplies([a, b], [b2]).map((r) => r.id)).toEqual(['b', 'a'])
    expect(mergeReplies([a, b], [b2])[0].text).toBe('updated')
  })
})

describe('buildThread', () => {
  const window = {
    hasHidden: true,
    hiddenCount: 3,
    nextCursor: 'c1',
    returned: 2,
    threshold: 5,
    total: 5,
  }

  it('reports hidden count from the window before expansion', () => {
    const thread = buildThread(
      root({
        id: 'r',
        replies: [comment({ id: 'a' }), comment({ id: 'b' })],
        replyWindow: window,
      }),
      undefined,
    )
    expect(thread.hiddenCount).toBe(3)
    expect(thread.nextCursor).toBe('c1')
  })

  it('shrinks hidden count as expansions merge in', () => {
    const thread = buildThread(
      root({
        id: 'r',
        replies: [comment({ id: 'a' }), comment({ id: 'b' })],
        replyWindow: window,
      }),
      {
        done: false,
        nextCursor: 'c2',
        replies: [comment({ id: 'c' }), comment({ id: 'd' })],
      },
    )
    expect(thread.replies).toHaveLength(4)
    expect(thread.hiddenCount).toBe(1)
    expect(thread.nextCursor).toBe('c2')
  })

  it('clears hidden count once expansion is done', () => {
    const thread = buildThread(
      root({ id: 'r', replies: [comment({ id: 'a' })], replyWindow: window }),
      { done: true, nextCursor: null, replies: [comment({ id: 'c' })] },
    )
    expect(thread.hiddenCount).toBe(0)
  })
})

describe('replyTargetAuthor', () => {
  const r = root({ id: 'r', author: '根作者' })
  const replies = [
    comment({ id: 'a', author: '甲', parentCommentId: 'r' }),
    comment({
      id: 'b',
      author: '乙',
      parentCommentId: 'a',
      reader: { handle: null, id: 'u1', image: null, name: null, role: null },
    }),
    comment({ id: 'c', author: '丙', parentCommentId: 'missing' }),
  ]

  it('returns null for direct replies to the root', () => {
    expect(replyTargetAuthor(replies[0], { root: r, replies })).toBeNull()
  })

  it('resolves the parent author for nested replies', () => {
    expect(replyTargetAuthor(replies[1], { root: r, replies })).toBe('甲')
  })

  it('returns null when the parent is not visible yet', () => {
    expect(replyTargetAuthor(replies[2], { root: r, replies })).toBeNull()
  })
})

describe('display helpers', () => {
  it('prefers reader identity over the raw snapshot', () => {
    const c = comment({
      id: 'x',
      author: 'snapshot',
      avatar: 'https://gravatar/x',
      reader: {
        handle: 'innei',
        id: 'u1',
        image: 'https://img/x',
        name: 'Innei',
        role: 'owner',
      },
    })
    expect(commentDisplayName(c)).toBe('Innei')
    expect(commentAvatar(c)).toBe('https://img/x')
  })
})
