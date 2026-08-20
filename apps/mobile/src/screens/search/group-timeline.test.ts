import { describe, expect, it } from 'vitest'

import {
  formatTimelineDay,
  formatTimelineMonth,
  groupSearchTimeline,
  timelineItemFromNote,
  timelineItemFromPost,
} from './group-timeline'

describe('formatTimelineDay', () => {
  it('pads the local calendar day to two digits', () => {
    expect(formatTimelineDay(new Date(2026, 7, 3))).toBe('03')
    expect(formatTimelineDay(new Date(2026, 7, 20))).toBe('20')
  })
})

describe('formatTimelineMonth', () => {
  it('uppercases the long English month', () => {
    expect(formatTimelineMonth(2026, 7, 'en')).toBe('AUGUST')
  })

  it('pairs the native long month with an English short for CJK locales', () => {
    expect(formatTimelineMonth(2026, 7, 'zh')).toBe('8月 · AUG')
  })
})

describe('timelineItemFromPost', () => {
  it('uses the category name as meta and keeps the post route', () => {
    expect(
      timelineItemFromPost({
        categoryName: '编程',
        categorySlug: 'coding',
        createdAt: new Date(2026, 2, 14),
        id: 'p1',
        slug: 'hello',
        title: '你好',
      }),
    ).toEqual({
      categorySlug: 'coding',
      date: new Date(2026, 2, 14),
      id: 'p1',
      meta: '编程',
      slug: 'hello',
      title: '你好',
    })
  })
})

describe('timelineItemFromNote', () => {
  it('joins weather and mood, and keeps the note route', () => {
    expect(
      timelineItemFromNote({
        createdAt: new Date(2026, 0, 2),
        hasPassword: true,
        id: 'n1',
        mood: '平静',
        nid: 12,
        title: '信',
        weather: '雨',
      }),
    ).toEqual({
      date: new Date(2026, 0, 2),
      hasPassword: true,
      id: 'n1',
      meta: '雨 · 平静',
      nid: 12,
      title: '信',
    })
  })

  it('leaves meta empty when a note has no weather or mood', () => {
    expect(
      timelineItemFromNote({
        createdAt: new Date(2026, 0, 2),
        hasPassword: false,
        id: 'n2',
        mood: null,
        nid: 3,
        title: '无天气',
        weather: null,
      }).meta,
    ).toBeNull()
  })
})

describe('groupSearchTimeline', () => {
  it('returns empty for no items', () => {
    expect(groupSearchTimeline([], 'zh')).toEqual([])
  })

  it('groups unsorted items by year and month, newest first', () => {
    const grouped = groupSearchTimeline(
      [
        timelineItemFromPost({
          categoryName: '生活',
          categorySlug: 'life',
          createdAt: new Date(2025, 1, 1),
          id: 'old-feb',
          slug: 'old-feb',
          title: '去年二月',
        }),
        timelineItemFromPost({
          categoryName: '编程',
          categorySlug: 'coding',
          createdAt: new Date(2026, 7, 20),
          id: 'aug-20',
          slug: 'aug-20',
          title: '八月二十',
        }),
        timelineItemFromPost({
          categoryName: '编程',
          categorySlug: 'coding',
          createdAt: new Date(2025, 11, 31),
          id: 'old-dec',
          slug: 'old-dec',
          title: '去年十二月',
        }),
        timelineItemFromPost({
          categoryName: '编程',
          categorySlug: 'coding',
          createdAt: new Date(2026, 7, 3),
          id: 'aug-3',
          slug: 'aug-3',
          title: '八月三',
        }),
        timelineItemFromPost({
          categoryName: '生活',
          categorySlug: 'life',
          createdAt: new Date(2026, 0, 8),
          id: 'jan',
          slug: 'jan',
          title: '一月',
        }),
      ],
      'zh',
    )

    expect(grouped.map((year) => ({ year: year.year, count: year.count }))).toEqual([
      { count: 3, year: 2026 },
      { count: 2, year: 2025 },
    ])
    expect(grouped[0]?.months.map((month) => month.label)).toEqual([
      '8月 · AUG',
      '1月 · JAN',
    ])
    expect(grouped[0]?.months[0]?.items.map((item) => item.id)).toEqual([
      'aug-20',
      'aug-3',
    ])
    expect(grouped[0]?.months[0]?.items[0]?.day).toBe('20')
    expect(grouped[1]?.months.map((month) => month.month)).toEqual([11, 1])
  })
})
