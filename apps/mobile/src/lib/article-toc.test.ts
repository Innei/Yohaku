import { describe, expect, it } from 'vitest'

import type { LexicalHeading } from '@/lib/lexical-headings'

import {
  estimateTocSheetDetents,
  estimateTocSheetHeight,
  groupTocSections,
  parseTocDetents,
  presentArticleToc,
  tocHref,
  TOC_SHEET,
} from './article-toc'

const heading = (
  blockId: string,
  level: number,
  text = blockId,
): LexicalHeading => ({
  blockId,
  level,
  text,
})

describe('groupTocSections', () => {
  it('numbers each root and nests deeper headings under the last root', () => {
    expect(
      groupTocSections([
        heading('a', 2, 'Opening'),
        heading('b', 3, 'Why'),
        heading('c', 3, 'How'),
        heading('d', 2, 'Next'),
      ]),
    ).toEqual([
      {
        children: [heading('b', 3, 'Why'), heading('c', 3, 'How')],
        root: heading('a', 2, 'Opening'),
      },
      { children: [], root: heading('d', 2, 'Next') },
    ])
  })

  it('treats a flat list as one section per heading', () => {
    expect(groupTocSections([heading('a', 2), heading('b', 2)])).toEqual([
      { children: [], root: heading('a', 2) },
      { children: [], root: heading('b', 2) },
    ])
  })
})

describe('estimateTocSheetDetents', () => {
  it('fits a short outline to one detent instead of a full page', () => {
    const headings = [heading('a', 2), heading('b', 3), heading('c', 2)]
    const detents = estimateTocSheetDetents(headings, 852)
    expect(detents).toEqual([
      round(
        Math.max(
          TOC_SHEET.minFraction,
          estimateTocSheetHeight(headings) / 852,
        ),
      ),
    ])
    expect(detents[0]).toBeLessThan(0.5)
    expect(detents).not.toContain(1)
  })

  it('reads detent fractions from the route param', () => {
    expect(parseTocDetents({ d: '0.36,1' })).toEqual([0.36, 1])
    expect(parseTocDetents({ d: '1,0.4' })).toEqual([0.4, 1])
  })

  it('writes the estimated rest into the toc href', () => {
    const headings = [heading('a', 2), heading('b', 2)]
    presentArticleToc(headings, 852)
    const detents = estimateTocSheetDetents(headings, 852)
    expect(tocHref()).toBe(`/toc?d=${detents.join(',')}`)
    expect(parseTocDetents({ d: detents.join(',') })).toEqual(detents)
  })

  it('adds a large detent when the outline would overflow the first rest', () => {
    const headings = Array.from({ length: 16 }, (_, i) =>
      heading(`h${i}`, 2),
    )
    expect(estimateTocSheetDetents(headings, 852)).toEqual([
      TOC_SHEET.maxFirstFraction,
      1,
    ])
  })
})

function round(value: number) {
  return Math.round(value * 100) / 100
}
