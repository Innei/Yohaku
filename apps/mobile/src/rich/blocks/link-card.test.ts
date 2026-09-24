import { describe, expect, it } from 'vitest'

import { linkCardModel } from './link-card'

const REPO_URL = 'https://github.com/Innei/lody-ios'

describe('linkCardModel', () => {
  it('builds a repo card from enrichment attributes', () => {
    const model = linkCardModel(
      REPO_URL,
      {
        title: 'Innei/lody-ios',
        url: REPO_URL,
        category: 'github',
        subtype: 'repo',
        publishedAt: '2026-09-05T18:37:43Z',
        attributes: [
          { key: 'stars', value: 1460, label: 'Stars', format: 'number' },
          { key: 'forks', value: 13, label: 'Forks', format: 'number' },
          { key: 'language', value: 'Swift', label: 'Language' },
          { key: 'license', value: 'NOASSERTION', label: 'License' },
        ],
        thumbnailImage: { url: 'https://avatars.example/a.png' },
        previewImage: { url: 'https://og.example/a.png' },
      },
      {},
    )
    expect(model).toMatchObject({
      host: 'github.com',
      label: '仓库',
      symbol: 'chevron.left.forwardslash.chevron.right',
      image: 'https://avatars.example/a.png',
      imageShape: 'thumb',
    })
    expect(model.meta).toEqual([
      { symbol: 'star', text: '1.5k' },
      { symbol: 'arrow.triangle.branch', text: '13' },
      { dot: '#ffac45', text: 'Swift' },
    ])
  })

  it('uses a leading poster and year for media', () => {
    const model = linkCardModel(
      'https://www.themoviedb.org/movie/872585',
      {
        title: 'Oppenheimer',
        url: 'https://www.themoviedb.org/movie/872585',
        category: 'media',
        subtype: 'movie',
        publishedAt: '2023-07-19',
        attributes: [
          { key: 'rating', value: 8.1, label: 'Rating' },
          { key: 'genres', value: 'Drama, History', label: 'Genres' },
        ],
        previewImage: { url: 'https://img.example/poster.jpg' },
      },
      {},
    )
    expect(model).toMatchObject({
      host: 'themoviedb.org',
      label: '电影 · 2023',
      imageShape: 'poster',
      image: 'https://img.example/poster.jpg',
      meta: [
        { symbol: 'star.fill', text: '8.1' },
        { text: 'Drama' },
      ],
    })
  })

  it('tones issue state and keeps it first', () => {
    const model = linkCardModel(
      'https://github.com/a/b/issues/1',
      {
        title: 'Bug',
        url: 'https://github.com/a/b/issues/1',
        category: 'github',
        subtype: 'issue',
        attributes: [
          { key: 'comments', value: 4, label: 'Comments' },
          { key: 'state', value: 'closed', label: 'State' },
        ],
      },
      {},
    )
    expect(model.meta).toEqual([
      { text: 'closed', tone: 'error' },
      { symbol: 'bubble.left', text: '4' },
    ])
  })

  it('falls back to node fields without an enrichment', () => {
    expect(
      linkCardModel('https://example.com/x', undefined, { title: '' }),
    ).toMatchObject({
      host: 'example.com',
      label: null,
      meta: [],
      symbol: 'globe',
      title: 'https://example.com/x',
    })
  })
})
