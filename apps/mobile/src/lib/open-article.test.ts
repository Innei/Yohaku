import { afterEach, describe, expect, it, vi } from 'vitest'

import type { NoteRow, PostRow } from '@/db/schema'
import { openExternalUrl } from '@/lib/open-external'

import { openNote, openPost } from './open-article'

const { primeDatabaseSnapshot, storedPosts } = vi.hoisted(() => ({
  primeDatabaseSnapshot: vi.fn(),
  storedPosts: [] as unknown[],
}))

const native = vi.hoisted(
  (): { parseMarkdown?: () => string } => ({}),
)

vi.mock('@modules/yohaku', () => ({ YohakuNative: native }))
vi.mock('@/lib/open-external', () => ({ openExternalUrl: vi.fn() }))
vi.mock('@/db/use-database-snapshot', () => ({ primeDatabaseSnapshot }))
vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: () => Promise.resolve(storedPosts) }),
      }),
    }),
  },
}))
vi.mock('@/i18n/locale-store', () => ({ getLocale: () => 'en' }))
vi.mock('@/lib/site-url', () => ({
  siteHref: (path: string) => `https://example.com${path}`,
}))

afterEach(() => {
  storedPosts.length = 0
  delete native.parseMarkdown
  vi.mocked(openExternalUrl).mockClear()
})

describe('openNote', () => {
  it('sends markdown notes to the web only when the binary cannot parse them', () => {
    const note = {
      content: null,
      contentFormat: 'markdown',
      hasPassword: false,
      nid: 3,
    } as NoteRow

    const fallback = { push: vi.fn() }
    openNote(fallback, note)
    expect(openExternalUrl).toHaveBeenCalledWith('https://example.com/notes/3')
    expect(fallback.push).not.toHaveBeenCalled()

    native.parseMarkdown = () => '{}'
    const router = { push: vi.fn() }
    openNote(router, note)
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/notes/[nid]',
      params: { nid: '3' },
    })
  })

  it('primes the detail snapshot for a markdown note the binary can render', () => {
    native.parseMarkdown = () => '{}'
    primeDatabaseSnapshot.mockClear()
    const note = {
      content: null,
      contentFormat: 'markdown',
      hasPassword: false,
      lang: 'zh-CN',
      nid: 4,
      text: '# body',
    } as NoteRow

    openNote({ push: vi.fn() }, note)

    expect(primeDatabaseSnapshot).toHaveBeenCalledWith('note:zh-CN:4', {
      note,
      topic: null,
    })
  })

  it('primes the detail snapshot before pushing the shared hero route', () => {
    const events: string[] = []
    primeDatabaseSnapshot.mockImplementationOnce(() => events.push('prime'))
    const router = { push: vi.fn(() => events.push('push')) }
    const note = {
      articleMeta: null,
      bodyVersion: 1,
      content: '{"root":{}}',
      contentFormat: 'lexical',
      createdAt: new Date('2026-08-31T00:00:00Z'),
      enrichments: null,
      excerpt: null,
      hasPassword: false,
      id: 'note-1',
      lang: 'zh-CN',
      likeCount: 0,
      modifiedAt: null,
      mood: null,
      nid: 1,
      readCount: 0,
      text: null,
      title: '首帧',
      topicId: null,
      weather: null,
      coverUrl: null,
      coverThumbhash: null,
    } satisfies NoteRow

    openNote(router, note, () => events.push('beforePush'))

    expect(primeDatabaseSnapshot).toHaveBeenCalledWith('note:zh-CN:1', {
      note,
      topic: null,
    })
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/notes/[nid]',
      params: { hero: 'shared', nid: '1' },
    })
    expect(events).toEqual(['prime', 'beforePush', 'push'])
  })

  it('does not opt ordinary note links into the shared hero', () => {
    const router = { push: vi.fn() }
    const note = {
      content: null,
      contentFormat: 'html',
      hasPassword: false,
      nid: 2,
    } as NoteRow

    openNote(router, note)

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/notes/[nid]',
      params: { nid: '2' },
    })
  })
})

describe('openPost', () => {
  it('reads the stored row for a list row and primes it before pushing', async () => {
    const stored = {
      categorySlug: 'tech',
      content: '{"root":{}}',
      contentFormat: 'lexical',
      id: 'p1',
      lang: 'en',
      slug: 'hello',
    } as PostRow
    storedPosts.push(stored)
    primeDatabaseSnapshot.mockClear()
    const events: string[] = []
    primeDatabaseSnapshot.mockImplementationOnce(() => events.push('prime'))
    const router = { push: vi.fn(() => events.push('push')) }

    openPost(router, {
      categorySlug: 'tech',
      contentFormat: 'lexical',
      id: 'p1',
      slug: 'hello',
    })
    await vi.waitFor(() => expect(router.push).toHaveBeenCalled())

    expect(primeDatabaseSnapshot).toHaveBeenCalledWith(
      'post:en:p1:tech:hello',
      stored,
    )
    expect(events).toEqual(['prime', 'push'])
  })

  it('still pushes when the row is not stored yet', async () => {
    primeDatabaseSnapshot.mockClear()
    const router = { push: vi.fn() }

    openPost(router, {
      categorySlug: 'tech',
      contentFormat: 'lexical',
      id: 'p2',
      slug: 'fresh',
    })
    await vi.waitFor(() => expect(router.push).toHaveBeenCalled())

    expect(primeDatabaseSnapshot).not.toHaveBeenCalled()
  })
})
