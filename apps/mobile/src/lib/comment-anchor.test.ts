import { describe, expect, it } from 'vitest'

import { extractBlockInfos } from '@/components/dom/anchor-utils'

import {
  blockCommentsFromRoots,
  type CommentAnchor,
  isBlockAnchor,
  isRangeAnchor,
  type RangeAnchor,
  rangeAnchorKey,
  rangeCommentsFromRoots,
  readerCommentBody,
  rootsForBlock,
  rootsForRange,
} from './comment-anchor'

const range: RangeAnchor = {
  blockFingerprint: 'abc',
  blockId: 'b1',
  blockType: 'paragraph',
  endOffset: 8,
  lang: null,
  mode: 'range',
  prefix: '前',
  quote: '间隙',
  snapshotText: '留出可供呼吸的间隙',
  startOffset: 6,
  suffix: '',
}

describe('readerCommentBody', () => {
  it('omits anchor when absent', () => {
    expect(readerCommentBody('hello')).toEqual({ text: 'hello' })
  })

  it('includes anchor when present', () => {
    expect(readerCommentBody('hello', range)).toEqual({
      text: 'hello',
      anchor: range,
    })
  })
})

describe('isRangeAnchor / rangeAnchorKey', () => {
  it('accepts a range payload and keys it', () => {
    expect(isRangeAnchor(range)).toBe(true)
    expect(rangeAnchorKey(range)).toBe('b1:6:8')
  })

  it('rejects a block payload', () => {
    expect(
      isRangeAnchor({
        mode: 'block',
        blockId: 'b1',
        blockType: 'paragraph',
        blockFingerprint: 'abc',
        snapshotText: 'x',
      }),
    ).toBe(false)
  })

  it('accepts a block payload', () => {
    expect(
      isBlockAnchor({
        mode: 'block',
        blockId: 'b1',
        blockType: 'paragraph',
        blockFingerprint: 'abc',
        snapshotText: 'x',
      }),
    ).toBe(true)
    expect(isBlockAnchor(range)).toBe(false)
  })
})

describe('extractBlockInfos', () => {
  it('returns empty for invalid json', () => {
    expect(extractBlockInfos('not-json')).toEqual([])
  })

  it('reads lexical root children and fingerprints', () => {
    const content = JSON.stringify({
      root: {
        children: [
          {
            type: 'paragraph',
            $: { blockId: 'p1' },
            children: [{ type: 'text', text: 'hello' }],
          },
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'no-id' }],
          },
        ],
      },
    })
    const infos = extractBlockInfos(content)
    expect(infos).toHaveLength(2)
    expect(infos[0]).toMatchObject({
      blockId: 'p1',
      index: 0,
      textContent: 'hello',
      type: 'paragraph',
    })
    expect(infos[1]?.blockId).toBe('')
    expect(infos[0]?.fingerprint).toBeTruthy()
  })
})

describe('rangeCommentsFromRoots / rootsForRange', () => {
  it('keeps only matching range roots', () => {
    const other: RangeAnchor = { ...range, startOffset: 0, endOffset: 2 }
    const roots: { anchor: CommentAnchor; id: string }[] = [
      { id: 'a', anchor: range },
      {
        id: 'b',
        anchor: {
          mode: 'block',
          blockId: 'b1',
          blockType: 'paragraph',
          blockFingerprint: 'x',
          snapshotText: 'x',
        },
      },
      { id: 'c', anchor: other },
    ]
    expect(rangeCommentsFromRoots(roots).map((item) => item.id)).toEqual([
      'a',
      'c',
    ])
    expect(rootsForRange(roots, range).map((item) => item.id)).toEqual(['a'])
    expect(blockCommentsFromRoots(roots).map((item) => item.id)).toEqual(['b'])
    expect(
      rootsForBlock(roots, {
        mode: 'block',
        blockId: 'b1',
        blockType: 'paragraph',
        blockFingerprint: 'x',
        snapshotText: 'x',
      }).map((item) => item.id),
    ).toEqual(['b'])
  })
})
