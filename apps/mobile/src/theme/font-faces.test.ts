import { describe, expect, it } from 'vitest'

import { fonts, nativeSerifFontFamily, WEBVIEW_FONT_FAMILY } from './font-faces'

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
    expect(nativeSerifFontFamily('zh-TW', false)).toBe('NotoSerifSC_500Medium')
    expect(nativeSerifFontFamily('ko', false)).toBe('Apple SD Gothic Neo')
    expect(nativeSerifFontFamily('ko', true)).toBe('AppleMyungjo')
  })
})
