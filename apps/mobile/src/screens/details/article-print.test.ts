import { describe, expect, it } from 'vitest'

import {
  buildPrintMasthead,
  formatPrintDate,
  printBlockFallback,
} from './article-print'

describe('formatPrintDate', () => {
  it('uses an absolute calendar date, not a relative phrase', () => {
    expect(formatPrintDate(new Date(2026, 7, 26), 'zh')).toBe(
      '2026 年 8 月 26 日',
    )
    expect(formatPrintDate(new Date(2026, 7, 26), 'en')).toBe('2026/8/26')
  })
})

describe('printBlockFallback', () => {
  it('turns interactive blocks into one-line captions', () => {
    expect(
      printBlockFallback('poll', { count: 3, question: '今天印不印？' }, 'zh'),
    ).toBe('投票：今天印不印？（3 个选项）')
    expect(printBlockFallback('map', { title: '东京' }, 'zh')).toBe(
      '地图：东京',
    )
    expect(printBlockFallback('file', { name: 'README.md' }, 'zh')).toBe(
      '文件：README.md',
    )
    expect(printBlockFallback('video', {}, 'zh')).toBe('视频')
  })
})

describe('buildPrintMasthead', () => {
  it('keeps category, title, date, and url', () => {
    expect(
      buildPrintMasthead({
        category: ' 手记 ',
        dateLabel: '2026 年 8 月 26 日',
        title: ' 在余白里 ',
        url: ' https://innei.in/notes/1 ',
      }),
    ).toEqual({
      category: '手记',
      dateLabel: '2026 年 8 月 26 日',
      title: '在余白里',
      url: 'https://innei.in/notes/1',
    })
  })
})
