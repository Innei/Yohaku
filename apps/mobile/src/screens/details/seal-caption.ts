import type { Locale } from '@/i18n/config'
import { getMessages } from '@/i18n/translate'

export interface SealCaption {
  lead: string
  number: number | null
  tail: string
}

function split(template: string, number: number): SealCaption {
  const [lead = '', tail = ''] = template.split('{count}')
  return { lead, number, tail }
}

export function sealCaption(
  locale: Locale,
  count: number,
  liked: boolean,
  countIncludesSelf = true,
): SealCaption | null {
  const messages = getMessages(locale).common
  if (liked) {
    const others = Math.max(0, countIncludesSelf ? count - 1 : count)
    return others > 0
      ? split(messages.sealCountLiked, others)
      : { lead: messages.sealFirst, number: null, tail: '' }
  }
  return count > 0 ? split(messages.sealCount, count) : null
}

export function sealGlyph(locale: Locale) {
  return locale === 'zh' || locale === 'zh-TW' || locale === 'ja' ? '喜' : '♥'
}
