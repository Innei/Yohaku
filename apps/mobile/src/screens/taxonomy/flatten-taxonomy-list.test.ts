import { describe, expect, it } from 'vitest'

import {
  flattenTaxonomyList,
  TAXONOMY_CHIPS_ID,
  TAXONOMY_CHROME_ID,
  taxonomyYearItemId,
} from './flatten-taxonomy-list'

describe('flattenTaxonomyList', () => {
  const post = (id: string) => ({
    categoryName: 'Technology',
    categorySlug: 'technology',
    createdAt: new Date('2026-08-20T00:00:00Z'),
    id,
    tags: ['Electron', 'iOS', 'React Native'],
    title: `Post ${id}`,
  })

  it('keeps chrome, featured, year heads, posts, and chips', () => {
    expect(
      flattenTaxonomyList({
        featuredId: 'p1',
        groupByYear: true,
        locale: 'en',
        showChips: true,
        showCategorySource: false,
        showEmpty: false,
        groups: [
          { year: 2026, items: [post('p2')] },
          { year: 2025, items: [post('p3')] },
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
        locale: 'en',
        showChips: false,
        showCategorySource: false,
        showEmpty: true,
        groups: [{ year: 2026, items: [] }],
      }).map((item) => item.type),
    ).toEqual(['chrome', 'empty'])
    expect(
      flattenTaxonomyList({
        featuredId: null,
        groupByYear: false,
        locale: 'en',
        showChips: false,
        showCategorySource: false,
        showEmpty: false,
        groups: [{ year: 2026, items: [post('p1')] }],
      }).map((item) => [item.id, item.type]),
    ).toEqual([
      [TAXONOMY_CHROME_ID, 'chrome'],
      ['p1', 'post'],
    ])
  })

  it('fills native post cells for category and tag lists', () => {
    const categoryItem = flattenTaxonomyList({
      featuredId: null,
      groupByYear: false,
      groups: [{ year: 2026, items: [post('p1')] }],
      locale: 'en',
      showCategorySource: false,
      showChips: false,
      showEmpty: false,
    })[1]
    expect(categoryItem).toMatchObject({
      categoryName: '',
      hiddenTagCount: 1,
      tags: ['Electron', 'iOS'],
      title: 'Post p1',
    })
    expect(categoryItem.date).toEqual(expect.any(String))

    const tagItem = flattenTaxonomyList({
      featuredId: null,
      groupByYear: false,
      groups: [{ year: 2026, items: [post('p1')] }],
      locale: 'en',
      showCategorySource: true,
      showChips: false,
      showEmpty: false,
    })[1]
    expect(tagItem).toMatchObject({
      categoryName: 'Technology',
      categorySlug: 'technology',
      tags: [],
      title: 'Post p1',
    })
  })
})
