import { clampFontScale } from '@/theme/font-scale'
import { noteTypography } from '@/theme/note-typography'

import type { RichVariant } from './typography'

const ARTICLE = { fontSize: 15, lineHeight: 26, paragraphGap: 20, minSize: 13 }
const NOTE = { ...noteTypography, minSize: 15 }

export function bodyMetrics(variant: RichVariant, fontScale: number) {
  const base = variant === 'note' ? NOTE : ARTICLE
  const scale = clampFontScale(fontScale)
  const fontSize = Math.max(base.minSize, Math.round(base.fontSize * scale))
  return {
    fontSize,
    lineHeight: Math.round((fontSize * base.lineHeight) / base.fontSize),
    paragraphGap: Math.round(base.paragraphGap * scale),
  }
}

export function codeMetrics(fontScale: number) {
  const scale = clampFontScale(fontScale)
  const fontSize = Math.max(11, Math.round(12.5 * scale * 2) / 2)
  return { fontSize, lineHeight: Math.round((fontSize * 21) / 12.5) }
}
