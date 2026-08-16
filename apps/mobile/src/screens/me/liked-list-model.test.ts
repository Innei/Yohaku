import { describe, expect, it } from 'vitest'

import type { LikedRefRow, NoteRow, PostRow, ThinkingRow } from '@/db/schema'

import { resolveLikedItems } from './liked-list-model'

const likedAt = new Date('2026-08-01T00:00:00.000Z')

function post(id: string): PostRow {
  return {
    id,
    lang: 'zh',
    slug: id,
    title: `Post ${id}`,
    categoryId: 'c',
    categorySlug: 'blog',
    categoryName: 'Blog',
    tags: [],
    excerpt: null,
    text: null,
    content: null,
    contentFormat: 'lexical',
    readCount: 0,
    likeCount: 1,
    createdAt: likedAt,
    modifiedAt: null,
    pinAt: null,
    bodyVersion: null,
    enrichments: null,
    articleMeta: null,
  }
}

function note(id: string): NoteRow {
  return {
    id,
    lang: 'zh',
    nid: 1,
    title: `Note ${id}`,
    mood: null,
    weather: null,
    excerpt: null,
    text: null,
    content: null,
    contentFormat: 'lexical',
    hasPassword: false,
    readCount: 0,
    likeCount: 1,
    createdAt: likedAt,
    modifiedAt: null,
    bodyVersion: null,
    enrichments: null,
    articleMeta: null,
  }
}

function thinking(id: string): ThinkingRow {
  return {
    id,
    content: 'hello',
    up: 1,
    down: 0,
    commentsIndex: 0,
    allowComment: true,
    createdAt: likedAt,
    modifiedAt: null,
    enrichments: null,
  }
}

function ref(refId: string, kind: LikedRefRow['kind']): LikedRefRow {
  return { refId, kind, likedAt }
}

describe('resolveLikedItems', () => {
  it('joins live rows and drops downvotes', () => {
    const items = resolveLikedItems(
      [
        ref('p1', 'post'),
        ref('n1', 'note'),
        ref('t1', 'recently-up'),
        ref('t2', 'recently-down'),
        ref('gone', 'post'),
      ],
      [post('p1')],
      [note('n1')],
      [thinking('t1')],
    )
    expect(items.map((item) => item.kind)).toEqual([
      'post',
      'note',
      'thinking',
      'unavailable',
    ])
  })
})
