import { describe, expect, it } from 'vitest'

import { computeBlockFingerprint } from '@/lib/comment-anchor'

import {
  buildHighlights,
  indexNativeBlocks,
  selectionMessageFromMenuAction,
} from './anchors'
import type { RichSegment } from './lexical/group'

const segments: RichSegment[] = [
  {
    kind: 'text',
    blocks: [
      { id: 'p1', role: 'paragraph', runs: [{ text: 'hello world' }] },
      { id: 'l1#0', role: 'listItem', runs: [{ text: 'one' }] },
      { id: 'l1#1', role: 'listItem', runs: [{ text: 'two' }] },
    ],
  },
]

const blockInfos = [
  {
    index: 0,
    blockId: 'p1',
    type: 'paragraph',
    textContent: 'hello world',
    fingerprint: computeBlockFingerprint('hello world'),
  },
  {
    index: 1,
    blockId: 'l1',
    type: 'list',
    textContent: 'onetwo',
    fingerprint: computeBlockFingerprint('onetwo'),
  },
]

describe('native anchors', () => {
  const map = indexNativeBlocks(segments)

  it('converts a list item selection into list-level offsets', () => {
    const message = selectionMessageFromMenuAction(
      {
        id: 'comment',
        text: 'tw',
        start: { blockId: 'l1#1', offset: 0 },
        end: { blockId: 'l1#1', offset: 2 },
      },
      blockInfos,
      map,
    )
    expect(message).toMatchObject({
      type: 'yohaku:selection-comment',
      anchor: { blockId: 'l1', startOffset: 3, endOffset: 5, quote: 'tw' },
    })
  })

  it('rejects selections spanning different root blocks', () => {
    const message = selectionMessageFromMenuAction(
      {
        id: 'comment',
        text: 'x',
        start: { blockId: 'p1', offset: 0 },
        end: { blockId: 'l1#0', offset: 1 },
      },
      blockInfos,
      map,
    )
    expect(message.type).toBe('yohaku:selection-comment-invalid')
  })

  it('maps existing range comments back onto the owning list item', () => {
    const highlights = buildHighlights({
      activeAnchor: null,
      blockComments: [],
      blockInfos,
      highlightBlockId: 'p1',
      map,
      rangeComments: [
        {
          id: 'c1',
          anchor: {
            mode: 'range',
            blockId: 'l1',
            blockType: 'list',
            blockFingerprint: computeBlockFingerprint('onetwo'),
            snapshotText: 'onetwo',
            quote: 'two',
            prefix: 'one',
            suffix: '',
            startOffset: 3,
            endOffset: 6,
          },
        },
      ],
    })
    expect(highlights).toEqual([
      { id: 'c1', blockId: 'l1#1', start: 0, end: 3, kind: 'comment' },
      { id: 'tts', blockId: 'p1', start: 0, end: 11, kind: 'block' },
    ])
  })
})
