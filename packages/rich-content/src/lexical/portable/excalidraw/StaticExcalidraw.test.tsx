import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type HostCapabilities, HostProvider } from '../../../host'
import { StaticExcalidraw } from './StaticExcalidraw'

const PNG = 'data:image/png;base64,QQ=='

function installRasterizeMocks() {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  })) as never
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => PNG)
  class FakeImage {
    height = 0
    naturalHeight = 100
    naturalWidth = 200
    onerror: (() => void) | null = null
    onload: (() => void) | null = null
    width = 0
    set src(_value: string) {
      queueMicrotask(() => this.onload?.())
    }
  }
  vi.stubGlobal('Image', FakeImage)
}

const host: HostCapabilities = {
  apiBase: 'https://example.com/api',
  fetchJSON: async () => ({}) as never,
  labels: {
    nestedDocCollapse: '收起',
    nestedDocExpand: '展开',
    nestedDocLabel: '嵌套文档',
  },
  nestedDocPresentation: 'inline',
  openImage: () => {},
  openLink: () => {},
  scrollToAnchor: () => {},
  theme: 'light',
  webOrigin: 'https://example.com',
}

const inline = JSON.stringify({
  appState: {},
  elements: [
    {
      backgroundColor: '#fff',
      fillStyle: 'solid',
      height: 20,
      id: 'r',
      opacity: 100,
      roughness: 1,
      seed: 1,
      strokeColor: '#000',
      strokeStyle: 'solid',
      strokeWidth: 1,
      type: 'rectangle',
      width: 20,
      x: 0,
      y: 0,
    },
  ],
  files: {},
})

describe('StaticExcalidraw', () => {
  let mountEl: HTMLDivElement
  let root: Root

  beforeEach(() => {
    mountEl = document.createElement('div')
    document.body.append(mountEl)
    root = createRoot(mountEl)
    Reflect.deleteProperty(
      window as unknown as { ReactNativeWebView?: unknown },
      'ReactNativeWebView',
    )
  })

  afterEach(() => {
    act(() => root.unmount())
    mountEl.remove()
    Reflect.deleteProperty(
      window as unknown as { ReactNativeWebView?: unknown },
      'ReactNativeWebView',
    )
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does not wait for IntersectionObserver inside a React Native WebView', async () => {
    Object.defineProperty(window, 'ReactNativeWebView', {
      configurable: true,
      value: { postMessage: () => {} },
    })

    await act(async () => {
      root.render(
        <HostProvider host={host}>
          <div style={{ width: 320, height: 180 }}>
            <StaticExcalidraw data={inline} />
          </div>
        </HostProvider>,
      )
    })

    expect(mountEl.textContent).not.toContain('Whiteboard')
    expect(mountEl.querySelector('.group\\/excalidraw')).not.toBeNull()
  })

  it('opens a rasterized png preview when the host uses openImage', async () => {
    installRasterizeMocks()
    const openImage = vi.fn()
    const open = vi.fn(() => ({}) as Window)
    vi.stubGlobal('open', open)
    Object.defineProperty(window, 'ReactNativeWebView', {
      configurable: true,
      value: { postMessage: () => {} },
    })

    await act(async () => {
      root.render(
        <HostProvider
          host={{
            ...host,
            diagramPreview: 'openImage',
            openImage,
          }}
        >
          <div style={{ width: 320, height: 180 }}>
            <StaticExcalidraw data={inline} />
          </div>
        </HostProvider>,
      )
    })

    const expand = mountEl.querySelector(
      'button[title="Open SVG in new tab"]',
    ) as HTMLButtonElement
    expect(expand).not.toBeNull()

    await act(async () => {
      expand.click()
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(open).not.toHaveBeenCalled()
    expect(openImage).toHaveBeenCalledTimes(1)
    const payload = openImage.mock.calls[0]?.[0] as {
      images: string[]
      source?: { currentSrc: string; objectFit: string }
      src: string
    }
    expect(payload.src).toBe(PNG)
    expect(payload.images).toEqual([PNG])
    expect(payload.source?.currentSrc).toBe(PNG)
    expect(payload.source?.objectFit).toBe('contain')
  })
})
