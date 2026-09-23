import { describe, expect, it } from 'vitest'

import {
  afilmoryIds,
  afilmoryImages,
  galleryImages,
  gridRows,
} from './image-grid'

describe('galleryImages', () => {
  it('maps node.images to GridImage with src/full equal', () => {
    const node = {
      images: [
        { alt: '晴空塔', src: 'https://a/1.jpg', width: 800, height: 600 },
        { src: 'https://a/2.jpg' },
      ],
    }
    expect(galleryImages(node)).toEqual([
      {
        alt: '晴空塔',
        full: 'https://a/1.jpg',
        height: 600,
        src: 'https://a/1.jpg',
        width: 800,
      },
      {
        alt: undefined,
        full: 'https://a/2.jpg',
        height: undefined,
        src: 'https://a/2.jpg',
        width: undefined,
      },
    ])
  })

  it('drops entries without a usable src', () => {
    const node = { images: [{ alt: 'no src' }, null, 42] }
    expect(galleryImages(node)).toEqual([])
  })

  it('returns empty array when node.images is missing or malformed', () => {
    expect(galleryImages({})).toEqual([])
    expect(galleryImages({ images: 'nope' })).toEqual([])
  })
})

describe('afilmoryIds', () => {
  it('collects ids when source.kind is list', () => {
    const node = {
      source: { items: [{ id: 'A' }, { id: 'B' }], kind: 'list' },
    }
    expect(afilmoryIds(node)).toEqual(['A', 'B'])
  })

  it('returns null for non-list sources', () => {
    expect(afilmoryIds({ source: { filter: {}, kind: 'filter' } })).toBeNull()
    expect(afilmoryIds({})).toBeNull()
    expect(afilmoryIds({ source: null })).toBeNull()
  })
})

describe('afilmoryImages', () => {
  const baseUrl = 'https://innei.afilmory.art'

  it('resolves relative urls against baseUrl and carries dims/thumbhash', () => {
    const result = afilmoryImages(baseUrl, [
      {
        exif: {},
        height: 2592,
        id: 'DSCF6041',
        originalUrl: '/东京/DSCF6041.jpg',
        thumbHash: 'abcd',
        thumbnailUrl: '/.afilmory/thumbnails/DSCF6041.jpg',
        title: 'DSCF6041',
        width: 3888,
      },
    ])
    expect(result).toEqual([
      {
        alt: 'DSCF6041',
        full: 'https://innei.afilmory.art/%E4%B8%9C%E4%BA%AC/DSCF6041.jpg',
        height: 2592,
        src: 'https://innei.afilmory.art/.afilmory/thumbnails/DSCF6041.jpg',
        thumbhash: 'abcd',
        width: 3888,
      },
    ])
  })

  it('keeps absolute urls unchanged', () => {
    const result = afilmoryImages(baseUrl, [
      {
        height: 100,
        id: 'x',
        originalUrl: 'https://r2.innei.ren/x.jpg',
        thumbnailUrl: 'https://r2.innei.ren/thumb/x.jpg',
        width: 100,
      },
    ])
    expect(result[0]?.src).toBe('https://r2.innei.ren/thumb/x.jpg')
    expect(result[0]?.full).toBe('https://r2.innei.ren/x.jpg')
  })
})

describe('gridRows', () => {
  it('handles 0, 1 and 2 images', () => {
    expect(gridRows(0)).toEqual({ overflow: 0, rows: [] })
    expect(gridRows(1)).toEqual({ overflow: 0, rows: [[0]] })
    expect(gridRows(2)).toEqual({ overflow: 0, rows: [[0, 1]] })
  })

  it('lays out 3-5 images as one full row then pairs, no overflow', () => {
    expect(gridRows(3)).toEqual({ overflow: 0, rows: [[0], [1, 2]] })
    expect(gridRows(4)).toEqual({ overflow: 0, rows: [[0], [1, 2], [3]] })
    expect(gridRows(5)).toEqual({ overflow: 0, rows: [[0], [1, 2], [3, 4]] })
  })

  it('caps at 5 tiles and reports overflow beyond that', () => {
    expect(gridRows(6)).toEqual({ overflow: 1, rows: [[0], [1, 2], [3, 4]] })
    expect(gridRows(8)).toEqual({ overflow: 3, rows: [[0], [1, 2], [3, 4]] })
  })
})
