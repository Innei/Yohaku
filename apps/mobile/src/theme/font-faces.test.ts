import { describe, expect, it } from 'vitest'

import { fonts, WEBVIEW_FONT_FAMILY, webviewFontFaceSpecs } from './font-faces'

const bundledFamilies = new Set(
  Object.values(fonts).flatMap((font) =>
    'fontFamily' in font ? [font.fontFamily] : [],
  ),
)

describe('font-faces', () => {
  it('exposes Cascadia Code PL as the app mono face', () => {
    expect(fonts.mono.fontFamily).toBe('CascadiaCodePL_400Regular')
    expect(fonts.monoSemiBold.fontFamily).toBe('CascadiaCodePL_600SemiBold')
    expect(WEBVIEW_FONT_FAMILY.mono).toBe('Cascadia Code PL')
  })

  it('lets the webview reuse the same native font keys', () => {
    expect(
      webviewFontFaceSpecs
        .map(({ native }) => native)
        .every((name) => bundledFamilies.has(name)),
    ).toBe(true)
    expect(
      webviewFontFaceSpecs.filter(
        (face) => face.family === WEBVIEW_FONT_FAMILY.mono,
      ),
    ).toEqual([
      {
        family: 'Cascadia Code PL',
        native: 'CascadiaCodePL_400Regular',
        weight: 400,
      },
      {
        family: 'Cascadia Code PL',
        native: 'CascadiaCodePL_600SemiBold',
        weight: 600,
      },
    ])
  })

  // Shipping a sans family cost 119MB of bundled ttf for six faces; sans now
  // rides the OS font on both sides and must stay weight-only.
  it('keeps sans on the system font instead of a bundled family', () => {
    for (const font of [fonts.sans, fonts.sansMedium, fonts.sansSemiBold]) {
      expect(font).not.toHaveProperty('fontFamily')
      expect(font.fontWeight).toMatch(/^[4-6]00$/)
    }
    expect(WEBVIEW_FONT_FAMILY.sans).toBe('-apple-system')
    expect(bundledFamilies.size).toBe(3)
  })
})
