import { type HostCapabilities, HostProvider } from '@yohaku/rich-content/host'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InsightsPre } from './insights-code'
import { InsightsMermaid } from './insights-mermaid'

const renderMermaidSVG = vi.hoisted(() =>
  vi.fn((content: string) => `<svg viewBox="0 0 80 40"><text>${content}</text></svg>`),
)

vi.mock('beautiful-mermaid', () => ({ renderMermaidSVG }))

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

describe('InsightsMermaid', () => {
  let mountEl: HTMLDivElement
  let root: Root

  beforeEach(() => {
    renderMermaidSVG.mockClear()
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

  it('renders a diagram img from beautiful-mermaid with the light palette', async () => {
    await act(async () => {
      root.render(
        <HostProvider host={host}>
          <InsightsMermaid content="graph TD; A-->B;" />
        </HostProvider>,
      )
    })

    expect(renderMermaidSVG).toHaveBeenCalledWith('graph TD; A-->B;', {
      bg: '#ffffff',
      fg: '#262626',
    })
    const img = mountEl.querySelector(
      'img[alt="Mermaid diagram"]',
    ) as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.src).toMatch(/^data:image\/svg\+xml;base64,/)
  })

  it('uses the dark palette when the host is dark', async () => {
    await act(async () => {
      root.render(
        <HostProvider host={{ ...host, theme: 'dark' }}>
          <InsightsMermaid content="graph TD; A-->B;" />
        </HostProvider>,
      )
    })

    expect(renderMermaidSVG).toHaveBeenCalledWith('graph TD; A-->B;', {
      bg: '#171717',
      fg: '#fafafa',
    })
  })

  it('opens a rasterized png preview instead of the svg data URL', async () => {
    const openImage = vi.fn()
    await act(async () => {
      root.render(
        <HostProvider host={{ ...host, openImage }}>
          <InsightsMermaid content="graph TD; A-->B;" />
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

  it('shows a local error when beautiful-mermaid throws', async () => {
    renderMermaidSVG.mockImplementationOnce(() => {
      throw new Error('bad fence')
    })
    await act(async () => {
      root.render(
        <HostProvider host={host}>
          <InsightsMermaid content="not mermaid" />
        </HostProvider>,
      )
    })

    expect(mountEl.querySelector('img')).toBeNull()
    expect(mountEl.textContent).toContain('bad fence')
  })
})

describe('InsightsPre', () => {
  let mountEl: HTMLDivElement
  let root: Root

  beforeEach(() => {
    renderMermaidSVG.mockClear()
    mountEl = document.createElement('div')
    document.body.append(mountEl)
    root = createRoot(mountEl)
  })

  afterEach(() => {
    act(() => root.unmount())
    mountEl.remove()
  })

  it('renders InsightsMermaid for a mermaid fence', async () => {
    await act(async () => {
      root.render(
        <HostProvider host={host}>
          <InsightsPre>
            <code className="language-mermaid">{'graph TD; A-->B;'}</code>
          </InsightsPre>
        </HostProvider>,
      )
    })

    expect(mountEl.querySelector('.insights-mermaid img[alt="Mermaid diagram"]')).not.toBeNull()
    expect(mountEl.querySelector('pre.insights-pre')).toBeNull()
  })

  it('keeps a plain pre for non-mermaid fences', async () => {
    await act(async () => {
      root.render(
        <HostProvider host={host}>
          <InsightsPre>
            <code className="language-ts">{'const x = 1'}</code>
          </InsightsPre>
        </HostProvider>,
      )
    })

    expect(mountEl.querySelector('pre.insights-pre')).not.toBeNull()
    expect(renderMermaidSVG).not.toHaveBeenCalled()
  })
})
