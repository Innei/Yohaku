import { describe, expect, it } from 'vitest'

import { extractBlockOrder, indexForBlock } from './blocks'

const lexical = (ids: Array<string | undefined>) =>
  JSON.stringify({
    root: {
      children: ids.map((blockId) => ({
        type: 'paragraph',
        $: blockId ? { blockId } : undefined,
      })),
    },
  })

describe('extractBlockOrder', () => {
  it('reads root child block ids in order', () => {
    expect(extractBlockOrder(lexical(['a', 'b', 'c']))).toEqual(['a', 'b', 'c'])
  })

  it('uses an empty string when a child has no block id', () => {
    expect(extractBlockOrder(lexical(['a', undefined, 'c']))).toEqual([
      'a',
      '',
      'c',
    ])
  })

  it('returns an empty list for unparsable content', () => {
    expect(extractBlockOrder('not-json')).toEqual([])
    expect(extractBlockOrder('{}')).toEqual([])
  })
})

describe('indexForBlock', () => {
  it('finds the child index for a segment block', () => {
    expect(indexForBlock(['a', 'b', 'c'], 'b')).toBe(1)
  })

  it('returns -1 when the block is missing', () => {
    expect(indexForBlock(['a'], 'z')).toBe(-1)
  })
})
