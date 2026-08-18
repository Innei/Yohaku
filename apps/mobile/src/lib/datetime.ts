import type { Locale } from '@/i18n/config'
import { translate } from '@/i18n/translate'

const intlLocales: Record<Locale, string> = {
  zh: 'zh-Hans',
  'zh-TW': 'zh-Hant',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
}

const noteListDateFormatters = new Map<
  Locale,
  { monthDay: Intl.DateTimeFormat; weekday: Intl.DateTimeFormat }
>()

function noteListDateFormattersFor(locale: Locale) {
  const cached = noteListDateFormatters.get(locale)
  if (cached) return cached
  const loc = intlLocales[locale]
  const next = {
    monthDay: new Intl.DateTimeFormat(loc, {
      day: 'numeric',
      month: 'short',
    }),
    weekday: new Intl.DateTimeFormat(loc, { weekday: 'short' }),
  }
  noteListDateFormatters.set(locale, next)
  return next
}

export function formatNoteListDate(date: Date, locale: Locale): string {
  const { monthDay, weekday } = noteListDateFormattersFor(locale)
  return `${monthDay.format(date)} · ${weekday.format(date)}`
}

const thinkingClockFormatters = new Map<Locale, Intl.DateTimeFormat>()

export function formatThinkingClock(date: Date, locale: Locale): string {
  let formatter = thinkingClockFormatters.get(locale)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(intlLocales[locale], {
      hour: '2-digit',
      hourCycle: 'h23',
      minute: '2-digit',
    })
    thinkingClockFormatters.set(locale, formatter)
  }
  return formatter.format(date)
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function localDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function thinkingDayLabel(
  date: Date,
  locale: Locale,
  now = new Date(),
): string {
  if (sameLocalDay(date, now)) return translate(locale, 'time', 'today')
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
  )
  if (sameLocalDay(date, yesterday))
    return translate(locale, 'time', 'yesterday')
  return date.getFullYear() === now.getFullYear()
    ? translate(locale, 'time', 'monthDay', {
        month: date.getMonth() + 1,
        day: date.getDate(),
      })
    : translate(locale, 'time', 'yearMonthDay', {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      })
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function formatRelativeTime(
  date: Date,
  locale: Locale,
  now = new Date(),
): string {
  const diff = now.getTime() - date.getTime()
  if (diff < MINUTE) return translate(locale, 'time', 'justNow')
  if (diff < HOUR) {
    return translate(locale, 'time', 'minutesAgo', {
      count: Math.floor(diff / MINUTE),
    })
  }
  if (diff < DAY) {
    return translate(locale, 'time', 'hoursAgo', {
      count: Math.floor(diff / HOUR),
    })
  }
  if (diff < 30 * DAY) {
    return translate(locale, 'time', 'daysAgo', {
      count: Math.floor(diff / DAY),
    })
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return year === now.getFullYear()
    ? translate(locale, 'time', 'monthDay', { month, day })
    : translate(locale, 'time', 'yearMonthDay', { year, month, day })
}
