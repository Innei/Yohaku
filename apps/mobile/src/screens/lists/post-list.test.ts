import { describe, expect, it } from 'vitest'

import {
  hasMorePosts,
  nextPostListPage,
  partitionTags,
  pickFeaturedPost,
  postListSummary,
} from './post-list'

function post(id: string, pinAt: Date | null = null) {
  return { id, pinAt }
}

describe('pickFeaturedPost', () => {
  it('returns null featured when nothing is pinned', () => {
    const posts = [post('a'), post('b')]
    expect(pickFeaturedPost(posts)).toEqual({ featured: null, rest: posts })
  })

  it('takes the first pinned post and removes it from rest', () => {
    const a = post('a')
    const b = post('b', new Date('2026-01-01'))
    const c = post('c', new Date('2026-02-01'))
    expect(pickFeaturedPost([b, c, a])).toEqual({
      featured: b,
      rest: [c, a],
    })
  })

  it('returns empty rest when the only post is pinned', () => {
    const a = post('a', new Date('2026-01-01'))
    expect(pickFeaturedPost([a])).toEqual({ featured: a, rest: [] })
  })
})

describe('postListSummary', () => {
  it('prefers a trimmed excerpt', () => {
    expect(
      postListSummary({ excerpt: '  hello  ', text: 'longer body' }, 4),
    ).toBe('hello')
  })

  it('falls back to truncated text', () => {
    expect(postListSummary({ excerpt: null, text: 'abcdefghij' }, 4)).toBe(
      'abcd',
    )
  })

  it('returns empty when neither excerpt nor text is usable', () => {
    expect(postListSummary({ excerpt: '   ', text: null }, 10)).toBe('')
  })
})

describe('partitionTags', () => {
  it('keeps short tags', () => {
    expect(partitionTags(['rust', 'ts'])).toEqual({
      hiddenCount: 0,
      visible: ['rust', 'ts'],
    })
  })

  it('cuts when the visible budget is exceeded', () => {
    expect(
      partitionTags(['很长的中文标签一', '很长的中文标签二', '第三']),
    ).toEqual({
      hiddenCount: 2,
      visible: ['很长的中文标签一'],
    })
  })
})

describe('nextPostListPage', () => {
  it('asks for page 2 after a full first page', () => {
    expect(nextPostListPage(20, 0)).toBe(2)
  })

  it('skips pages already sitting in the local cache', () => {
    expect(nextPostListPage(40, 1)).toBe(3)
  })

  it('does not go backwards when fetched page is ahead of the cache', () => {
    expect(nextPostListPage(20, 3)).toBe(4)
  })
})

describe('hasMorePosts', () => {
  it('stops when the loaded count reaches the known total', () => {
    expect(hasMorePosts(20, 20)).toBe(false)
    expect(hasMorePosts(20, 45)).toBe(true)
  })

  it('assumes more pages only when a full page is already loaded', () => {
    expect(hasMorePosts(20, null)).toBe(true)
    expect(hasMorePosts(15, null)).toBe(false)
    expect(hasMorePosts(0, null)).toBe(false)
  })
})
