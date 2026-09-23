import { describe, expect, it } from 'vitest'

import {
  CAROUSEL_HEIGHT,
  carouselOffsets,
  carouselPage,
  carouselTileWidths,
  singleMediaRatio,
} from './media-carousel-layout'

describe('carouselTileWidths', () => {
  it('sizes each tile from its aspect at the fixed row height', () => {
    expect(carouselTileWidths([{ height: 4, width: 3 }], 400)).toEqual([
      CAROUSEL_HEIGHT * 0.75,
    ])
  })

  it('caps a wide tile at 85% of the card width so the next one peeks', () => {
    expect(
      carouselTileWidths(
        [
          { height: 1536, width: 2048 },
          { height: 2048, width: 1536 },
        ],
        318,
      ),
    ).toEqual([318 * 0.85, 195])
  })

  it('treats missing dimensions as square', () => {
    expect(carouselTileWidths([{ height: 0, width: 0 }], 318)).toEqual([
      CAROUSEL_HEIGHT,
    ])
  })
})

describe('singleMediaRatio', () => {
  it('keeps a ratio inside 4:5 to 16:9', () => {
    expect(singleMediaRatio({ height: 3, width: 4 })).toBeCloseTo(4 / 3)
  })

  it('clamps a tall portrait to 4:5', () => {
    expect(singleMediaRatio({ height: 2048, width: 1152 })).toBeCloseTo(0.8)
  })

  it('clamps a panorama to 16:9', () => {
    expect(singleMediaRatio({ height: 100, width: 400 })).toBeCloseTo(16 / 9)
  })
})

describe('carouselPage', () => {
  const portraits = carouselOffsets([195, 195, 195, 195])

  it('lays tiles out with a 4pt gap', () => {
    expect(portraits).toEqual([0, 199, 398, 597])
  })

  it('picks the nearest tile start while scrolling', () => {
    expect(carouselPage(portraits, 0, 466)).toBe(0)
    expect(carouselPage(portraits, 210, 466)).toBe(1)
  })

  it('reports the last tile once the row is scrolled to its end', () => {
    expect(carouselPage(portraits, 466, 466)).toBe(3)
  })
})
