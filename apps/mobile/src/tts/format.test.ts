import { describe, expect, it } from 'vitest'

import { formatDuration, formatRate, isTtsRate, ttsRateMenuItems } from './format'

describe('formatDuration', () => {
  it('renders mm:ss from seconds', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(134)).toBe('2:14')
    expect(formatDuration(5.9)).toBe('0:05')
  })

  it('clamps non-finite values to zero', () => {
    expect(formatDuration(Number.NaN)).toBe('0:00')
    expect(formatDuration(-3)).toBe('0:00')
  })
})

describe('formatRate', () => {
  it('renders the narration speed label', () => {
    expect(formatRate(1)).toBe('1×')
    expect(formatRate(1.25)).toBe('1.25×')
    expect(formatRate(2)).toBe('2×')
  })
})

describe('ttsRateMenuItems', () => {
  it('marks only the current rate as selected', () => {
    expect(ttsRateMenuItems(1.5)).toEqual([
      { id: '1', on: false, title: '1×' },
      { id: '1.25', on: false, title: '1.25×' },
      { id: '1.5', on: true, title: '1.5×' },
      { id: '1.75', on: false, title: '1.75×' },
      { id: '2', on: false, title: '2×' },
    ])
  })

  it('accepts only the shipped rates', () => {
    expect(isTtsRate(1.25)).toBe(true)
    expect(isTtsRate(1.1)).toBe(false)
  })
})
