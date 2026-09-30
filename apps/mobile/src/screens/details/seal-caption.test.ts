import { describe, expect, it } from 'vitest'

import { sealCaption, sealGlyph } from './seal-caption'

describe('sealCaption', () => {
  it('counts readers before you stamp', () => {
    expect(sealCaption('zh', 12, false)).toEqual({ lead: '', number: 12, tail: ' 人喜欢' })
  })

  it('stays quiet when nobody has stamped', () => {
    expect(sealCaption('zh', 0, false)).toBeNull()
  })

  it('excludes you from the others once your stamp is counted', () => {
    expect(sealCaption('zh', 13, true)).toEqual({
      lead: '你和另外 ',
      number: 12,
      tail: ' 人盖了章',
    })
  })

  it('does not subtract you while the count has not caught up', () => {
    expect(sealCaption('zh', 12, true, false)?.number).toBe(12)
  })

  it('marks the first stamp', () => {
    expect(sealCaption('zh', 1, true)).toEqual({ lead: '你盖了第一枚章', number: null, tail: '' })
  })
})

describe('sealGlyph', () => {
  it('uses 喜 for CJK locales and a heart elsewhere', () => {
    expect(sealGlyph('zh')).toBe('喜')
    expect(sealGlyph('ja')).toBe('喜')
    expect(sealGlyph('en')).toBe('♥')
    expect(sealGlyph('ko')).toBe('♥')
  })
})
