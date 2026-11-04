import { RichRenderer } from '@haklex/rich-compose/core'
import { allNodes } from '@haklex/rich-editor/static'
import type { SerializedEditorState } from 'lexical'
import { createElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { passthroughNodes } from './generic-node'
import { groupSegments, type RichSegment } from './group'
import { nativeBlockAnchor, nativeBuiltinOverrides } from './overrides'

const paragraph = (text: string) => ({
  type: 'paragraph',
  version: 1,
  direction: null,
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  children: [
    {
      type: 'text',
      version: 1,
      detail: 0,
      format: 0,
      mode: 'normal',
      style: '',
      text,
    },
  ],
})

const value = {
  root: {
    type: 'root',
    version: 1,
    direction: null,
    format: '',
    indent: 0,
    children: [paragraph('first'), paragraph('second')],
  },
} as unknown as SerializedEditorState

function Passthrough({ children }: { children?: ReactNode }) {
  return children
}

describe('RichRenderer surface', () => {
  it('hands the rendered blocks to the surface so segments are not empty', () => {
    let segments: RichSegment[] = []
    const Surface = ({
      document,
    }: {
      document: { renderAll: () => ReactNode }
    }) => {
      segments = groupSegments(document.renderAll())
      return null
    }

    renderToStaticMarkup(
      createElement(RichRenderer, {
        as: Passthrough,
        blockAnchor: nativeBlockAnchor,
        builtinNodeOverrides: nativeBuiltinOverrides,
        extraNodes: passthroughNodes(allNodes),
        surface: Surface,
        value,
      }),
    )

    expect(segments).toHaveLength(1)
    const [segment] = segments
    expect(segment?.kind).toBe('text')
    expect(
      segment?.kind === 'text' && segment.blocks.map((block) => block.runs),
    ).toEqual([[{ text: 'first' }], [{ text: 'second' }]])
  })
})
