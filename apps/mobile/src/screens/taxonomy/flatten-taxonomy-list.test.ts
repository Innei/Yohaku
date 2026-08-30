import { describe, expect, it } from 'vitest'

import {
  flattenTaxonomyList,
  TAXONOMY_CHIPS_ID,
  TAXONOMY_CHROME_ID,
  TAXONOMY_EMPTY_ID,
  taxonomyYearItemId,
} from './flatten-taxonomy-list'

describe('flattenTaxonomyList', () => {
  it('keeps chrome, featured, year heads, posts, and chips', () => {
    expect(
      flattenTaxonomyList({
        featuredId: 'p1',
        groupByYear: true,
        showChips: true,
        showEmpty: false,
        groups: [
          { year: 2026, items: [{ id: 'p2' }] },
          { year: 2025, items: [{ id: 'p3' }] },
        ],
      }).map((item) => [item.id, item.type]),
    ).toEqual([
      [TAXONOMY_CHROME_ID, 'chrome'],
      ['p1', 'featured'],
      [taxonomyYearItemId(2026), 'year'],
      ['p2', 'post'],
      [taxonomyYearItemId(2025), 'year'],
      ['p3', 'post'],
      [TAXONOMY_CHIPS_ID, 'chips'],
    ])
  })

  it('skips year heads when the list is a single year', () => {
    expect(
      flattenTaxonomyList({
        featuredId: null,
        groupByYear: false,
        showChips: false,
        showEmpty: true,
        groups: [{ year: 2026, items: [] }],
      }).map((item) => item.type),
    ).toEqual(['chrome', 'empty'])
    expect(
      flattenTaxonomyList({
        featuredId: null,
        groupByYear: false,
        showChips: false,
        showEmpty: false,
        groups: [{ year: 2026, items: [{ id: 'p1' }] }],
      }).map((item) => [item.id, item.type]),
    ).toEqual([
      [TAXONOMY_CHROME_ID, 'chrome'],
      ['p1', 'post'],
    ])
  })
})
