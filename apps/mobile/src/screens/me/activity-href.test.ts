import { describe, expect, it } from 'vitest'

import type { NoteRow, PostRow, ThinkingRow } from '@/db/schema'

import { commentHref, likedHref, readingHref } from './activity-href'

const createdAt = new Date('2026-07-01T00:00:00.000Z')

function post(overrides: Partial<PostRow> = {}): PostRow {
  return {
    id: 'p1',
    lang: 'zh',
    slug: 'new-machine',
    title: '关于这台新电脑',
    categoryId: 'c',
    categorySlug: 'blog',
    categoryName: '日常',
    tags: [],
    excerpt: null,
    text: null,
    content: null,
    contentFormat: 'lexical',
    readCount: 0,
    likeCount: 1,
    createdAt,
    modifiedAt: null,
    pinAt: null,
    bodyVersion: null,
    enrichments: null,
    articleMeta: null,
    ...overrides,
  }
}

function note(overrides: Partial<NoteRow> = {}): NoteRow {
  return {
    id: 'n1',
    lang: 'zh',
    nid: 12,
    title: '春分前後',
    mood: null,
    weather: null,
    excerpt: null,
    text: null,
    content: null,
    contentFormat: 'lexical',
    hasPassword: false,
    topicId: null,
    readCount: 0,
    likeCount: 1,
    createdAt,
    modifiedAt: null,
    bodyVersion: null,
    enrichments: null,
    articleMeta: null,
    ...overrides,
  }
}

function thinking(): ThinkingRow {
  return {
    id: 't1',
    content: '把桌面再收一收就好了。',
    up: 1,
    down: 0,
    commentsIndex: 0,
    allowComment: true,
    createdAt,
    modifiedAt: null,
    enrichments: null,
  }
}

describe('likedHref', () => {
  it('points a post at the native detail route and the public url', () => {
    expect(likedHref({ kind: 'post', likedAt: createdAt, post: post() })).toEqual(
      {
        browser: false,
        href: {
          pathname: '/posts/[category]/[slug]',
          params: {
            category: 'blog',
            postId: 'p1',
            slug: 'new-machine',
          },
        },
        title: '关于这台新电脑',
        webUrl: expect.stringMatching(/\/posts\/blog\/new-machine$/),
      },
    )
  })

  it('opens markdown posts in the browser', () => {
    expect(
      likedHref({
        kind: 'post',
        likedAt: createdAt,
        post: post({ contentFormat: 'markdown' }),
      })?.browser,
    ).toBe(true)
  })

  it('returns null when a post has no category', () => {
    expect(
      likedHref({
        kind: 'post',
        likedAt: createdAt,
        post: post({ categorySlug: null }),
      }),
    ).toBeNull()
  })

  it('points a note at /notes/[nid]', () => {
    expect(likedHref({ kind: 'note', likedAt: createdAt, note: note() })).toEqual(
      {
        browser: false,
        href: { pathname: '/notes/[nid]', params: { nid: '12' } },
        title: '春分前後',
        webUrl: expect.stringMatching(/\/notes\/12$/),
      },
    )
  })

  it('opens password notes in the browser', () => {
    expect(
      likedHref({
        kind: 'note',
        likedAt: createdAt,
        note: note({ hasPassword: true }),
      })?.browser,
    ).toBe(true)
  })

  it('points thinking at the comments sheet', () => {
    expect(
      likedHref({ kind: 'thinking', likedAt: createdAt, thinking: thinking() }),
    ).toEqual({
      browser: false,
      href: { pathname: '/comments/[id]', params: { id: 't1' } },
      title: '把桌面再收一收就好了。',
      webUrl: null,
    })
  })

  it('returns null for unavailable rows', () => {
    expect(
      likedHref({ kind: 'unavailable', likedAt: createdAt, refId: 'gone' }),
    ).toBeNull()
  })
})

describe('readingHref', () => {
  it('reuses the post href', () => {
    expect(
      readingHref({ kind: 'post', openedAt: createdAt, post: post() })?.href,
    ).toEqual(likedHref({ kind: 'post', likedAt: createdAt, post: post() })?.href)
  })
})

describe('commentHref', () => {
  it('keeps commentId on the post href', () => {
    expect(
      commentHref(
        {
          kind: 'post',
          category: 'blog',
          commentId: 'c1',
          postId: 'p1',
          slug: 'new-machine',
        },
        '写得很好。',
      ),
    ).toEqual({
      browser: false,
      href: {
        pathname: '/posts/[category]/[slug]',
        params: {
          category: 'blog',
          commentId: 'c1',
          postId: 'p1',
          slug: 'new-machine',
        },
      },
      title: '写得很好。',
      webUrl: expect.stringMatching(/\/posts\/blog\/new-machine$/),
    })
  })

  it('returns null when the destination is gone', () => {
    expect(commentHref({ kind: 'unavailable' }, 'x')).toBeNull()
  })
})
