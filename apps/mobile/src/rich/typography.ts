import type { Locale } from '@/i18n/config'
import { fonts, nativeSerifFontFamily } from '@/theme/font-faces'
import type { Palette } from '@/theme/palette'

import { bodyMetrics } from './body-scale'

export type RichVariant = 'article' | 'note'

// Headings step down from the body in em; margins collapse against the paragraph
// gap, so only the excess becomes spacingBefore.
const HEADING_SCALE = [1.75, 1.4, 1.13, 1, 1, 0.88]
const HEADING_LINE = [1.32, 1.42, 1.42, 1.47, 1.47, 1.55]
const HEADING_MARGIN_TOP = [1.5, 1.4, 1.3, 1.2, 1.1, 1]

// Noto Serif SC ships one weight, so a bold trait would be faked with a stroke.
function headings(
  base: number,
  paragraphGap: number,
  serif: string,
  isNote: boolean,
  palette: Palette,
) {
  const out: Record<string, HeadingSpec> = {}
  HEADING_SCALE.forEach((scale, index) => {
    const size = Math.round(base * scale)
    const display = index < 2
    out[String(index + 1)] = {
      size,
      lineHeight: Math.round(size * HEADING_LINE[index]!),
      spacingBefore: Math.max(
        0,
        Math.round(size * HEADING_MARGIN_TOP[index]!) - paragraphGap,
      ),
      spacingAfter: paragraphGap,
      fontFamily: display || isNote ? serif : undefined,
      weight: display || isNote ? 'regular' : 'semibold',
      color:
        index === 4
          ? palette.neutral[7]
          : index === 5
            ? palette.neutral[6]
            : display
              ? palette.neutral[10]
              : palette.neutral[9],
    }
  })
  return out
}

interface HeadingSpec {
  color: string
  fontFamily?: string
  lineHeight: number
  size: number
  spacingAfter: number
  spacingBefore: number
  weight: 'regular' | 'semibold'
}

export function richTypography(
  variant: RichVariant,
  locale: Locale,
  palette: Palette,
  fontScale = 1,
) {
  const serif = nativeSerifFontFamily(locale, false)
  const isNote = variant === 'note'
  const { fontSize, lineHeight, paragraphGap } = bodyMetrics(variant, fontScale)
  return {
    fontFamily: isNote ? serif : undefined,
    fallbackFontFamily: fonts.serif.fontFamily,
    codeFontFamily: fonts.mono.fontFamily,
    fontSize,
    lineHeight,
    paragraphGap,
    headings: headings(fontSize, paragraphGap, serif, isNote, palette),
    quote: {
      fontFamily: serif,
      fontSize,
      lineHeight,
      indent: 28,
      gap: Math.round(paragraphGap / 2),
      italic: false,
      color: palette.neutral[7],
      barColor: palette.neutral[4],
    },
    list: { indent: 24, markerInset: 10, textInset: 36, itemGap: 12 },
    hrGap: 56,
    color: palette.neutral[9],
    secondaryColor: palette.neutral[6],
    mutedColor: palette.neutral[5],
    paperColor: palette.surface.paper,
    linkColor: palette.accent,
    accentColor: palette.accent,
    highlightColor: `${palette.accent}3d`,
    activeHighlightColor: `${palette.accent}17`,
    codeBackground: palette.neutral[2],
  }
}
