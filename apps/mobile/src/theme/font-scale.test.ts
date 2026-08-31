import { describe, expect, it } from 'vitest'

import {
  clampFontScale,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
} from './font-scale'

describe('clampFontScale', () => {
  it('keeps the Large default at 1', () => {
    expect(clampFontScale(1)).toBe(1)
  })

  it('floors Extra Small and below', () => {
    expect(clampFontScale(FONT_SCALE_MIN)).toBe(FONT_SCALE_MIN)
    expect(clampFontScale(0.5)).toBe(FONT_SCALE_MIN)
  })

  it('caps XXXL and accessibility sizes', () => {
    expect(clampFontScale(FONT_SCALE_MAX)).toBe(FONT_SCALE_MAX)
    expect(clampFontScale(2)).toBe(FONT_SCALE_MAX)
  })
})
