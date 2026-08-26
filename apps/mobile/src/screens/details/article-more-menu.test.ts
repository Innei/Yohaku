import { describe, expect, it } from 'vitest'

import {
  buildArticleMoreItems,
  groupMenuItemsByCategory,
} from './article-more-menu'

describe('buildArticleMoreItems', () => {
  it('puts print in the share group and hides it when printing is unavailable', () => {
    const visible = buildArticleMoreItems({
      copyLink: '复制链接',
      listenAvailable: false,
      listening: false,
      narrate: '朗读',
      openInBrowser: '在网页中打开',
      print: '打印',
      printAvailable: true,
      share: '分享',
      toc: '目录',
      tocAvailable: false,
    })
    expect(visible.find((item) => item.id === 'print')).toMatchObject({
      category: 'share',
      hidden: false,
      icon: 'printer',
    })
    expect(
      buildArticleMoreItems({
        copyLink: '复制链接',
        listenAvailable: false,
        listening: false,
        narrate: '朗读',
        openInBrowser: '在网页中打开',
        print: '打印',
        printAvailable: false,
        share: '分享',
        toc: '目录',
        tocAvailable: false,
      }).find((item) => item.id === 'print')?.hidden,
    ).toBe(true)
  })
})


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
