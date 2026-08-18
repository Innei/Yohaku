export type NativeFontName =
  | 'NotoSerifSC_500Medium'
  | 'CascadiaCodePL_400Regular'
  | 'CascadiaCodePL_600SemiBold'

export interface FontStyle {
  fontFamily?: NativeFontName
  fontWeight?: '400' | '500' | '600'
}

export const fonts = {
  sans: { fontWeight: '400' },
  sansMedium: { fontWeight: '500' },
  sansSemiBold: { fontWeight: '600' },
  serif: { fontFamily: 'NotoSerifSC_500Medium' },
  mono: { fontFamily: 'CascadiaCodePL_400Regular' },
  monoSemiBold: { fontFamily: 'CascadiaCodePL_600SemiBold' },
} as const satisfies Record<string, FontStyle>

export const WEBVIEW_FONT_FAMILY = {
  sans: '-apple-system',
  serif: 'Noto Serif SC',
  mono: 'Cascadia Code PL',
} as const

export interface WebviewFontFaceSpec {
  family: string
  native: NativeFontName
  weight: number
}

export const webviewFontFaceSpecs: readonly WebviewFontFaceSpec[] = [
  {
    family: WEBVIEW_FONT_FAMILY.serif,
    native: 'NotoSerifSC_500Medium',
    weight: 500,
  },
  {
    family: WEBVIEW_FONT_FAMILY.mono,
    native: 'CascadiaCodePL_400Regular',
    weight: 400,
  },
  {
    family: WEBVIEW_FONT_FAMILY.mono,
    native: 'CascadiaCodePL_600SemiBold',
    weight: 600,
  },
]
