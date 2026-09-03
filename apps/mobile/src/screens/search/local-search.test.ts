import { describe, expect, it } from 'vitest'

import type { NoteRow, PostRow, ThinkingRow } from '@/db/schema'

import {
  highlightSegments,
  parseSearchScope,
  searchNotes,
  searchPosts,
  searchThinkings,
} from './local-search'

function post(
  overrides: Partial<PostRow> & Pick<PostRow, 'id' | 'title'>,
): PostRow {
  return {
    lang: 'zh',
    slug: 'slug',
    categoryId: null,
    categorySlug: 'coding',
    categoryName: '编程',
    tags: [],
    excerpt: null,
    text: null,
    content: null,
    contentFormat: 'lexical',
    readCount: 0,
    likeCount: 0,
    createdAt: new Date('2026-01-02T00:00:00Z'),
    modifiedAt: null,
    pinAt: null,
    bodyVersion: null,
    enrichments: null,
    articleMeta: null,
    ...overrides,
  }
}

function note(
  overrides: Partial<NoteRow> & Pick<NoteRow, 'id' | 'title' | 'nid'>,
): NoteRow {
  return {
    lang: 'zh',
    mood: null,
    weather: null,
    excerpt: null,
    text: null,
    content: null,
    contentFormat: 'lexical',
    hasPassword: false,
    topicId: null,
    readCount: 0,
    likeCount: 0,
    createdAt: new Date('2026-01-02T00:00:00Z'),
    modifiedAt: null,
    bodyVersion: null,
    enrichments: null,
    articleMeta: null,
    coverUrl: null,
    coverThumbhash: null,
    ...overrides,
  }
}

function thinking(
  overrides: Partial<ThinkingRow> & Pick<ThinkingRow, 'id' | 'content'>,
): ThinkingRow {
  return {
    up: 0,
    down: 0,
    commentsIndex: 0,
    allowComment: true,
    createdAt: new Date('2026-01-02T00:00:00Z'),
    modifiedAt: null,
    enrichments: null,
    ...overrides,
  }
}

describe('parseSearchScope', () => {
  it('keeps known scopes and defaults the rest to posts', () => {
    expect(parseSearchScope('notes')).toBe('notes')
    expect(parseSearchScope('thinking')).toBe('thinking')
    expect(parseSearchScope('posts')).toBe('posts')
    expect(parseSearchScope('nope')).toBe('posts')
    expect(parseSearchScope(['notes', 'posts'])).toBe('notes')
    expect(parseSearchScope(undefined)).toBe('posts')
  })
})

describe('searchPosts', () => {
  const rows = [
    post({
      id: 'title-hit',
      title: 'React 实践',
      excerpt: '无关摘要',
      createdAt: new Date('2026-02-01T00:00:00Z'),
    }),
    post({
      id: 'excerpt-hit',
      title: '别的标题',
      excerpt: '讲讲 React 的用法',
      createdAt: new Date('2026-03-01T00:00:00Z'),
    }),
    post({
      id: 'body-hit',
      title: '正文才有',
      excerpt: '摘要没有',
      text: '这里提到了 React 内部',
      createdAt: new Date('2026-04-01T00:00:00Z'),
    }),
    post({
      id: 'tag-hit',
      title: '标签文章',
      tags: ['React'],
      createdAt: new Date('2026-01-01T00:00:00Z'),
    }),
    post({
      id: 'cat-hit',
      title: '分类文章',
      categoryName: 'React 专栏',
      createdAt: new Date('2026-01-15T00:00:00Z'),
    }),
    post({
      id: 'en-case',
      title: 'REACT Native',
      lang: 'en',
      createdAt: new Date('2026-05-01T00:00:00Z'),
    }),
  ]

  it('returns nothing for a blank query', () => {
    expect(searchPosts(rows, '   ')).toEqual([])
  })

  it('ranks title above excerpt/tags/category above body, newest within a band', () => {
    const ids = searchPosts(rows, 'react').map((hit) => hit.id)
    expect(ids).toEqual([
      'en-case',
      'title-hit',
      'excerpt-hit',
      'cat-hit',
      'tag-hit',
      'body-hit',
    ])
  })

  it('does not search lexical content json', () => {
    const hidden = post({
      id: 'json',
      title: '看不见',
      content: '{"root":{"text":"React hidden"}}',
    })
    expect(searchPosts([hidden], 'React')).toEqual([])
  })

  it('omits snippet when only the title matches', () => {
    const [hit] = searchPosts(
      [post({ id: 't', title: 'React', excerpt: '无关键词' })],
      'React',
    )
    expect(hit.snippet).toBeNull()
    expect(hit.title).toBe('React')
  })

  it('clips snippet around the first excerpt or body hit', () => {
    const long = '前'.repeat(40) + 'React 出现在中间' + '后'.repeat(40)
    const [hit] = searchPosts(
      [post({ id: 's', title: '无', excerpt: long })],
      'React',
    )
    expect(hit.snippet).toContain('React')
    expect(hit.snippet!.length).toBeLessThan(long.length)
  })
})

describe('searchNotes', () => {
  it('matches mood and weather in the meta band', () => {
    const rows = [
      note({ id: 'm', nid: 1, title: '无', mood: '开心' }),
      note({ id: 'w', nid: 2, title: '无', weather: '晴' }),
    ]
    expect(searchNotes(rows, '开心').map((hit) => hit.id)).toEqual(['m'])
    expect(searchNotes(rows, '晴').map((hit) => hit.id)).toEqual(['w'])
  })

  it('does not search password note bodies', () => {
    const locked = note({
      id: 'lock',
      nid: 3,
      title: '密',
      hasPassword: true,
      excerpt: 'React 摘要',
      text: 'React 正文',
      mood: 'React',
    })
    expect(searchNotes([locked], 'React')).toEqual([])
    const titleOnly = note({
      id: 'lock-title',
      nid: 4,
      title: 'React 手记',
      hasPassword: true,
      text: '不该出现的正文 React',
    })
    const [hit] = searchNotes([titleOnly], 'React')
    expect(hit.id).toBe('lock-title')
    expect(hit.snippet).toBeNull()
    expect(hit.hasPassword).toBe(true)
  })
})

describe('searchThinkings', () => {
  it('uses content as the primary line and has no title', () => {
    const [hit] = searchThinkings(
      [thinking({ id: 't1', content: '今天写了 React' })],
      'React',
    )
    expect(hit.title).toBeNull()
    expect(hit.snippet).toContain('React')
    expect(hit.id).toBe('t1')
  })
})

describe('highlightSegments', () => {
  it('marks the keyword and leaves the rest plain', () => {
    expect(highlightSegments('hello React world', ['React'])).toEqual([
      { highlighted: false, key: '0-hello ', text: 'hello ' },
      { highlighted: true, key: '6-React', text: 'React' },
      { highlighted: false, key: '11- world', text: ' world' },
    ])
  })

  it('returns a single plain segment when nothing matches', () => {
    expect(highlightSegments('plain', ['React'])).toEqual([
      { highlighted: false, key: '0-plain', text: 'plain' },
    ])
  })
})
