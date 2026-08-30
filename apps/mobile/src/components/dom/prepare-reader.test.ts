import { beforeEach, describe, expect, it, vi } from 'vitest'

const { setReaderContent } = vi.hoisted(() => ({
  setReaderContent: vi.fn(),
}))

vi.mock('expo-modules-core', () => ({
  requireNativeModule: () => ({ setReaderContent }),
}))

import { isPreparedReader, prepareArticleBody } from './prepare-reader'

const payload = {
  content: '{"root":{}}',
  id: 'post-1',
  variant: 'article' as const,
  webUrl: 'https://example.com/posts/a/b',
}

describe('prepareArticleBody', () => {
  beforeEach(() => {
    setReaderContent.mockReset()
  })

  it('records the id only when native says the reader painted', async () => {
    setReaderContent.mockResolvedValueOnce(true)
    await expect(prepareArticleBody(payload)).resolves.toBe(true)
    expect(isPreparedReader('post-1')).toBe(true)
    expect(isPreparedReader('post-2')).toBe(false)
  })

  it('clears a previous id when the wait times out', async () => {
    setReaderContent.mockResolvedValueOnce(true)
    await prepareArticleBody(payload)
    setReaderContent.mockResolvedValueOnce(false)
    await expect(
      prepareArticleBody({ ...payload, id: 'post-2' }),
    ).resolves.toBe(false)
    expect(isPreparedReader('post-1')).toBe(false)
    expect(isPreparedReader('post-2')).toBe(false)
  })
})
