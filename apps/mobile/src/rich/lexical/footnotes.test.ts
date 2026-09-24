import { describe, expect, it } from 'vitest'

import { footnoteEntries, footnoteNumbers, numberFootnotes } from './footnotes'

const ref = (identifier: string) => ({ type: 'footnote', identifier })

const doc = {
  root: {
    type: 'root',
    children: [
      { type: 'paragraph', children: [{ type: 'text' }, ref('b'), ref('a')] },
      {
        type: 'list',
        children: [{ type: 'listitem', children: [ref('b'), ref('c')] }],
      },
    ],
  },
}

describe('footnoteNumbers', () => {
  it('numbers identifiers by first appearance in document order', () => {
    expect([...footnoteNumbers(doc as never)]).toEqual([
      ['b', 1],
      ['a', 2],
      ['c', 3],
    ])
  })
})

describe('footnoteNumbers in nested content', () => {
  it('counts refs inside callout content and grid cells but not nested docs', () => {
    const nested = {
      root: {
        type: 'root',
        children: [
          {
            type: 'alert-quote',
            content: { root: { type: 'root', children: [ref('x')] } },
          },
          {
            type: 'grid-container',
            cells: [{ root: { type: 'root', children: [ref('y')] } }],
          },
          {
            type: 'nested-doc',
            content: { root: { type: 'root', children: [ref('z')] } },
          },
          { type: 'paragraph', children: [ref('w')] },
        ],
      },
    }
    expect([...footnoteNumbers(nested as never)]).toEqual([
      ['x', 1],
      ['y', 2],
      ['w', 3],
    ])
  })
})

describe('numberFootnotes', () => {
  it('rewrites footnote runs to their display number with a jump link', () => {
    const numbers = new Map([['b', 1]])
    const blocks = numberFootnotes(
      [
        {
          id: 'p',
          role: 'paragraph',
          runs: [
            { text: 'body' },
            { footnote: 'b', sup: true, text: 'b' },
            { footnote: 'zz', sup: true, text: 'zz' },
          ],
        },
      ],
      numbers,
    )
    expect(blocks[0]!.runs).toEqual([
      { text: 'body' },
      { footnote: 'b', href: 'yohaku-footnote:b', sup: true, text: '1' },
      { footnote: 'zz', href: 'yohaku-footnote:zz', sup: true, text: 'zz' },
    ])
  })
})

describe('footnoteEntries', () => {
  it('orders definitions by display number, unmapped ones last in key order', () => {
    expect(
      footnoteEntries(
        { z: 'zed', a: 'alpha', b: 'beta', y: 'why' },
        new Map([
          ['b', 1],
          ['a', 2],
        ]),
      ),
    ).toEqual([
      { id: 'b', label: '1', text: 'beta' },
      { id: 'a', label: '2', text: 'alpha' },
      { id: 'y', label: 'y', text: 'why' },
      { id: 'z', label: 'z', text: 'zed' },
    ])
  })
})
