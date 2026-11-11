import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { computeSceneBounds, Scene } from './Scene'
import type { ExcalidrawElement } from './types'

const render = (elements: unknown[], theme: 'light' | 'dark' = 'light') =>
  renderToStaticMarkup(
    <Scene
      scene={{ elements: elements as ExcalidrawElement[] }}
      theme={theme}
    />,
  )

const shape = (extra: Record<string, unknown> = {}) => ({
  id: 'shape',
  type: 'rectangle',
  x: 0,
  y: 0,
  width: 160,
  height: 80,
  angle: 0,
  strokeColor: '#1e1e1e',
  backgroundColor: '#ffc078',
  fillStyle: 'solid',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 0,
  opacity: 100,
  seed: 2,
  ...extra,
})

const CONTENT = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        tag: 'h3',
        children: [{ type: 'text', text: 'Brew' }],
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'Mila', style: 'color: #6b6b6b' }],
      },
    ],
  },
}

const card = (extra: Record<string, unknown> = {}) => ({
  id: 'card',
  type: 'richtext',
  x: 0,
  y: 0,
  width: 150,
  height: 96,
  content: CONTENT,
  ...extra,
})

const BOTTLE =
  '<svg viewBox="0 0 48 100"><rect width="48" height="100" fill="#d9480f"/></svg>'

describe('shadow', () => {
  it('draws a drop shadow under shapes that ask for one', () => {
    const html = render([shape({ shadow: true })])
    expect(html).toContain('<feDropShadow')
    expect(html).toMatch(/<g filter="url\(#[\w-]+\)"/)
  })

  it('stays dark under the inverted dark scene', () => {
    const html = render([shape({ shadow: true })], 'dark')
    expect(html).toContain('flood-color="#fff"')
  })

  it('is ignored on lines and text', () => {
    const html = render([
      shape({
        type: 'line',
        points: [
          [0, 0],
          [100, 0],
        ],
        shadow: true,
      }),
    ])
    expect(html).not.toContain('<feDropShadow')
  })
})

describe('svg element', () => {
  it('draws the source as an image fitted into the box', () => {
    const html = render([shape({ type: 'svg', svg: BOTTLE })])
    expect(html).toMatch(/<image[^>]*href="data:image\/svg\+xml/)
    expect(html).toContain('preserveAspectRatio="xMidYMid meet"')
    const href = /href="data:image\/svg\+xml;charset=utf-8,([^"]+)"/.exec(
      html,
    )![1]
    expect(decodeURIComponent(href)).toContain(
      'xmlns="http://www.w3.org/2000/svg"',
    )
  })

  it('keeps its own colours in dark mode', () => {
    const html = render([shape({ type: 'svg', svg: BOTTLE })], 'dark')
    expect(html).toMatch(/<image[^>]*filter="url\(#[\w-]*counter-invert/)
  })

  it('shows a dashed placeholder for invalid source', () => {
    const html = render([shape({ type: 'svg', svg: 'not svg' })])
    expect(html).not.toContain('<image')
    expect(html).toContain('stroke-dasharray')
  })
})

describe('richtext card', () => {
  it('renders its content inside the card body', () => {
    const html = render([card()])
    expect(html).toContain('<foreignObject')
    expect(html).toMatch(/<h3[^>]*><span>Brew<\/span><\/h3>/)
    expect(html).toContain('color:#6b6b6b')
  })

  it('draws with the card defaults when only required fields are written', () => {
    const html = render([card()])
    expect(html).not.toContain('NaN')
    expect(html).toMatch(/<path[^>]*fill="#ffec99"/)
  })

  it('grows to fit content taller than its height', () => {
    const long = {
      root: {
        type: 'root',
        children: Array.from({ length: 8 }, (_, i) => ({
          type: 'paragraph',
          children: [{ type: 'text', text: `Line ${i}` }],
        })),
      },
    }
    const bounds = computeSceneBounds([
      card({ height: 20, content: long }) as ExcalidrawElement,
    ])
    expect(bounds.height - 64).toBeGreaterThanOrEqual(8 * 24 + 24)
  })

  it('drops unsafe links', () => {
    const html = render([
      card({
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'link',
                    url: 'javascript:alert(1)',
                    children: [{ type: 'text', text: 'x' }],
                  },
                ],
              },
            ],
          },
        },
      }),
    ])
    expect(html).not.toContain('javascript:')
  })
})

describe('read-only fixes', () => {
  it('places elements written without angle', () => {
    const { angle: _angle, ...noAngle } = shape()
    expect(render([noAngle])).not.toContain('NaN')
  })

  it('fills an ellipse with the nonzero rule', () => {
    const html = render([shape({ type: 'ellipse' })])
    const fill = /<path[^>]*fill="#ffc078"[^>]*>/.exec(html)![0]
    expect(fill).not.toContain('evenodd')
  })

  it('draws fontFamily 2 in the sans-serif stack', () => {
    const html = render([
      shape({
        type: 'text',
        text: 'Title',
        fontFamily: 2,
        fontSize: 20,
        textAlign: 'left',
      }),
    ])
    expect(html).toMatch(/font-family="Helvetica/)
  })
})
