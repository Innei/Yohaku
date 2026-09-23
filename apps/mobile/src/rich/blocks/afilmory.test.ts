import { describe, expect, it } from 'vitest'

import {
  afilmorySource,
  albumTiles,
  exifLine,
  filterHref,
  masonryColumns,
  photoDetailHref,
  photoUrls,
  polaroidRatio,
  searchBody,
  summarizeSource,
} from './afilmory'

const BASE = 'https://innei.afilmory.art'

describe('afilmorySource', () => {
  it('reads a list source, keeping items with an id and dims', () => {
    expect(
      afilmorySource({
        source: {
          items: [
            { h: 4032, hash: 'abc', id: 'PhotonCam_1', w: 3024 },
            { id: 'no-dims' },
            { h: 1, w: 1 },
          ],
          kind: 'list',
        },
      }),
    ).toEqual({
      items: [
        { h: 4032, hash: 'abc', id: 'PhotonCam_1', w: 3024 },
        { h: 0, hash: undefined, id: 'no-dims', w: 0 },
      ],
      kind: 'list',
    })
  })

  it('reads a filter source', () => {
    expect(
      afilmorySource({
        source: { filter: { tags: ['tokyo'] }, kind: 'filter' },
      }),
    ).toEqual({ filter: { tags: ['tokyo'] }, kind: 'filter' })
  })

  it('returns null for a missing or empty source', () => {
    expect(afilmorySource({})).toBeNull()
    expect(afilmorySource({ source: { items: [], kind: 'list' } })).toBeNull()
    expect(afilmorySource({ source: { kind: 'other' } })).toBeNull()
  })
})

describe('exifLine', () => {
  it('joins model, focal length, aperture, shutter and ISO', () => {
    expect(
      exifLine({
        ExposureTime: 0.004,
        FNumber: 2,
        FocalLength: '23.0 mm',
        ISO: 160,
        Model: 'X100VI',
      }),
    ).toBe('X100VI · 23.0mm · ƒ/2 · 1/250s · ISO\u00A0160')
  })

  it('keeps a fractional shutter string and skips missing parts', () => {
    expect(exifLine({ ExposureTime: '1/60', ISO: 400 })).toBe(
      '1/60s · ISO\u00A0400',
    )
  })

  it('returns undefined when nothing is known', () => {
    expect(exifLine(undefined)).toBeUndefined()
    expect(exifLine({})).toBeUndefined()
  })
})

describe('polaroidRatio', () => {
  it('uses the photo ratio and caps portraits at 4:5', () => {
    expect(polaroidRatio(3888, 2592)).toBeCloseTo(1.5)
    expect(polaroidRatio(3024, 4032)).toBeCloseTo(0.8)
  })

  it('falls back to 3:2 without dims', () => {
    expect(polaroidRatio(0, 0)).toBeCloseTo(1.5)
  })
})

describe('links', () => {
  it('builds the photo detail url', () => {
    expect(photoDetailHref(`${BASE}/`, 'DSCF 1')).toBe(
      `${BASE}/photos/DSCF%201`,
    )
  })

  it('builds a filtered gallery url like web', () => {
    expect(
      filterHref(BASE, {
        cameras: ['X-T5'],
        dateFrom: '2026-05-01',
        tagMode: 'intersection',
        tags: ['tokyo', 'night'],
      }),
    ).toBe(
      `${BASE}/?tags=tokyo%2Cnight&cameras=X-T5&from=2026-05-01&tag_mode=intersection`,
    )
    expect(filterHref(BASE, {})).toBe(`${BASE}/`)
  })
})

describe('searchBody', () => {
  it('maps a filter to the search request body with a limit', () => {
    expect(
      searchBody(
        { dateFrom: '2026-05-01', tags: ['tokyo'], tagMode: 'union' },
        12,
      ),
    ).toEqual({
      from: '2026-05-01',
      limit: 12,
      tagMode: 'union',
      tags: ['tokyo'],
    })
  })
})

describe('summarizeSource', () => {
  it('counts photos for a list', () => {
    expect(summarizeSource({ items: [], kind: 'list' }, 1)).toBe('1 photo')
    expect(summarizeSource({ items: [], kind: 'list' }, 8)).toBe('8 photos')
  })

  it('appends filter facets', () => {
    expect(
      summarizeSource(
        {
          filter: {
            cameras: ['X-T5'],
            dateTo: '2026-06-30',
            tagMode: 'intersection',
            tags: ['tokyo', 'night'],
          },
          kind: 'filter',
        },
        12,
      ),
    ).toBe('12 photos · #tokyo ∧ #night · 📷 X-T5 · ∞ → 2026-06-30')
  })
})

describe('masonryColumns', () => {
  it('puts each photo into the currently shorter column', () => {
    expect(
      masonryColumns([
        { h: 3, w: 2 },
        { h: 2, w: 3 },
        { h: 2, w: 3 },
        { h: 2, w: 3 },
        { h: 4, w: 3 },
      ]),
    ).toEqual([
      [0, 4],
      [1, 2, 3],
    ])
  })
})

describe('masonryColumns without dims', () => {
  it('treats a photo without dims as square', () => {
    expect(
      masonryColumns([
        { h: 0, w: 0 },
        { h: 0, w: 0 },
      ]),
    ).toEqual([[0], [1]])
  })
})

describe('albumTiles', () => {
  const photo = {
    height: 2592,
    id: 'B',
    originalUrl: '/东京/B.jpg',
    thumbHash: 'hb',
    thumbnailUrl: '/.afilmory/thumbnails/B.jpg',
    width: 3888,
  }

  it('keeps list order and dims from the node, filling urls from photos', () => {
    expect(
      albumTiles(
        BASE,
        {
          items: [
            { h: 4, hash: 'ha', id: 'A', w: 3 },
            { h: 2, id: 'B', w: 3 },
          ],
          kind: 'list',
        },
        [photo],
      ),
    ).toEqual([
      { full: undefined, h: 4, hash: 'ha', id: 'A', thumb: undefined, w: 3 },
      {
        full: `${BASE}/%E4%B8%9C%E4%BA%AC/B.jpg`,
        h: 2,
        hash: 'hb',
        id: 'B',
        thumb: `${BASE}/.afilmory/thumbnails/B.jpg`,
        w: 3,
      },
    ])
  })

  it('uses the photos as is for a filter source, keeping absolute urls', () => {
    expect(
      albumTiles(BASE, { filter: {}, kind: 'filter' }, [
        { ...photo, originalUrl: 'https://r2.innei.ren/B.jpg' },
      ]),
    ).toEqual([
      {
        full: 'https://r2.innei.ren/B.jpg',
        h: 2592,
        hash: 'hb',
        id: 'B',
        thumb: `${BASE}/.afilmory/thumbnails/B.jpg`,
        w: 3888,
      },
    ])
  })
})

describe('photoUrls', () => {
  it('resolves thumb and full urls against the base', () => {
    expect(
      photoUrls(BASE, {
        height: 1,
        id: 'A',
        originalUrl: '/A.jpg',
        thumbnailUrl: '/t/A.jpg',
        width: 1,
      }),
    ).toEqual({ full: `${BASE}/A.jpg`, thumb: `${BASE}/t/A.jpg` })
  })

  it('leaves urls undefined when the manifest omits them', () => {
    expect(photoUrls(BASE, { height: 1, id: 'A', width: 1 } as never)).toEqual({
      full: undefined,
      thumb: undefined,
    })
    expect(photoUrls(BASE, undefined)).toEqual({
      full: undefined,
      thumb: undefined,
    })
  })
})
