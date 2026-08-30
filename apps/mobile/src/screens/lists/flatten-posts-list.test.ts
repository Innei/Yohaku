import { describe, expect, it } from 'vitest'

import {
  articleIdsFromVisible,
  flattenPostsList,
  POST_LIST_CHROME_ID,
  POST_LIST_COUNT_ID,
  POST_LIST_FOOTER_ID,
} from './flatten-posts-list'

describe('flattenPostsList', () => {
  it('always starts with chrome and keeps featured out of rest', () => {
    expect(
      flattenPostsList({
        featuredId: 'p1',
        loadingMore: false,
        restIds: ['p2', 'p3'],
      }).map((item) => [item.id, item.type]),
    ).toEqual([
      [POST_LIST_CHROME_ID, 'chrome'],
      ['p1', 'featured'],
      [POST_LIST_COUNT_ID, 'count'],
      ['p2', 'post'],
      ['p3', 'post'],
    ])
  })

  it('appends a footer only while paging', () => {
    const items = flattenPostsList({
      featuredId: null,
      loadingMore: true,
      restIds: ['p2'],
    })
    expect(items.at(-1)).toMatchObject({
      id: POST_LIST_FOOTER_ID,
      type: 'footer',
    })
  })
})

describe('articleIdsFromVisible', () => {
  it('drops chrome and footer', () => {
    expect(
      articleIdsFromVisible([
        { id: POST_LIST_CHROME_ID, type: 'chrome' },
        { id: 'p1', type: 'featured' },
        { id: POST_LIST_COUNT_ID, type: 'count' },
        { id: 'p2', type: 'post' },
        { id: POST_LIST_FOOTER_ID, type: 'footer' },
      ]),
    ).toEqual(['p1', 'p2'])
  })
})
