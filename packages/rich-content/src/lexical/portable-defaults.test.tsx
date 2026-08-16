import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { type HostCapabilities, HostProvider } from '../host'
import {
  createYohakuLexicalRenderer,
  REGISTERED_NODE_TYPES,
} from './create-renderer'
import { sanitizeEditorState } from './sanitize'

vi.mock('./portable/shiki-highlighter', () => ({
  highlightToHtml: async (code: string) =>
    `<pre class="shiki"><code data-shiki-mock>${code}</code></pre>`,
}))

const chartStub = {
  addSeries: () => ({ setData: () => {} }),
  timeScale: () => ({ fitContent: () => {} }),
  subscribeCrosshairMove: () => {},
  unsubscribeCrosshairMove: () => {},
  remove: () => {},
}
vi.mock('lightweight-charts', () => ({
  createChart: () => chartStub,
  CandlestickSeries: {},
  LineSeries: {},
  CrosshairMode: { Normal: 0 },
  LineStyle: { Dashed: 2 },
}))

const baseHost: HostCapabilities = {
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

const RichContent = createYohakuLexicalRenderer()

function stateOf(nodes: unknown[]) {
  return sanitizeEditorState(
    {
      root: {
        children: nodes,
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    } as never,
    REGISTERED_NODE_TYPES,
  )
}

function renderStatic(nodes: unknown[], host: HostCapabilities = baseHost) {
  return renderToStaticMarkup(
    <HostProvider host={host}>
      <RichContent theme="light" value={stateOf(nodes)} variant="article" />
    </HostProvider>,
  )
}

const linkParagraph = {
  children: [
    {
      children: [
        {
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: 'GitHub',
          type: 'text',
          version: 1,
        },
      ],
      rel: null,
      target: null,
      type: 'link',
      url: 'https://github.com/innei',
      version: 1,
    },
  ],
  direction: null,
  format: '',
  indent: 0,
  type: 'paragraph',
  version: 1,
}

it('renders the default inline link with a favicon slot', () => {
  const html = renderStatic([linkParagraph])
  expect(html).toContain('rich-link-favicon')
  expect(html).toContain('href="https://github.com/innei"')
})

it('renders a slot-provided InlineLink instead of the default favicon anchor', () => {
  const host: HostCapabilities = {
    ...baseHost,
    slots: {
      InlineLink: ({ children, href }) => (
        <a data-inline-link-slot={href}>{children}</a>
      ),
    },
  }
  const html = renderStatic([linkParagraph], host)
  expect(html).toContain('data-inline-link-slot="https://github.com/innei"')
  expect(html).not.toContain('rich-link-favicon')
})

const linkCardNode = {
  type: 'link-card',
  url: 'https://enriched.example.com/post',
  version: 1,
}

it('renders the enrichment card when host.enrichments has the URL', () => {
  const host: HostCapabilities = {
    ...baseHost,
    enrichments: {
      'https://enriched.example.com/post': {
        description: 'A very enriched description',
        title: 'Enriched Title',
        url: 'https://enriched.example.com/post',
      },
    },
  }
  const html = renderStatic([linkCardNode], host)
  expect(html).toContain('yohaku-link-card')
  expect(html).toContain('Enriched Title')
  expect(html).toContain('A very enriched description')
})

it('falls back to a plain link when the URL has no enrichment entry', () => {
  const html = renderStatic([linkCardNode])
  expect(html).not.toContain('yohaku-link-card')
  expect(html).toContain('href="https://enriched.example.com/post"')
})

const githubBlob =
  'https://github.com/Innei/SKILL/blob/main/skills/automation/session-to-skill-and-blog/SKILL.md'

const githubFileParagraph = {
  children: [
    {
      children: [
        {
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: githubBlob,
          type: 'text',
          version: 1,
        },
      ],
      rel: null,
      target: null,
      type: 'autolink',
      url: githubBlob,
      version: 1,
    },
  ],
  direction: null,
  format: '',
  indent: 0,
  type: 'paragraph',
  version: 1,
}

it('embeds a GitHub blob URL as a file preview instead of a card', () => {
  const html = renderStatic([githubFileParagraph])
  expect(html).toContain('data-github-file-embed')
  expect(html).not.toContain('yohaku-link-card')
})

it('embeds a github-file embed node through the portable preview', () => {
  const html = renderStatic([
    {
      source: 'github-file',
      type: 'embed',
      url: githubBlob,
      version: 1,
    },
  ])
  expect(html).toContain('data-github-file-embed')
  expect(html).not.toContain('embed-static-github-file')
})

it('folds a long GitHub file and keeps the haklex light embed out of the tree', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response(
      Array.from({ length: 80 }, (_, i) => `- line ${i}`).join('\n'),
      {
        status: 200,
      },
    )) as typeof fetch
  try {
    await renderClient(
      [
        {
          source: 'github-file',
          type: 'embed',
          url: githubBlob,
          version: 1,
        },
      ],
      baseHost,
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(mountEl.querySelector('[data-github-file-embed]')).not.toBeNull()
    expect(mountEl.querySelector('.yohaku-code-fold--collapsed')).not.toBeNull()
    expect(mountEl.querySelector('.embed-static-github-file')).toBeNull()
    expect(mountEl.textContent).toContain('展开')
  } finally {
    globalThis.fetch = originalFetch
  }
})

const codeNode = {
  children: [
    {
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text: 'const a = 1',
      type: 'code-text',
      version: 1,
    },
  ],
  direction: null,
  format: '',
  indent: 0,
  language: 'ts',
  type: 'code-block',
  version: 1,
}

it('renders a slot-provided CodeBlock instead of the portable one', () => {
  const host: HostCapabilities = {
    ...baseHost,
    slots: {
      CodeBlock: ({ code }) => <pre data-code-slot>{code}</pre>,
    },
  }
  const html = renderStatic([codeNode], host)
  expect(html).toContain('data-code-slot')
  expect(html).not.toContain('yohaku-code-block')
})

let mountEl: HTMLDivElement
let mountRoot: Root

beforeEach(() => {
  mountEl = document.createElement('div')
  document.body.append(mountEl)
  mountRoot = createRoot(mountEl)
})

afterEach(() => {
  act(() => mountRoot.unmount())
  mountEl.remove()
})

async function renderClient(nodes: unknown[], host: HostCapabilities) {
  await act(async () => {
    mountRoot.render(
      <HostProvider host={host}>
        <RichContent theme="light" value={stateOf(nodes)} variant="article" />
      </HostProvider>,
    )
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

it('collapses a long code block behind an expand control', () => {
  const html = renderStatic([
    {
      code: Array.from({ length: 24 }, (_, i) => `line ${i}`).join('\n'),
      language: 'ts',
      type: 'code-block',
      version: 1,
    },
  ])
  expect(html).toContain('yohaku-code-block--collapsed')
  expect(html).toContain('展开')
})

it('highlights code through shiki once the async bundle resolves', async () => {
  await renderClient([codeNode], baseHost)
  const shikiEl = mountEl.querySelector('.yohaku-code-block__shiki')
  expect(shikiEl).not.toBeNull()
  expect(shikiEl?.innerHTML).toContain('data-shiki-mock')
})

const klineNode = {
  type: 'stock',
  variant: 'kline',
  symbol: 'AAPL',
  range: { from: '2026-01-01', interval: '1d', to: '2026-02-01' },
  version: 1,
}

it('renders the portable K-line card when the host supplies no StockKLine slot', async () => {
  const host: HostCapabilities = {
    ...baseHost,
    fetchJSON: async (url) => {
      if (String(url).includes('/serverless/built-in/stock_bars')) {
        return {
          bars: [
            {
              close: 102,
              high: 103,
              low: 99,
              open: 100,
              timestamp: 1_767_225_600_000,
              volume: 1000,
            },
          ],
          meta: {
            chartPreviousClose: 100,
            currency: 'USD',
            longName: 'Apple Inc.',
            regularMarketPrice: 102,
            symbol: 'AAPL',
          },
        } as never
      }
      return {} as never
    },
  }
  await renderClient([klineNode], host)
  expect(mountEl.textContent).toContain('AAPL')
  expect(mountEl.textContent).toContain('102.00')
  expect(mountEl.textContent).toContain('EMA 5/20')
})

it('lists poi titles on the map placeholder card', () => {
  const html = renderStatic([
    {
      pois: [{ lat: 35, lon: 139, title: 'Point A' }],
      title: 'Trip',
      type: 'map',
      version: 1,
    },
  ])
  expect(html).toContain('Point A')
  expect(html).toContain('1 个地点')
})
