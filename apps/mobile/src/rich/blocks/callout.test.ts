import { describe, expect, it } from 'vitest'

import { calloutKind } from './callout'

describe('calloutKind', () => {
  it('gives each alert type its own seal glyph and tone', () => {
    expect(calloutKind('warning')).toEqual({ glyph: '意', label: '注意', tone: 'warning' })
    expect(calloutKind('caution')).toEqual({ glyph: '警', label: '警告', tone: 'error' })
    expect(calloutKind('tip')).toEqual({ glyph: '示', label: '提示', tone: 'success' })
    expect(calloutKind('important')).toEqual({ glyph: '要', label: '重要', tone: 'accent' })
  })

  it('treats banner info like a note', () => {
    expect(calloutKind('info')).toEqual({ glyph: '信', label: '信息', tone: 'info' })
    expect(calloutKind('')).toEqual({ glyph: '注', label: '注', tone: 'info' })
  })

  it('keeps an unknown type readable', () => {
    expect(calloutKind('custom')).toEqual({ glyph: 'C', label: 'CUSTOM', tone: 'info' })
  })
})
