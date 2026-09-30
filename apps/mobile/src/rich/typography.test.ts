import { accent, neutral, semantic, surface } from '@yohaku/design-system/tokens'
import { describe, expect, it } from 'vitest'

import type { Palette } from '@/theme/palette'

import { richTypography } from './typography'

const palette: Palette = {
  accent: accent.light,
  neutral: neutral.light,
  semantic: semantic.light,
  surface: surface.light,
  theme: 'light',
}

describe('richTypography headings', () => {
  it('sets post headings in a narrower ladder with serif h1/h2', () => {
    const { headings } = richTypography('article', 'zh', palette)
    expect(
      Object.values(headings).map((spec) => [spec.size, spec.lineHeight]),
    ).toEqual([
      [26, 34],
      [21, 30],
      [17, 24],
      [15, 22],
      [15, 22],
      [13, 20],
    ])
    expect(headings['1']).toMatchObject({
      fontFamily: 'NotoSerifSC_500Medium',
      weight: 'regular',
      color: neutral.light[10],
    })
    expect(headings['3']).toMatchObject({ fontFamily: undefined, weight: 'semibold' })
    expect(headings['5']!.color).toBe(neutral.light[7])
    expect(headings['6']!.color).toBe(neutral.light[6])
  })

  it('never fakes a bold weight on note headings', () => {
    const { headings } = richTypography('note', 'zh', palette)
    expect(Object.values(headings).map((spec) => spec.size)).toEqual([
      30, 24, 19, 17, 17, 15,
    ])
    expect(Object.values(headings).every((spec) => spec.weight === 'regular')).toBe(true)
  })
})

describe('richTypography quote and markers', () => {
  it('sets quotes upright at body size with a hairline bar', () => {
    const { quote } = richTypography('note', 'zh', palette)
    expect(quote).toMatchObject({
      fontSize: 17,
      lineHeight: 28,
      italic: false,
      color: neutral.light[7],
      barColor: neutral.light[4],
    })
  })

  it('exposes the muted marker color for lists, rules and checkboxes', () => {
    expect(richTypography('article', 'zh', palette).mutedColor).toBe(
      neutral.light[5],
    )
  })
})
