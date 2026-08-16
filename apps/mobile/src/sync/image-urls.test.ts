import { describe, expect, it } from 'vitest'

import { extractImageUrls } from './image-urls'

describe('extractImageUrls', () => {
  it('reads src and url fields from lexical JSON', () => {
    const content = JSON.stringify({
      root: {
        children: [
          { type: 'image', src: 'https://cdn.example/a.jpg' },
          {
            type: 'link',
            url: 'https://example.com/post',
            children: [{ text: 'x' }],
          },
        ],
      },
    })
    expect(extractImageUrls({ content })).toEqual(['https://cdn.example/a.jpg'])
  })

  it('reads markdown images and skips bare links', () => {
    expect(
      extractImageUrls({
        text: 'see ![cover](https://cdn.example/b.png) and https://example.com',
      }),
    ).toEqual(['https://cdn.example/b.png'])
  })

  it('reads enrichment images', () => {
    expect(
      extractImageUrls({
        enrichments: {
          e1: {
            title: 'film',
            url: 'https://example.com/x',
            image: { url: 'https://cdn.example/full.jpg' },
            thumbnailImage: { url: 'https://cdn.example/thumb.jpg' },
          },
        },
      }),
    ).toEqual(['https://cdn.example/full.jpg', 'https://cdn.example/thumb.jpg'])
  })
})
