import { describe, expect, it } from 'vitest'

import type { RichSegment } from '../lexical/group'
import { buildMarkdownArticle, containerImages } from './article'
import type { MarkdownNode, MarkdownNodeType } from './ast'
import { inlineRuns } from './inline-extensions'
import { prepass } from './prepass'

const n = (
  type: MarkdownNodeType,
  children: MarkdownNode[] = [],
  attributes?: Record<string, string>,
): MarkdownNode => ({ type, children, ...(attributes ? { attributes } : null) })
const t = (content: string): MarkdownNode => ({ type: 'text', content })
const p = (...children: MarkdownNode[]) => n('paragraph', children)
const doc = (...children: MarkdownNode[]) => n('document', children)

const build = (
  source: string,
  trees: Record<string, MarkdownNode> | MarkdownNode,
) =>
  buildMarkdownArticle(source, (chunk) =>
    'type' in trees ? (trees as MarkdownNode) : (trees[chunk] ?? doc()),
  )

const textBlocks = (segments: RichSegment[]) =>
  segments.flatMap((segment) => (segment.kind === 'text' ? segment.blocks : []))
const viewNodes = (segments: RichSegment[]) =>
  segments.flatMap((segment) => (segment.kind === 'view' ? [segment.node] : []))

describe('prepass', () => {
  it('lifts footnote definitions and leaves fenced code alone', () => {
    const result = prepass(
      [
        'Body[^1]',
        '',
        '```md',
        '[^2]: inside a fence',
        '::: note',
        '```',
        '',
        '[^1]: First line',
        '  continued',
      ].join('\n'),
    )
    expect(result.definitions).toEqual({ '1': 'First line continued' })
    expect(result.chunks).toHaveLength(1)
    expect(result.chunks[0]).toMatchObject({ kind: 'markdown' })
    expect((result.chunks[0] as { text: string }).text).toContain(
      '[^2]: inside a fence',
    )
  })

  it('splits known containers and keeps unknown or unclosed ones as text', () => {
    const result = prepass(
      [
        'before',
        '::: banner {warning}',
        'careful',
        ':::',
        '::: unknown',
        'x',
        ':::',
        '::: note',
        'never closed',
      ].join('\n'),
    )
    expect(result.chunks).toEqual([
      { kind: 'markdown', text: 'before' },
      { kind: 'container', name: 'banner', params: 'warning', content: 'careful' },
      {
        kind: 'markdown',
        text: '::: unknown\nx\n:::\n::: note\nnever closed',
      },
    ])
  })
})

describe('inlineRuns', () => {
  it('maps mentions, insert and known footnotes, and keeps unknown ones literal', () => {
    const scope = { definitions: { a: 'note' }, numbers: new Map() }
    expect(
      inlineRuns('by [Inn]{GH@Innei} ++new++ x[^a] y[^b]', scope),
    ).toEqual([
      { text: 'by ' },
      { href: 'https://github.com/Innei', mention: true, text: '@Inn' },
      { text: ' ' },
      { text: 'new', underline: true },
      { text: ' x' },
      { footnote: 'a', sup: true, text: 'a' },
      { text: ' y[^b]' },
    ])
    expect(scope.numbers.get('a')).toBe(1)
  })
})

describe('containerImages', () => {
  it('reads image syntax and bare url lines', () => {
    expect(
      containerImages('![one](https://a/1.png "t")\nhttps://a/2.png\ntext'),
    ).toEqual([{ alt: 'one', src: 'https://a/1.png' }, { src: 'https://a/2.png' }])
  })
})

describe('buildMarkdownArticle', () => {
  it('gives blocks stable ids and derives headings from them', () => {
    const article = build(
      '# Title\n\nbody',
      doc(n('heading', [t('Title')], { level: '1' }), p(t('body'))),
    )
    expect(textBlocks(article.segments)).toEqual([
      { id: 'm0', level: 1, role: 'heading', runs: [{ text: 'Title' }] },
      { id: 'm1', role: 'paragraph', runs: [{ text: 'body' }] },
    ])
    expect(article.headings).toEqual([{ blockId: 'm0', level: 1, text: 'Title' }])
  })

  it('applies inline marks and drops soft breaks between CJK characters', () => {
    const article = build(
      'x',
      doc(
        p(
          t('中文'),
          n('softBreak'),
          t('换行 and'),
          n('softBreak'),
          n('strong', [t('bold')]),
          n('link', [t('site')], { url: 'https://a.dev' }),
          n('code', [t('{GH@x}')]),
        ),
      ),
    )
    expect(textBlocks(article.segments)[0]!.runs).toEqual([
      { text: '中文' },
      { text: '换行 and' },
      { text: ' ' },
      { bold: true, text: 'bold' },
      { href: 'https://a.dev', text: 'site' },
      { code: true, text: '{GH@x}' },
    ])
  })

  it('turns a lone bare link into a link card and a lone image into an image block', () => {
    const url = 'https://example.com/post'
    const article = build(
      'x',
      doc(
        p(n('link', [t(url)], { url })),
        p(n('image', [t('alt')], { url: 'https://a/i.png' })),
        p(n('link', [t('named')], { url })),
      ),
    )
    expect(viewNodes(article.segments)).toEqual([
      { type: 'link-card', url },
      { type: 'image', src: 'https://a/i.png', altText: 'alt' },
    ])
    expect(textBlocks(article.segments)).toHaveLength(1)
  })

  it('maps code, mermaid, display math and tables to view blocks', () => {
    const article = build(
      'x',
      doc(
        n('codeBlock', [t('let a = 1\n')], { language: 'ts' }),
        n('codeBlock', [t('graph TD\n')], { language: 'mermaid' }),
        n('latexMathDisplay', [t(' x^2 ')]),
        n('table', [
          n('tableHead', [n('tableRow', [n('tableHeaderCell', [t('H')])])]),
          n('tableBody', [n('tableRow', [n('tableCell', [t('c')])])]),
        ]),
      ),
    )
    expect(viewNodes(article.segments)).toEqual([
      { type: 'code-block', code: 'let a = 1', language: 'ts' },
      { type: 'mermaid', diagram: 'graph TD' },
      { type: 'katex-block', equation: 'x^2' },
      {
        type: 'table',
        rows: [
          [{ header: true, runs: [{ text: 'H' }] }],
          [{ header: false, runs: [{ text: 'c' }] }],
        ],
      },
    ])
  })

  it('hoists blocks out of list items and resumes numbering', () => {
    const item = (...children: MarkdownNode[]) => n('listItem', children)
    const article = build(
      'x',
      doc(
        n(
          'orderedList',
          [
            item(p(t('one')), n('codeBlock', [t('npm i\n')])),
            item(
              p(t('two')),
              n('unorderedList', [
                n('listItem', [p(t('task'))], {
                  isTask: 'true',
                  taskChecked: 'true',
                }),
              ]),
            ),
          ],
          { start: '3' },
        ),
      ),
    )
    expect(article.segments.map((segment) => segment.kind)).toEqual([
      'text',
      'view',
      'text',
    ])
    expect(textBlocks(article.segments)).toMatchObject([
      { role: 'listItem', listType: 'number', index: 3, depth: 0 },
      { role: 'listItem', listType: 'number', index: 4, depth: 0 },
      { role: 'listItem', listType: 'check', checked: true, depth: 1 },
    ])
  })

  it('renders alert quotes as callouts and plain quotes as one quote block', () => {
    const article = build(
      'x',
      doc(
        n('blockquote', [p(t('[!WARNING]'), n('softBreak'), t('careful'))]),
        n('blockquote', [p(t('first')), p(t('second'))]),
      ),
    )
    const [callout] = article.segments
    expect(callout).toMatchObject({
      kind: 'view',
      node: { type: 'alert-quote', alertType: 'warning' },
    })
    expect(textBlocks(article.segments)).toEqual([
      {
        id: 'm1',
        role: 'quote',
        runs: [{ text: 'first' }, { text: '\n' }, { text: 'second' }],
      },
    ])
  })

  it('builds containers and a footnote section from the pre-pass', () => {
    const article = build(
      [
        'See[^n]',
        '::: gallery',
        '![a](https://a/1.png)',
        ':::',
        '::: warn',
        'inside',
        ':::',
        '[^n]: The note',
      ].join('\n'),
      { 'See[^n]': doc(p(t('See[^n]'))), inside: doc(p(t('inside'))) },
    )
    expect(textBlocks(article.segments)[0]!.runs).toEqual([
      { text: 'See' },
      { footnote: 'n', sup: true, text: 'n' },
    ])
    expect(viewNodes(article.segments)).toEqual([
      { type: 'gallery', images: [{ alt: 'a', src: 'https://a/1.png' }] },
      { type: 'banner', bannerType: 'warning' },
      { type: 'footnote-section', definitions: { n: 'The note' } },
    ])
    expect(article.footnotes.get('n')).toBe(1)
  })
})
