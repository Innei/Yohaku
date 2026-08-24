import { beforeEach, describe, expect, it, vi } from 'vitest'

const renderMermaidSVG = vi.hoisted(() =>
  vi.fn((content: string) => `<svg viewBox="0 0 80 40"><text>${content}</text></svg>`),
)

vi.mock('beautiful-mermaid', () => ({ renderMermaidSVG }))

import { flattenMermaidSvg, renderInsightsMermaid } from './insights-mermaid'

describe('flattenMermaidSvg', () => {
  it('bakes css variables and color-mix into hex so iOS can paint fills', () => {
    const svg = flattenMermaidSvg(`<svg xmlns="http://www.w3.org/2000/svg" style="--bg:#f0efeb;--fg:#24231f">
<style>svg { --_node-fill: var(--surface, color-mix(in srgb, var(--fg) 3%, var(--bg))); }</style>
<rect fill="var(--_node-fill)" stroke="var(--fg)"/>
</svg>`)
    expect(svg).not.toMatch(/var\(--/)
    expect(svg).not.toMatch(/color-mix/)
    expect(svg).toMatch(/fill="#[0-9a-f]{6}"/i)
    expect(svg).toContain('stroke="#24231f"')
  })
})

describe('renderInsightsMermaid', () => {
  beforeEach(() => {
    renderMermaidSVG.mockClear()
  })

  it('turns mermaid source into an svg data url', () => {
    const result = renderInsightsMermaid('graph TD; A-->B', {
      bg: '#fff',
      fg: '#111',
    })
    expect(result).toMatchObject({ height: 40, width: 80 })
    expect(result.src).toMatch(/^data:image\/svg\+xml;base64,/)
    expect(renderMermaidSVG).toHaveBeenCalledWith('graph TD; A-->B', {
      bg: '#fff',
      fg: '#111',
    })
  })

  it('returns an error string when render throws', () => {
    renderMermaidSVG.mockImplementationOnce(() => {
      throw new Error('bad diagram')
    })
    expect(
      renderInsightsMermaid('nope', { bg: '#fff', fg: '#111' }),
    ).toEqual({ error: 'bad diagram', src: '' })
  })
})
