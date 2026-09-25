import { describe, expect, it, vi } from 'vitest'

import type { NoteRow } from '@/db/schema'

import { openNote } from './open-article'

const { primeDatabaseSnapshot } = vi.hoisted(() => ({
  primeDatabaseSnapshot: vi.fn(),
}))

vi.mock('@/lib/open-external', () => ({ openExternalUrl: vi.fn() }))
vi.mock('@/db/use-database-snapshot', () => ({ primeDatabaseSnapshot }))
vi.mock('@/lib/site-url', () => ({
  siteHref: (path: string) => `https://example.com${path}`,
}))

describe('openNote', () => {
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
