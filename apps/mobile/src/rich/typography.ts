import type { Locale } from '@/i18n/config'
import { fonts, nativeSerifFontFamily } from '@/theme/font-faces'
import { noteTypography } from '@/theme/note-typography'
import type { Palette } from '@/theme/palette'

export type RichVariant = 'article' | 'note'

// Mirrors the web article variant (haklex article.css + Yohaku heading
// override): headings scale by em, margins collapse against the 24px
// paragraph gap, so only the excess becomes spacingBefore.
const HEADING_SCALE = [2, 1.5, 1.25, 1.125, 1, 0.875]
const HEADING_MARGIN_TOP = [1.5, 1.4, 1.3, 1.2, 1.1, 1]

function headings(base: number, paragraphGap: number) {
  const out: Record<string, Record<string, number | string>> = {}
  HEADING_SCALE.forEach((scale, index) => {
    const size = Math.round(base * scale)
    out[String(index + 1)] = {
      size,
      lineHeight: Math.round(size * 1.25),
      spacingBefore: Math.max(
        0,
        Math.round(size * HEADING_MARGIN_TOP[index]!) - paragraphGap,
      ),
      spacingAfter: paragraphGap,
      weight: index < 2 ? 'bold' : 'semibold',
    }
  })
  return out
}

export function richTypography(
  variant: RichVariant,
  locale: Locale,
  palette: Palette,
) {
  const serif = nativeSerifFontFamily(locale, false)
  const isNote = variant === 'note'
  const fontSize = isNote ? noteTypography.fontSize : 16
  const paragraphGap = isNote ? noteTypography.paragraphGap : 24
  return {
    fontFamily: isNote ? serif : undefined,
    fallbackFontFamily: fonts.serif.fontFamily,
    codeFontFamily: fonts.mono.fontFamily,
    fontSize,
    lineHeight: 28,
    paragraphGap,
    headings: headings(fontSize, paragraphGap),
    quote: {
      fontFamily: serif,
      fontSize: 15,
      lineHeight: 24,
      indent: 28,
      gap: paragraphGap,
      italic: true,
    },
    list: { indent: 24, markerInset: 10, textInset: 36, itemGap: 12 },
    hrGap: 56,
    color: palette.neutral[9],
    secondaryColor: palette.neutral[6],
    linkColor: palette.accent,
    accentColor: palette.accent,
    highlightColor: `${palette.accent}33`,
    activeHighlightColor: `${palette.accent}66`,
    codeBackground: palette.neutral[2],
  }
}
