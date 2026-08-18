import { describe, expect, it } from 'vitest'

import {
  categoryDisplayName,
  categoryShowsYear,
  crossCategoryCounts,
  decodeRouteParam,
  earliestPostYear,
  formatTaxonomyDate,
  postHasTag,
  sumTags,
  taxonomyYearGroups,
  visibleTaxonomyTags,
} from './taxonomy-model'

describe('postHasTag', () => {
  it('matches an exact tag name', () => {
    expect(postHasTag(['react', 'ios'], 'react')).toBe(true)
    expect(postHasTag(['react'], 'React')).toBe(false)
    expect(postHasTag([], 'react')).toBe(false)
  })
})

describe('visibleTaxonomyTags', () => {
  it('keeps at most two tags', () => {
    expect(visibleTaxonomyTags(['a', 'b', 'c'])).toEqual({
      hiddenCount: 1,
      visible: ['a', 'b'],
    })
  })
})

describe('earliestPostYear', () => {
  it('returns undefined for an empty list', () => {
    expect(earliestPostYear([])).toBeUndefined()
  })

  it('returns the minimum year', () => {
    expect(
      earliestPostYear([
        { createdAt: new Date('2024-12-01') },
        { createdAt: new Date('2019-01-01') },
      ]),
    ).toBe(2019)
  })
})

describe('categoryShowsYear', () => {
  it('hides the year for a single post or a current-year archive', () => {
    expect(categoryShowsYear(1, 2019, 2026)).toBe(false)
    expect(categoryShowsYear(4, 2026, 2026)).toBe(false)
    expect(categoryShowsYear(4, undefined, 2026)).toBe(false)
  })

  it('shows the year when count > 1 and the archive started earlier', () => {
    expect(categoryShowsYear(4, 2019, 2026)).toBe(true)
  })
})

describe('categoryDisplayName', () => {
  it('prefers the category row, then a post, then the slug', () => {
    expect(
      categoryDisplayName({ name: '编程' }, [{ categoryName: 'other' }], 'x'),
    ).toBe('编程')
    expect(categoryDisplayName(undefined, [{ categoryName: '设计' }], 'x')).toBe(
      '设计',
    )
    expect(categoryDisplayName(undefined, [{ categoryName: null }], 'coding')).toBe(
      'coding',
    )
  })
})

describe('sumTags', () => {
  it('counts across posts and sorts by count then name', () => {
    expect(
      sumTags([
        { tags: ['react', 'ios'] },
        { tags: ['react'] },
        { tags: ['sync', 'ios'] },
      ]),
    ).toEqual([
      { count: 2, name: 'ios' },
      { count: 2, name: 'react' },
      { count: 1, name: 'sync' },
    ])
  })
})

describe('crossCategoryCounts', () => {
  it('skips posts without a slug and sorts by count', () => {
    expect(
      crossCategoryCounts([
        { categoryName: '编程', categorySlug: 'coding' },
        { categoryName: '编程', categorySlug: 'coding' },
        { categoryName: '设计', categorySlug: 'design' },
        { categoryName: null, categorySlug: null },
      ]),
    ).toEqual([
      { count: 2, name: '编程', slug: 'coding' },
      { count: 1, name: '设计', slug: 'design' },
    ])
  })
})

describe('taxonomyYearGroups', () => {
  it('flattens a single-year list without grouping', () => {
    const items = [
      { createdAt: new Date('2026-08-01'), id: 'a' },
      { createdAt: new Date('2026-01-01'), id: 'b' },
    ]
    expect(taxonomyYearGroups(items)).toEqual({
      groupByYear: false,
      groups: [{ items, year: 2026 }],
    })
  })

  it('groups by year when more than one year is present', () => {
    const newer = { createdAt: new Date('2026-08-01'), id: 'a' }
    const older = { createdAt: new Date('2024-01-01'), id: 'b' }
    expect(taxonomyYearGroups([newer, older])).toEqual({
      groupByYear: true,
      groups: [
        { items: [newer], year: 2026 },
        { items: [older], year: 2024 },
      ],
    })
  })
})

describe('formatTaxonomyDate', () => {
  it('omits the year when the year head already shows it', () => {
    expect(formatTaxonomyDate(new Date(2026, 5, 3), 'zh', false)).toBe(
      '6 月 3 日',
    )
  })

  it('includes the year for a single-year list', () => {
    expect(formatTaxonomyDate(new Date(2025, 10, 2), 'zh', true)).toBe(
      '2025 年 11 月 2 日',
    )
  })
})

describe('decodeRouteParam', () => {
  it('decodes URI components and joins array params', () => {
    expect(decodeRouteParam('C%2B%2B')).toBe('C++')
    expect(decodeRouteParam(['react'])).toBe('react')
    expect(decodeRouteParam(undefined)).toBe('')
  })
})
