import { describe, expect, it } from 'vitest'

import {
  noteCoverPlaceholderUri,
  noteCoverThumbhash,
  noteCoverUrl,
} from './note-cover'

const SAMPLE_THUMBHASH = '1QcSHQRnh493V4dIh4eXh1h4kJUI'

describe('noteCoverUrl', () => {
  it('returns a non-empty cover', () => {
    expect(noteCoverUrl({ coverUrl: 'https://cdn.example/a.jpg' })).toBe(
      'https://cdn.example/a.jpg',
    )
  })

  it('treats empty and missing covers as absent', () => {
    expect(noteCoverUrl({ coverUrl: null })).toBeNull()
    expect(noteCoverUrl({ coverUrl: '' })).toBeNull()
    expect(noteCoverUrl({})).toBeNull()
  })
})

describe('noteCoverThumbhash', () => {
  it('matches the cover url against images[].src', () => {
    expect(
      noteCoverThumbhash('https://cdn.example/a.jpg', [
        { src: 'https://cdn.example/other.jpg', thumbhash: 'nope' },
        { src: 'https://cdn.example/a.jpg', thumbhash: SAMPLE_THUMBHASH },
      ]),
    ).toBe(SAMPLE_THUMBHASH)
  })

  it('is absent when the cover or hash is missing', () => {
    expect(
      noteCoverThumbhash(null, [
        { src: 'https://cdn.example/a.jpg', thumbhash: SAMPLE_THUMBHASH },
      ]),
    ).toBeNull()
    expect(noteCoverThumbhash('https://cdn.example/a.jpg', [])).toBeNull()
    expect(
      noteCoverThumbhash('https://cdn.example/a.jpg', [
        { src: 'https://cdn.example/a.jpg' },
      ]),
    ).toBeNull()
  })
})

describe('noteCoverPlaceholderUri', () => {
  it('decodes a thumbhash to a data url', () => {
    expect(noteCoverPlaceholderUri(SAMPLE_THUMBHASH)).toMatch(
      /^data:image\/png;base64,/,
    )
  })

  it('returns null for empty or invalid hashes', () => {
    expect(noteCoverPlaceholderUri(null)).toBeNull()
    expect(noteCoverPlaceholderUri('')).toBeNull()
    expect(noteCoverPlaceholderUri('%%%')).toBeNull()
  })
})
