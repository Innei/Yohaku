import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type HostCapabilities, HostProvider } from '../../host'
import { Mermaid } from './mermaid'

vi.mock('@haklex/rich-compose/modules/mermaid', () => ({
  MermaidRenderer: () => (
    <img alt="Mermaid diagram" src="data:image/svg+xml,<svg></svg>" />
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

  beforeEach(() => {
    mountEl = document.createElement('div')
    document.body.append(mountEl)
    root = createRoot(mountEl)
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
    })) as never
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => PNG)
  })

  afterEach(() => {
    act(() => root.unmount())
    mountEl.remove()
    vi.restoreAllMocks()
  })

  it('opens a rasterized png preview instead of the svg data URL', async () => {
    const openImage = vi.fn()
    await act(async () => {
      root.render(
        <HostProvider host={{ ...host, openImage }}>
          <Mermaid content="graph TD; A-->B;" />
        </HostProvider>,
      )
    })

    const img = mountEl.querySelector(
      'img[alt="Mermaid diagram"]',
    ) as HTMLImageElement
    Object.defineProperty(img, 'naturalWidth', { value: 80 })
    Object.defineProperty(img, 'naturalHeight', { value: 40 })

    await act(async () => {
      img.dispatchEvent(new MouseEvent('click', { bubbles: true }))
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
  })
})
