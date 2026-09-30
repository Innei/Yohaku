import { createElement, Fragment, isValidElement } from 'react'
import { describe, expect, it } from 'vitest'

import {
  RunMarker,
  type RunMarkerProps,
  TextBlockMarker,
  ViewBlockMarker,
} from './markers'
import { nativeBuiltinOverrides } from './overrides'

function runOf(type: string, node: Record<string, unknown>) {
  const element = nativeBuiltinOverrides[type]!(node, 'k', null, () => null)
  if (!isValidElement(element)) throw new Error('not an element')
  return (element.props as RunMarkerProps).run
}

describe('inline entity runs', () => {
  it('marks a tag as a tag, not as inline code', () => {
    expect(runOf('tag', { text: '设计' })).toEqual({ tag: true, text: '#设计' })
  })

  it('marks a mention instead of bolding it', () => {
    expect(runOf('mention', { displayName: 'Innei' })).toEqual({
      mention: true,
      text: '@Innei',
    })
  })
})

describe('paragraph with a block image inside', () => {
  it('splits the text at the image so reading order holds', () => {
    const element = nativeBuiltinOverrides.paragraph!({}, 'p', [
      createElement(RunMarker, { key: 'a', run: { text: '窗外是这样的：' } }),
      createElement(ViewBlockMarker, { key: 'b', node: { type: 'image' } }),
      createElement(RunMarker, { key: 'c', run: { text: '然后我拉上了窗帘。' } }),
    ], () => null)
    if (!isValidElement(element) || element.type !== Fragment) {
      throw new Error('expected a fragment')
    }
    const children = (element.props as { children: React.ReactElement[] }).children
    expect(children.map((child) => child.type)).toEqual([
      TextBlockMarker,
      ViewBlockMarker,
      TextBlockMarker,
    ])
    expect(
      children
        .filter((child) => child.type === TextBlockMarker)
        .map((child) => (child.props as { block: { runs: unknown } }).block.runs),
    ).toEqual([[{ text: '窗外是这样的：' }], [{ text: '然后我拉上了窗帘。' }]])
  })
})
