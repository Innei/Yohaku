import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { groupSegments } from './group'
import { ListMarker, TextBlockMarker, ViewBlockMarker } from './markers'

describe('groupSegments', () => {
  it('merges consecutive text blocks and flattens lists, breaking on view blocks', () => {
    const segments = groupSegments([
      createElement(TextBlockMarker, {
        key: 'p',
        blockId: 'p1',
        block: { role: 'paragraph', runs: [{ text: 'a' }] },
      }),
      createElement(ListMarker, {
        key: 'l',
        blockId: 'l1',
        list: {
          listType: 'number',
          start: 3,
          items: [
            {
              runs: [{ text: 'one' }],
              nested: [
                {
                  listType: 'bullet',
                  start: 1,
                  items: [{ runs: [{ text: 'deep' }], nested: [] }],
                },
              ],
            },
          ],
        },
      }),
      createElement(ViewBlockMarker, {
        key: 'v',
        blockId: 'img',
        node: { type: 'image', src: 'x' },
      }),
      createElement(TextBlockMarker, {
        key: 'q',
        block: { role: 'quote', runs: [{ text: 'b' }] },
      }),
    ])
    expect(segments).toEqual([
      {
        kind: 'text',
        blocks: [
          { id: 'p1', role: 'paragraph', runs: [{ text: 'a' }] },
          {
            id: 'l1#0',
            role: 'listItem',
            listType: 'number',
            depth: 0,
            index: 3,
            runs: [{ text: 'one' }],
          },
          {
            id: 'l1#1',
            role: 'listItem',
            listType: 'bullet',
            depth: 1,
            index: 1,
            runs: [{ text: 'deep' }],
          },
        ],
      },
      {
        kind: 'view',
        blockId: 'img',
        node: { type: 'image', src: 'x' },
        children: undefined,
      },
      {
        kind: 'text',
        blocks: [{ id: 'b3', role: 'quote', runs: [{ text: 'b' }] }],
      },
    ])
  })
})
