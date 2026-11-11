import { Scene } from '@yohaku/rich-content/src/lexical/portable/excalidraw/Scene.tsx'
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

describe('reactToSvg with a whiteboard scene', () => {
  const svg = reactToSvg(
    createElement(Scene, {
      scene: {
        elements: [
          {
            id: 'card',
            type: 'richtext',
            x: 0,
            y: 0,
            width: 150,
            height: 96,
            shadow: true,
            content: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      { type: 'text', text: 'a' },
                      { type: 'linebreak' },
                      { type: 'text', text: 'b' },
                    ],
                  },
                ],
              },
            },
          } as never,
        ],
      },
      theme: 'light',
    }),
  )

  it('keeps the drop shadow blur attribute', () => {
    expect(svg).toContain('stdDeviation="4"')
  })

  it('writes card line breaks as void elements', () => {
    expect(svg).toContain('<br/>')
    expect(svg).not.toContain('</br>')
  })

  it('writes card text sizes with units', () => {
    expect(svg).toContain('font-size:16px')
  })
})
