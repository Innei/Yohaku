import { describe, expect, it, vi } from 'vitest'

import type { NoteRow } from '@/db/schema'

import { openNote } from './open-article'

const { prepareArticleBody, primeDatabaseSnapshot } = vi.hoisted(() => ({
  prepareArticleBody: vi.fn(),
  primeDatabaseSnapshot: vi.fn(),
}))

vi.mock('expo-web-browser', () => ({ openBrowserAsync: vi.fn() }))
vi.mock('@/components/dom/prepare-reader', () => ({ prepareArticleBody }))
vi.mock('@/db/use-database-snapshot', () => ({ primeDatabaseSnapshot }))
vi.mock('@/lib/site-url', () => ({
  siteHref: (path: string) => `https://example.com${path}`,
}))

describe('openNote', () => {
  it('preloads a primed detail route before pushing the prepared reader', async () => {
    let finishPreparation!: (ready: boolean) => void
    const events: string[] = []
    prepareArticleBody.mockImplementationOnce(
      () =>
        new Promise<boolean>((resolve) => {
          events.push('prepare')
          finishPreparation = resolve
        }),
    )
    primeDatabaseSnapshot.mockImplementationOnce(() => events.push('prime'))
    const router = {
      prefetch: vi.fn(() => events.push('prefetch')),
      push: vi.fn(() => events.push('push')),
    }
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
    } satisfies NoteRow

    openNote(router, note)

    expect(events).toEqual(['prime', 'prefetch', 'prepare'])
    expect(primeDatabaseSnapshot).toHaveBeenCalledWith('note:zh-CN:1', {
      note,
      topic: null,
    })
    expect(router.push).not.toHaveBeenCalled()

    finishPreparation(true)
    await vi.waitFor(() => expect(router.push).toHaveBeenCalledOnce())
    expect(events).toEqual(['prime', 'prefetch', 'prepare', 'push'])
  })
})
