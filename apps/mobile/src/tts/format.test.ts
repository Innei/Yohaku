import { describe, expect, it } from 'vitest'

import { formatDuration, nextRate } from './format'

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

describe('nextRate', () => {
  it('cycles the web narration rates', () => {
    expect(nextRate(1)).toBe(1.25)
    expect(nextRate(1.25)).toBe(1.5)
    expect(nextRate(1.5)).toBe(1.75)
    expect(nextRate(1.75)).toBe(2)
    expect(nextRate(2)).toBe(1)
  })
})
