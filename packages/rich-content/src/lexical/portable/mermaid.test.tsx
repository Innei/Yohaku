import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type HostCapabilities, HostProvider } from '../../host'
import { PREVIEW_MAX_PIXEL } from '../../lib/rasterize-to-png'
import { Mermaid } from './mermaid'

const mermaidSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 400" width="100%" height="100%"></svg>'

vi.mock('@haklex/rich-compose/modules/mermaid', () => ({
  MermaidRenderer: () => (
    <img
      alt="Mermaid diagram"
      src={`data:image/svg+xml,${encodeURIComponent(mermaidSvg)}`}
    />
  ),
}))

vi.mock('@haklex/rich-editor', () => ({
  ColorSchemeProvider: ({ children }: { children: ReactNode }) => children,
}))

const PNG = 'data:image/png;base64,QQ=='

const host: HostCapabilities = {
  apiBase: 'https://example.com/api',
  diagramPreview: 'openImage',
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

describe('Mermaid diagramPreview', () => {
  let mountEl: HTMLDivElement
  let root: Root

  const canvases: Array<{ width: number; height: number }> = []

  beforeEach(() => {
    mountEl = document.createElement('div')
    document.body.append(mountEl)
    root = createRoot(mountEl)
    canvases.length = 0
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    })) as never
    HTMLCanvasElement.prototype.toDataURL = vi.fn(function toDataURL(
      this: HTMLCanvasElement,
    ) {
      canvases.push({ width: this.width, height: this.height })
      return PNG
    })
    class FakeImage {
      height = 0
      naturalHeight = 80
      naturalWidth = 80
      onerror: (() => void) | null = null
      onload: (() => void) | null = null
      width = 0
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', FakeImage)
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 3,
    })
  })

  afterEach(() => {
    act(() => root.unmount())
    mountEl.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  async function renderMermaid(
    openImage: HostCapabilities['openImage'] = vi.fn(),
  ) {
    await act(async () => {
      root.render(
        <HostProvider host={{ ...host, openImage }}>
          <Mermaid content="graph TD; A-->B;" />
        </HostProvider>,
      )
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    return mountEl.querySelector(
      'img[alt="Mermaid diagram"]',
    ) as HTMLImageElement
  }

  it('paints a high-res png into the img for openImage hosts', async () => {
    const img = await renderMermaid()

    expect(img.src).toBe(PNG)
    expect(canvases).toEqual([
      {
        width: PREVIEW_MAX_PIXEL,
        height: Math.round(PREVIEW_MAX_PIXEL / 5),
      },
    ])
  })

  it('opens the painted png without rasterizing again', async () => {
    const openImage = vi.fn()
    const img = await renderMermaid(openImage)
    const rasterizeCount = canvases.length

    await act(async () => {
      img.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(openImage).toHaveBeenCalledTimes(1)
    const payload = openImage.mock.calls[0]?.[0] as {
      images: string[]
      source?: { currentSrc: string }
      src: string
    }
    expect(payload.src).toBe(PNG)
    expect(payload.images).toEqual([PNG])
    expect(payload.source?.currentSrc).toBe(PNG)
    expect(canvases).toHaveLength(rasterizeCount)
  })
})
