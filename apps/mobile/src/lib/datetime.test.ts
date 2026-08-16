import { describe, expect, it } from 'vitest'

import {
  formatNoteListDate,
  formatRelativeTime,
  formatThinkingClock,
  thinkingDayLabel,
} from './datetime'

const now = new Date('2026-08-09T12:00:00+08:00')

function at(offsetMs: number) {
  return new Date(now.getTime() - offsetMs)
}

describe('formatRelativeTime', () => {
  it('formats recent moments', () => {
    expect(formatRelativeTime(at(30_000), 'zh', now)).toBe('刚刚')
    expect(formatRelativeTime(at(5 * 60_000), 'zh', now)).toBe('5 分钟前')
    expect(formatRelativeTime(at(3 * 3_600_000), 'zh', now)).toBe('3 小时前')
    expect(formatRelativeTime(at(5 * 86_400_000), 'zh', now)).toBe('5 天前')
  })

  it('falls back to dates beyond 30 days', () => {
    expect(
      formatRelativeTime(new Date('2026-05-01T12:00:00+08:00'), 'zh', now),
    ).toBe('5 月 1 日')
    expect(
      formatRelativeTime(new Date('2025-12-31T12:00:00+08:00'), 'zh', now),
    ).toBe('2025 年 12 月 31 日')
  })

  it('formats in every locale', () => {
    expect(formatRelativeTime(at(5 * 60_000), 'en', now)).toBe('5m ago')
    expect(formatRelativeTime(at(5 * 60_000), 'ja', now)).toBe('5 分前')
    expect(formatRelativeTime(at(5 * 60_000), 'ko', now)).toBe('5분 전')
    expect(formatRelativeTime(at(30_000), 'zh-TW', now)).toBe('剛剛')
    expect(
      formatRelativeTime(new Date('2025-12-31T12:00:00+08:00'), 'en', now),
    ).toBe('2025/12/31')
  })
})

describe('formatNoteListDate', () => {
  const date = new Date('2026-03-14T12:00:00+08:00')

  it('joins a locale month-day with a short weekday', () => {
    expect(formatNoteListDate(date, 'zh')).toBe('3月14日 · 周六')
    expect(formatNoteListDate(date, 'zh-TW')).toBe('3月14日 · 週六')
    expect(formatNoteListDate(date, 'en')).toBe('Mar 14 · Sat')
    expect(formatNoteListDate(date, 'ja')).toBe('3月14日 · 土')
    expect(formatNoteListDate(date, 'ko')).toBe('3월 14일 · 토')
  })
})

describe('thinkingDayLabel', () => {
  const now = new Date(2026, 7, 9, 12, 0)

  it('uses today and yesterday for adjacent local days', () => {
    expect(thinkingDayLabel(new Date(2026, 7, 9, 14, 20), 'zh', now)).toBe(
      '今天',
    )
    expect(thinkingDayLabel(new Date(2026, 7, 8, 18, 41), 'zh', now)).toBe(
      '昨天',
    )
    expect(thinkingDayLabel(new Date(2026, 7, 9, 8, 0), 'en', now)).toBe(
      'Today',
    )
    expect(thinkingDayLabel(new Date(2026, 7, 8, 8, 0), 'ja', now)).toBe('昨日')
    expect(thinkingDayLabel(new Date(2026, 7, 8, 8, 0), 'ko', now)).toBe('어제')
  })

  it('falls back to calendar dates beyond yesterday', () => {
    expect(thinkingDayLabel(new Date(2026, 4, 1, 12, 0), 'zh', now)).toBe(
      '5 月 1 日',
    )
    expect(thinkingDayLabel(new Date(2025, 11, 31, 12, 0), 'zh', now)).toBe(
      '2025 年 12 月 31 日',
    )
  })
})

describe('formatThinkingClock', () => {
  it('formats a 24-hour clock', () => {
    const date = new Date(2026, 7, 9, 14, 20)
    expect(formatThinkingClock(date, 'zh')).toBe('14:20')
    expect(formatThinkingClock(date, 'en')).toBe('14:20')
  })
})
