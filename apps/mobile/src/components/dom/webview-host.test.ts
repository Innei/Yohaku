import { assertFetchJSONContract } from '@yohaku/rich-content/host-contract'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MobileCodeBlock } from './code-block'
import { MobileFileCard } from './file-card'
import { createWebviewHost, postNativeFilePreview } from './webview-host'

const deps = {
  apiBase: 'https://mx.example.com/api/v3',
  labels: {
    codeCopied: '已复制',
    codeCopy: '复制',
    codeExpand: '展开 · {count} 行',
    nestedDocCollapse: '收起',
    nestedDocExpand: '展开',
    nestedDocLabel: '嵌套文档',
  },
  onImagePress: vi.fn(
    async (_payload: { images: string[]; index: number; src: string }) => {},
  ),
  onLinkPress: vi.fn(async () => {}),
  onScrollToAnchor: vi.fn(async () => {}),
  theme: 'light' as const,
  webOrigin: 'https://example.com',
}

describe('createWebviewHost', () => {
  beforeEach(() => {
    deps.onImagePress.mockClear()
  })

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window')
  })

  it('declares inline nested-doc presentation', () => {
    expect(createWebviewHost(deps).nestedDocPresentation).toBe('inline')
  })

  it('omits CodeBlock unless the caller passes one', () => {
    expect(createWebviewHost(deps).slots?.CodeBlock).toBeUndefined()
  })

  it('omits FileCard unless the caller passes one', () => {
    const { slots } = createWebviewHost({ ...deps, codeBlock: MobileCodeBlock })
    expect(slots?.FileCard).toBeUndefined()
  })

  it('supplies only the chrome slots it was given', () => {
    const { slots } = createWebviewHost({
      ...deps,
      codeBlock: MobileCodeBlock,
      fileCard: MobileFileCard,
    })
    expect(slots?.CodeBlock).toBe(MobileCodeBlock)
    expect(slots?.FileCard).toBe(MobileFileCard)
    expect(slots?.BlockLinkCard).toBeUndefined()
    expect(slots?.InlineLink).toBeUndefined()
    expect(slots?.MapBlock).toBeUndefined()
    expect(slots?.StockKLine).toBeUndefined()
  })

  it('forwards only serializable payloads across the bridge', async () => {
    const host = createWebviewHost(deps)
    await host.openImage({ images: ['a', 'b'], index: 1, src: 'b' })
    const [payload] = deps.onImagePress.mock.calls[0]
    expect(() => JSON.stringify(payload)).not.toThrow()
    expect(JSON.parse(JSON.stringify(payload))).toEqual({
      images: ['a', 'b'],
      index: 1,
      src: 'b',
    })
  })

  it('routes positioned images directly to the native preview handler', async () => {
    const postMessage = vi.fn()
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { ReactNativeWebView: { postMessage } },
    })
    const host = createWebviewHost(deps)
    await host.openImage({
      images: ['a', 'b'],
      index: 1,
      source: {
        borderRadius: 12,
        currentSrc: 'yohaku-asset://image?u=b',
        objectFit: 'cover',
        objectPosition: '50% 50%',
        rect: { height: 180, width: 240, x: 16, y: 32 },
      },
      src: 'b',
    })

    expect(deps.onImagePress).not.toHaveBeenCalled()
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      images: ['a', 'b'],
      index: 1,
      siteReferer: 'https://example.com',
      source: {
        borderRadius: 12,
        currentSrc: 'yohaku-asset://image?u=b',
        objectFit: 'cover',
        objectPosition: '50% 50%',
        rect: { height: 180, width: 240, x: 16, y: 32 },
      },
      src: 'b',
      type: 'yohaku:image-preview',
    })
  })

  it('posts a file preview message the native Quick Look handler can decode', () => {
    const postMessage = vi.fn()
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { ReactNativeWebView: { postMessage } },
    })
    expect(
      postNativeFilePreview({
        mimeType: 'application/pdf',
        name: '季度报告.pdf',
        siteReferer: 'https://example.com',
        url: 'https://cdn.example/file/report.pdf',
      }),
    ).toBe(true)
    expect(JSON.parse(postMessage.mock.calls[0][0])).toEqual({
      mimeType: 'application/pdf',
      name: '季度报告.pdf',
      siteReferer: 'https://example.com',
      type: 'yohaku:file-preview',
      url: 'https://cdn.example/file/report.pdf',
    })
  })

  it('fetchJSON satisfies the HostCapabilities.fetchJSON error contract', async () => {
    const host = createWebviewHost(deps)
    await expect(
      assertFetchJSONContract(host.fetchJSON),
    ).resolves.toBeUndefined()
  })
})
