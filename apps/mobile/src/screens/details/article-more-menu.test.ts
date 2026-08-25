import { describe, expect, it } from 'vitest'

import { groupMenuItemsByCategory } from './article-more-menu'

describe('groupMenuItemsByCategory', () => {
  it('drops hidden items then splits on category changes', () => {
    expect(
      groupMenuItemsByCategory([
        { category: 'article', hidden: true, id: 'listen' },
        { category: 'article', id: 'prompt' },
        { category: 'article', id: 'toc' },
        { category: 'share', id: 'share' },
        { category: 'share', id: 'copy-link' },
      ]),
    ).toEqual([
      [
        { category: 'article', id: 'prompt' },
        { category: 'article', id: 'toc' },
      ],
      [
        { category: 'share', id: 'share' },
        { category: 'share', id: 'copy-link' },
      ],
    ])
  })

  it('keeps a single group when every visible item shares a category', () => {
    expect(
      groupMenuItemsByCategory([
        { category: 'share', id: 'share' },
        { category: 'share', hidden: true, id: 'copy-link' },
        { category: 'share', id: 'open' },
      ]),
    ).toEqual([
      [
        { category: 'share', id: 'share' },
        { category: 'share', id: 'open' },
      ],
    ])
  })
})
