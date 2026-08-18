import { describe, expect, it } from 'vitest'

import type { NoteRow, PostRow, ThinkingRow } from '@/db/schema'

import {
  viewLikedItem,
  viewMyComment,
  viewReadingItem,
} from './activity-entry-model'

const createdAt = new Date('2026-07-01T00:00:00.000Z')
const likedAt = new Date('2026-08-01T00:00:00.000Z')
const openedAt = new Date('2026-08-02T00:00:00.000Z')

const labels = { note: '手记', thinking: '思考' }

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
    excerpt: '搬进新机器的第一周。',
    text: '更长的正文会被忽略。',
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
    excerpt: '窓の外が先に明るくなった。',
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

function thinking(overrides: Partial<ThinkingRow> = {}): ThinkingRow {
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
    ...overrides,
  }
}

describe('viewLikedItem', () => {
  it('uses the post title, excerpt, created time, and category', () => {
    expect(
      viewLikedItem({ kind: 'post', likedAt, post: post() }, labels),
    ).toEqual({
      kind: 'entry',
      title: '关于这台新电脑',
      excerpt: '搬进新机器的第一周。',
      createdAt,
      accent: '日常',
    })
  })

  it('falls back to truncated post text when excerpt is empty', () => {
    const long = '字'.repeat(90)
    const view = viewLikedItem(
      {
        kind: 'post',
        likedAt,
        post: post({ excerpt: null, text: long }),
      },
      labels,
    )
    expect(view).toMatchObject({
      kind: 'entry',
      excerpt: '字'.repeat(80),
    })
  })

  it('marks notes with the note label and keeps created time', () => {
    expect(
      viewLikedItem({ kind: 'note', likedAt, note: note() }, labels),
    ).toEqual({
      kind: 'entry',
      title: '春分前後',
      excerpt: '窓の外が先に明るくなった。',
      createdAt,
      accent: '手记',
    })
  })

  it('uses thinking content as the title with no excerpt', () => {
    expect(
      viewLikedItem({ kind: 'thinking', likedAt, thinking: thinking() }, labels),
    ).toEqual({
      kind: 'entry',
      title: '把桌面再收一收就好了。',
      excerpt: '',
      createdAt,
      accent: '思考',
    })
  })

  it('keeps unavailable rows as unavailable', () => {
    expect(
      viewLikedItem({ kind: 'unavailable', likedAt, refId: 'gone' }, labels),
    ).toEqual({ kind: 'unavailable' })
  })
})

describe('viewReadingItem', () => {
  it('uses the post created time, not the opened time', () => {
    expect(
      viewReadingItem({ kind: 'post', openedAt, post: post() }, labels),
    ).toEqual({
      kind: 'entry',
      title: '关于这台新电脑',
      excerpt: '搬进新机器的第一周。',
      createdAt,
      accent: '日常',
    })
  })

  it('marks notes with the note label', () => {
    const view = viewReadingItem({ kind: 'note', openedAt, note: note() }, labels)
    expect(view).toMatchObject({ kind: 'entry', accent: '手记' })
  })
})

describe('viewMyComment', () => {
  it('uses the comment text as title and the source title as accent', () => {
    expect(
      viewMyComment(
        {
          text: '写得很好。',
          createdAt: '2026-07-03T08:00:00.000Z',
          sourceTitle: '关于这台新电脑',
        },
        '此内容已不可用',
      ),
    ).toEqual({
      title: '写得很好。',
      excerpt: '',
      createdAt: new Date('2026-07-03T08:00:00.000Z'),
      accent: '关于这台新电脑',
    })
  })

  it('falls back to the unavailable label when the source title is missing', () => {
    const view = viewMyComment(
      {
        text: '还在。',
        createdAt: '2026-07-03T08:00:00.000Z',
        sourceTitle: null,
      },
      '此内容已不可用',
    )
    expect(view.accent).toBe('此内容已不可用')
  })
})
