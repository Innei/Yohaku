import { describe, expect, it } from 'vitest'

import {
  fonts,
  nativeSerifFontFamily,
  WEBVIEW_FONT_FAMILY,
  webviewFontFaceSpecs,
  webviewSerifFontFamily,
} from './font-faces'

const configuredFamilies = new Set(
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

  it('chooses a locale-specific serif and falls back while Korean downloads', () => {
    expect(nativeSerifFontFamily('en', false)).toBe('Georgia')
    expect(nativeSerifFontFamily('ja', false)).toBe('Hiragino Mincho ProN')
    expect(nativeSerifFontFamily('zh', false)).toBe('NotoSerifSC_500Medium')
    expect(nativeSerifFontFamily('zh-TW', false)).toBe(
      'NotoSerifSC_500Medium',
    )
    expect(nativeSerifFontFamily('ko', false)).toBe('Apple SD Gothic Neo')
    expect(nativeSerifFontFamily('ko', true)).toBe('AppleMyungjo')

    expect(webviewSerifFontFamily('en', false)).toBe('Georgia')
    expect(webviewSerifFontFamily('ja', false)).toBe(
      'Hiragino Mincho ProN',
    )
    expect(webviewSerifFontFamily('zh', false)).toBe('Noto Serif SC')
    expect(webviewSerifFontFamily('ko', false)).toBe('Apple SD Gothic Neo')
    expect(webviewSerifFontFamily('ko', true)).toBe('AppleMyungjo')
  })

  it('injects the bundled Chinese serif into webviews', () => {
    expect(fonts.serif.fontFamily).toBe('NotoSerifSC_500Medium')
    expect(WEBVIEW_FONT_FAMILY.serif).toBe('Noto Serif SC')
    expect(
      webviewFontFaceSpecs.filter(
        (face) => face.family === WEBVIEW_FONT_FAMILY.serif,
      ),
    ).toEqual([
      {
        family: 'Noto Serif SC',
        native: 'NotoSerifSC_500Medium',
        weight: 500,
      },
    ])
    expect(webviewFontFaceSpecs).toHaveLength(3)
  })

  it('lets the webview reuse the same native font keys', () => {
    expect(
      webviewFontFaceSpecs
        .map(({ native }) => native)
        .every((name) => configuredFamilies.has(name)),
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
    expect(configuredFamilies.size).toBe(3)
  })
})
