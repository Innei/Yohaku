import { createElement, Fragment, memo } from 'react'
import { describe, expect, it } from 'vitest'

import { reactToSvg } from './svg-markup'

const Dot = memo(({ r }: { r: number }) =>
  createElement('circle', { cx: 1, cy: 2, r, strokeWidth: 2, fill: 'none' }),
)

describe('reactToSvg', () => {
  it('serialises host elements, memo components and fragments with kebab attributes', () => {
    const svg = reactToSvg(
      createElement(
        'svg',
        { viewBox: '0 0 10 10', style: { width: '100%', display: 'block' } },
        createElement(Fragment, null, createElement(Dot, { r: 3 }), 'a<b'),
      ),
    )
    expect(svg).toBe(
      '<svg viewBox="0 0 10 10" style="width:100%;display:block"><circle cx="1" cy="2" r="3" stroke-width="2" fill="none"></circle>a&lt;b</svg>',
    )
  })
})
