import { describe, expect, it } from 'vitest'

import {
  isNumericCell,
  MAX_COLUMN,
  MIN_COLUMN,
  tableColumnWidths,
  tableOverflow,
  tableSignature,
} from './table-layout'

describe('tableColumnWidths', () => {
  it('fills the width in proportion when every column fits', () => {
    expect(tableColumnWidths([60, 120], 360)).toEqual([120, 240])
  })

  it('gives spare room to capped columns before widening short ones', () => {
    expect(tableColumnWidths([60, 800], 350)).toEqual([60, 290])
  })

  it('keeps capped widths and overflows when the table cannot fit', () => {
    const widths = tableColumnWidths([800, 800, 20], 350)
    expect(widths).toEqual([MAX_COLUMN, MAX_COLUMN, MIN_COLUMN])
  })

  it('sums to the available width without fractional overflow', () => {
    const widths = tableColumnWidths([71, 73, 79], 350)
    expect(widths.every(Number.isInteger)).toBe(true)
    expect(widths.reduce((a, b) => a + b, 0)).toBe(350)
  })
})

describe('isNumericCell', () => {
  it('treats counts, money and percentages as numbers', () => {
    expect(['176', '1,024', '-3.5', '42%', '$1,200', '+12'].every(isNumericCell)).toBe(true)
  })

  it('leaves words, dates with text, and empty cells as text', () => {
    expect(['雪国', 'v1.2 beta', '', '  ', '3 本'].some(isNumericCell)).toBe(false)
  })
})

describe('tableOverflow', () => {
  it('treats float residue from a fitted table as no overflow', () => {
    const available = 335.99999999999
    const widths = tableColumnWidths([120, 33, 90, 70], available)
    expect(tableOverflow(widths, available)).toBe(0)
  })

  it('reports the scroll distance of a table that does not fit', () => {
    expect(tableOverflow([240, 240], 350)).toBe(130)
  })
})

describe('tableSignature', () => {
  it('changes when cell text or column count changes', () => {
    const cell = (text: string) => ({ header: false, runs: [{ text }] })
    const base = tableSignature([[cell('a'), cell('b')]])
    expect(tableSignature([[cell('a'), cell('b')]])).toBe(base)
    expect(tableSignature([[cell('a'), cell('c')]])).not.toBe(base)
    expect(tableSignature([[cell('a'), cell('b'), cell('')]])).not.toBe(base)
  })
})
