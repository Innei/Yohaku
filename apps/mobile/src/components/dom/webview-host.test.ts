import { assertFetchJSONContract } from '@yohaku/rich-content/host-contract'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MobileCodeBlock } from './code-block'
import { createWebviewHost } from './webview-host'

const deps = {
  apiBase: 'https://mx.example.com/api/v3',
  labels: {
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

  it('supplies only a CodeBlock chrome slot', () => {
    const { slots } = createWebviewHost(deps)
    expect(slots?.CodeBlock).toBe(MobileCodeBlock)
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

  it('fetchJSON satisfies the HostCapabilities.fetchJSON error contract', async () => {
    const host = createWebviewHost(deps)
    await expect(
      assertFetchJSONContract(host.fetchJSON),
    ).resolves.toBeUndefined()
  })
})
