import { describe, expect, it } from 'vitest'

import type { NoteRow, PostRow, ReadingHistoryRow } from '@/db/schema'

import { resolveReadingItems } from './reading-list-model'

const openedAt = new Date('2026-08-02T00:00:00.000Z')

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
    likeCount: 0,
    createdAt: openedAt,
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
    nid: 8,
    title: `Note ${id}`,
    mood: null,
    weather: null,
    excerpt: null,
    text: null,
    content: null,
    contentFormat: 'lexical',
    hasPassword: false,
    readCount: 0,
    likeCount: 0,
    createdAt: openedAt,
    modifiedAt: null,
    bodyVersion: null,
    enrichments: null,
    articleMeta: null,
  }
}

function row(
  refId: string,
  kind: ReadingHistoryRow['kind'],
): ReadingHistoryRow {
  return { refId, kind, openedAt }
}

describe('resolveReadingItems', () => {
  it('joins live posts and notes and marks missing rows', () => {
    const items = resolveReadingItems(
      [row('p1', 'post'), row('n1', 'note'), row('gone', 'post')],
      [post('p1')],
      [note('n1')],
    )
    expect(items.map((item) => item.kind)).toEqual([
      'post',
      'note',
      'unavailable',
    ])
  })
})
