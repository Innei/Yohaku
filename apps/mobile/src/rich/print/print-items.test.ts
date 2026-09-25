import { describe, expect, it, vi } from 'vitest'

import type { RichSegment } from '../lexical/group'
import { type PrintContext, printItems, printScaled } from './print-items'

const context = (overrides: Partial<PrintContext> = {}): PrintContext => ({
  fetchAlbum: vi.fn(async () => []),
  fetchKline: vi.fn(async () => null),
  fetchTrack: vi.fn(async () => null),
  footnotes: new Map(),
  locale: 'en',
  probe: vi.fn(async () => []),
  renderMermaid: vi.fn(async () => 'file:///m.png'),
  timeoutMs: 50,
  ...overrides,
})

const view = (
  node: Record<string, unknown> & { type: string },
): RichSegment => ({ kind: 'view', blockId: `b-${node.type}`, node })

describe('printItems', () => {
  it('keeps printable content and captions interactive blocks', async () => {
    const nested: RichSegment[] = [
      {
        kind: 'text',
        blocks: [{ id: 'n', role: 'paragraph', runs: [{ text: 'inside' }] }],
      },
    ]
    const ctx = context({ probe: vi.fn(async () => nested) })
    const items = await printItems(
      [
        {
          kind: 'text',
          blocks: [{ id: 'p', role: 'paragraph', runs: [{ text: 'body' }] }],
        },
        view({ type: 'image', src: 'https://x/a.jpg', caption: 'cap' }),
        view({ type: 'code-block', code: 'let a = 1' }),
        view({ type: 'mermaid', diagram: 'graph TD' }),
        view({
          type: 'table',
          rows: [
            [
              { header: true, runs: [{ text: 'k' }] },
              { header: true, runs: [{ text: 'v' }] },
            ],
          ],
        }),
        view({ type: 'alert-quote', content: { root: {} } }),
        view({ type: 'poll', question: 'Q?', options: [1, 2] }),
        view({ type: 'video', src: 'https://x/v.mp4' }),
      ],
      ctx,
    )

    expect(items).toEqual([
      {
        kind: 'text',
        blocks: [{ id: 'p', role: 'paragraph', runs: [{ text: 'body' }] }],
      },
      { kind: 'image', src: 'https://x/a.jpg', caption: 'cap' },
      { kind: 'code', code: 'let a = 1' },
      { kind: 'image', src: 'file:///m.png' },
      {
        kind: 'text',
        blocks: [
          {
            id: 'b-table#0',
            role: 'paragraph',
            runs: [
              { bold: true, text: 'k' },
              { text: '  │  ' },
              { bold: true, text: 'v' },
            ],
          },
        ],
      },
      nested[0],
      { kind: 'caption', text: 'Poll: Q? (2 options)' },
      { kind: 'caption', text: 'Video' },
    ])
  })
})

describe('printItems for structured blocks', () => {
  it('numbers footnotes, flattens grid cells and prints snippets, math and galleries', async () => {
    const cellText: RichSegment[] = [
      {
        kind: 'text',
        blocks: [{ id: 'c', role: 'paragraph', runs: [{ text: 'cell' }] }],
      },
    ]
    const probe = vi.fn(async () => cellText)
    const items = await printItems(
      [
        {
          kind: 'text',
          blocks: [
            {
              id: 'p',
              role: 'paragraph',
              runs: [{ footnote: 'n1', sup: true, text: 'n1' }],
            },
          ],
        },
        view({
          type: 'grid-container',
          cols: 2,
          cells: [{ root: {} }, { root: {} }],
        }),
        view({ type: 'footnote-section', definitions: { n1: 'first' } }),
        view({
          type: 'code-snippet',
          files: [
            { code: 'a()', filename: 'a.ts' },
            { code: 'b()', filename: 'b.ts' },
          ],
        }),
        view({ type: 'katex-block', equation: 'x^2' }),
        view({ type: 'gallery', images: [{ src: 'g1' }, { src: 'g2' }] }),
      ],
      context({ footnotes: new Map([['n1', 1]]), probe }),
    )

    expect(probe).toHaveBeenCalledTimes(2)
    expect(items).toEqual([
      {
        kind: 'text',
        blocks: [
          {
            id: 'p',
            role: 'paragraph',
            runs: [
              {
                footnote: 'n1',
                href: 'yohaku-footnote:n1',
                sup: true,
                text: '1',
              },
            ],
          },
        ],
      },
      ...cellText,
      ...cellText,
      {
        kind: 'text',
        blocks: [
          { id: 'b-footnote-section', role: 'hr', runs: [] },
          {
            id: 'b-footnote-section#n1',
            role: 'paragraph',
            runs: [{ text: '1  ' }, { text: 'first' }],
          },
        ],
      },
      { kind: 'caption', text: 'a.ts' },
      { kind: 'code', code: 'a()' },
      { kind: 'caption', text: 'b.ts' },
      { kind: 'code', code: 'b()' },
      { kind: 'math', latex: 'x^2' },
      { kind: 'imageGrid', columns: 3, srcs: ['g1', 'g2'] },
    ])
  })
})

describe('printItems for media grids', () => {
  it('prints an image-only grid as one thumbnail grid with its columns', async () => {
    let n = 0
    const probe = vi.fn(async (): Promise<RichSegment[]> => [
      view({ type: 'image', src: `img-${++n}` }),
    ])
    const items = await printItems(
      [
        view({
          type: 'grid-container',
          cols: 2,
          cells: [1, 2, 3].map(() => ({
            root: { type: 'root', children: [{ type: 'image' }] },
          })),
        }),
      ],
      context({ probe }),
    )
    expect(items).toEqual([
      { kind: 'imageGrid', columns: 2, srcs: ['img-1', 'img-2', 'img-3'] },
    ])
  })
})

describe('printItems grid and gallery shapes', () => {
  it('collapses media cells that end with an empty paragraph and include galleries', async () => {
    const image = (src: string) => ({ type: 'image', src })
    const emptyParagraph = { type: 'paragraph', children: [] }
    const cells = [
      { root: { type: 'root', children: [image('a'), emptyParagraph] } },
      { root: { type: 'root', children: [{ type: 'gallery' }] } },
    ]
    const probe = vi
      .fn<PrintContext['probe']>()
      .mockResolvedValueOnce([
        view(image('a')),
        { kind: 'text', blocks: [{ id: 'e', role: 'paragraph', runs: [] }] },
      ])
      .mockResolvedValueOnce([
        view({ type: 'gallery', images: [{ src: 'g1' }, { src: 'g2' }] }),
      ])
    const items = await printItems(
      [view({ type: 'grid-container', cells })],
      context({ probe }),
    )
    expect(items).toEqual([
      { kind: 'imageGrid', columns: 2, srcs: ['a', 'g1', 'g2'] },
    ])
  })

  it('caps gallery thumbnails at nine', async () => {
    const images = Array.from({ length: 12 }, (_, i) => ({ src: `g${i}` }))
    const [item] = await printItems(
      [view({ type: 'gallery', images })],
      context(),
    )
    expect(item).toMatchObject({ kind: 'imageGrid' })
    expect((item as { srcs: string[] }).srcs).toHaveLength(9)
  })
})

describe('printItems fetch concurrency', () => {
  it('starts every media fetch before awaiting any of them', async () => {
    const started: string[] = []
    const gate = <T>(name: string, value: T) =>
      vi.fn(
        () =>
          new Promise<T>((resolve) => {
            started.push(name)
            setTimeout(() => resolve(value), 20)
          }),
      )
    const promise = printItems(
      [
        view({ type: 'map', title: 'm', track: { url: 't' } }),
        view({ type: 'stock', symbol: 'S', variant: 'kline' }),
        view({ type: 'afilmory', title: 'a', baseUrl: 'b' }),
      ],
      context({
        fetchAlbum: gate('album', ['p']),
        fetchKline: gate('kline', { bars: [], ema: [] }),
        fetchTrack: gate('track', [[[1, 2]]]),
        timeoutMs: 1000,
      }),
    )
    await Promise.resolve()
    await Promise.resolve()
    expect(started.sort()).toEqual(['album', 'kline', 'track'])
    await promise
  })
})

describe('printItems for fetched media', () => {
  const media = [
    view({ type: 'map', title: 'Tama', track: { url: 't.json' } }),
    view({ type: 'stock', symbol: 'AAPL', variant: 'kline' }),
    view({ type: 'afilmory', title: 'Walk', baseUrl: 'https://a' }),
  ]

  it('renders map, K-line and album as static media', async () => {
    const bars = [{ c: 2, h: 3, l: 1, o: 1.5, t: 1, v: 9 }]
    const items = await printItems(
      media,
      context({
        fetchAlbum: vi.fn(async () => ['p1', 'p2', 'p3']),
        fetchKline: vi.fn(async () => ({ bars, ema: [] })),
        fetchTrack: vi.fn(async () => [
          [
            [35, 139],
            [35.1, 139.1],
          ],
        ]),
      }),
    )
    expect(items).toEqual([
      {
        kind: 'map',
        caption: 'Map: Tama',
        polylines: [
          [
            [35, 139],
            [35.1, 139.1],
          ],
        ],
      },
      { kind: 'kline', bars, caption: 'Stock: AAPL', ema: [] },
      {
        kind: 'imageGrid',
        caption: 'Album: Walk',
        columns: 3,
        srcs: ['p1', 'p2', 'p3'],
      },
    ])
  })

  it('falls back to captions when a fetch fails, returns nothing or times out', async () => {
    const items = await printItems(
      media,
      context({
        fetchAlbum: vi.fn(async () => []),
        fetchKline: vi.fn(() => new Promise<never>(() => {})),
        fetchTrack: vi.fn(async () => {
          throw new Error('offline')
        }),
      }),
    )
    expect(items).toEqual([
      { kind: 'caption', text: 'Map: Tama' },
      { kind: 'caption', text: 'Stock: AAPL' },
      { kind: 'caption', text: 'Album: Walk' },
    ])
  })
})

describe('printScaled', () => {
  it('scales every length and leaves strings alone', () => {
    expect(
      printScaled({ color: '#000', fontSize: 16, quote: { indent: 28 } }),
    ).toEqual({ color: '#000', fontSize: 10.6, quote: { indent: 18.5 } })
  })
})
