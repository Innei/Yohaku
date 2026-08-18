import { describe, expect, it } from 'vitest'

import { readPercent } from './read-percent'

describe('readPercent', () => {
  it('is 0 at the top of the page', () => {
    expect(
      readPercent({
        bodyHeight: 2000,
        bodyTop: 0,
        scrollTop: 0,
        viewportHeight: 800,
      }),
    ).toBe(0)
  })

  it('is 100 when the last page is on screen', () => {
    expect(
      readPercent({
        bodyHeight: 2000,
        bodyTop: 0,
        scrollTop: 1200,
        viewportHeight: 800,
      }),
    ).toBe(100)
  })

  it('clamps and floors in-between values', () => {
    expect(
      readPercent({
        bodyHeight: 2000,
        bodyTop: 0,
        scrollTop: 200,
        viewportHeight: 800,
      }),
    ).toBe(20)
  })

  it('returns 0 when height is missing', () => {
    expect(
      readPercent({
        bodyHeight: 0,
        bodyTop: 0,
        scrollTop: 100,
        viewportHeight: 800,
      }),
    ).toBe(0)
  })
})
