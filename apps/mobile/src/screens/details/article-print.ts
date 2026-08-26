import type { Locale } from '@/i18n/config'
import { translate } from '@/i18n/translate'

export function formatPrintDate(date: Date, locale: Locale): string {
  return translate(locale, 'time', 'yearMonthDay', {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  })
}

export type PrintBlockKind =
  | 'afilmory'
  | 'chat'
  | 'dynamic'
  | 'embed'
  | 'excalidraw'
  | 'file'
  | 'map'
  | 'nestedDoc'
  | 'poll'
  | 'stock'
  | 'video'

export function printBlockFallback(
  kind: PrintBlockKind,
  fields: {
    count?: number
    name?: string
    question?: string
    symbol?: string
    title?: string
  },
  locale: Locale,
): string {
  switch (kind) {
    case 'poll':
      return translate(locale, 'print', 'poll', {
        count: fields.count ?? 0,
        question: fields.question ?? '',
      })
    case 'map':
      return translate(locale, 'print', 'map', {
        title: fields.title ?? '',
      })
    case 'nestedDoc':
      return translate(locale, 'print', 'nestedDoc', {
        title: fields.title ?? '',
      })
    case 'file':
      return translate(locale, 'print', 'file', {
        name: fields.name ?? '',
      })
    case 'stock':
      return translate(locale, 'print', 'stock', {
        symbol: fields.symbol ?? '',
      })
    case 'afilmory':
      return translate(locale, 'print', 'afilmory', {
        title: fields.title ?? '',
      })
    default:
      return translate(locale, 'print', kind)
  }
}

export interface PrintMasthead {
  category: string
  dateLabel: string
  title: string
  url: string
}

export function buildPrintMasthead(input: PrintMasthead): PrintMasthead {
  return {
    category: input.category.trim(),
    dateLabel: input.dateLabel.trim(),
    title: input.title.trim(),
    url: input.url.trim(),
  }
}
