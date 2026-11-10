import { beforeEach, describe, expect, it, vi } from 'vitest'

const renderMermaid = vi.hoisted(() =>
  vi.fn(async (payload: { bg: string; fg: string; source: string }) => ({
    height: 40,
    uri: `file:///tmp/mermaid-${payload.source.length}.png`,
    width: 80,
  })),
)

vi.mock('@modules/yohaku', () => ({
  YohakuNative: { renderMermaid },
}))

import { renderInsightsMermaid } from './insights-mermaid'

describe('renderInsightsMermaid', () => {
  beforeEach(() => {
    renderMermaid.mockClear()
  })

  it('asks native to render and returns the file uri', async () => {
    const result = await renderInsightsMermaid('graph TD; A-->B', {
      bg: '#fff',
      fg: '#111',
    })
    expect(result).toEqual({
      error: '',
      height: 40,
      src: 'file:///tmp/mermaid-15.png',
      width: 80,
    })
    expect(renderMermaid).toHaveBeenCalledWith({
      bg: '#fff',
      fg: '#111',
      source: 'graph TD; A-->B',
    })
  })

  it('returns an error string when native render throws', async () => {
    renderMermaid.mockRejectedValueOnce(new Error('bad diagram'))
    expect(
      await renderInsightsMermaid('nope', { bg: '#fff', fg: '#111' }),
    ).toEqual({ error: 'bad diagram', src: '' })
  })

  it('does not call native for empty source', async () => {
    expect(await renderInsightsMermaid('', { bg: '#fff', fg: '#111' })).toEqual({
      error: 'Render failed',
      src: '',
    })
    expect(renderMermaid).not.toHaveBeenCalled()
  })
})
