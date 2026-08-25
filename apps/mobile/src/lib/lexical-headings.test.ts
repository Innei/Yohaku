import { describe, expect, it } from 'vitest'

import { extractHeadings } from './lexical-headings'

const doc = (children: unknown[]) => JSON.stringify({ root: { children } })

describe('extractHeadings', () => {
  it('reads heading text, level, and block id in order', () => {
    expect(
      extractHeadings(
        doc([
          { type: 'paragraph', $: { blockId: 'p1' }, children: [{ text: 'x' }] },
          {
            type: 'heading',
            tag: 'h2',
            $: { blockId: 'h1' },
            children: [{ text: '现' }, { children: [{ text: '状' }] }],
          },
          {
            type: 'heading',
            tag: 'h3',
            $: { blockId: 'h2' },
            children: [{ text: ' 名字由来 ' }],
          },
        ]),
      ),
    ).toEqual([
      { blockId: 'h1', level: 2, text: '现状' },
      { blockId: 'h2', level: 3, text: '名字由来' },
    ])
  })

  it('skips headings without a block id, text, or usable tag', () => {
    expect(
      extractHeadings(
        doc([
          { type: 'heading', tag: 'h2', children: [{ text: 'no id' }] },
          { type: 'heading', tag: 'h2', $: { blockId: 'a' }, children: [] },
          { type: 'heading', tag: 'h7', $: { blockId: 'b' }, children: [{ text: 'x' }] },
        ]),
      ),
    ).toEqual([])
    expect(extractHeadings('not-json')).toEqual([])
  })
})
