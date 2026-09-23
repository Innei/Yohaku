import { describe, expect, it } from 'vitest'

import { emaSeries, rangeLabel, stockHeader } from './stock'

process.env.TZ = 'UTC'

function bar(open: number, close: number) {
  return { close, high: close, low: open, open, timestamp: 0 }
}

describe('emaSeries', () => {
  it('seeds with the first close then smooths', () => {
    const k = 2 / 4
    const second = 4 * k + 2 * (1 - k)
    expect(emaSeries([2, 4, 6], 3)).toEqual([
      2,
      second,
      6 * k + second * (1 - k),
    ])
  })

  it('returns nothing for a non-positive period', () => {
    expect(emaSeries([1, 2], 0)).toEqual([])
  })
})

describe('stockHeader', () => {
  it('measures change against the first open', () => {
    expect(
      stockHeader({ symbol: 'AAPL' }, [bar(100, 104), bar(104, 110)]),
    ).toEqual({
      changePct: 10,
      lastClose: 110,
      up: true,
    })
  })

  it('reports a drop below the first open as down', () => {
    const header = stockHeader({ symbol: 'X' }, [bar(200, 210), bar(210, 190)])
    expect(header?.up).toBe(false)
    expect(header?.changePct).toBeCloseTo(-5)
  })

  it('is null without bars', () => {
    expect(stockHeader({ symbol: 'X' }, [])).toBeNull()
  })
})

describe('rangeLabel', () => {
  it('joins distinct days', () => {
    expect(
      rangeLabel({
        from: '2026-06-24T11:29:00.000Z',
        interval: '1h',
        to: '2026-06-25T20:29:00.000Z',
      }),
    ).toBe('6/24 – 6/25 · 1h')
  })

  it('collapses a single day', () => {
    expect(
      rangeLabel({
        from: '2026-06-24T11:29:00.000Z',
        interval: '5m',
        to: '2026-06-24T20:29:00.000Z',
      }),
    ).toBe('6/24 · 5m')
  })
})
