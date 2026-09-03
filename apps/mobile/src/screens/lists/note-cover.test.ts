import { describe, expect, it } from 'vitest'

import {
  NOTE_COVER_BLEED_BELOW_NAV,
  NOTE_LATEST_HERO_HEIGHT,
  noteCoverPinnedFrame,
  noteCoverPlaceholderUri,
  noteCoverThumbhash,
  noteCoverUrl,
  noteDetailCoverAnchorY,
  noteDetailCoverHeight,
  noteShowsCoverHero,
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

describe('noteShowsCoverHero', () => {
  it('shows the latest hero only when a cover url exists', () => {
    expect(noteShowsCoverHero({ coverUrl: 'https://cdn.example/a.jpg' })).toBe(
      true,
    )
    expect(noteShowsCoverHero({ coverUrl: null })).toBe(false)
  })
})

describe('noteCoverPinnedFrame', () => {
  it('sits on the cell at rest', () => {
    expect(noteCoverPinnedFrame(0, NOTE_LATEST_HERO_HEIGHT, 390)).toEqual({
      blurOpacity: 0,
      height: NOTE_LATEST_HERO_HEIGHT,
      width: 390,
      x: 0,
      y: 0,
    })
  })

  it('pins to the list top and grows when the cell drops', () => {
    expect(noteCoverPinnedFrame(60, NOTE_LATEST_HERO_HEIGHT, 390)).toEqual({
      blurOpacity: 1,
      height: NOTE_LATEST_HERO_HEIGHT + 60,
      width: 390,
      x: 0,
      y: 0,
    })
  })

  it('scrolls away with the cell', () => {
    expect(noteCoverPinnedFrame(-40, NOTE_LATEST_HERO_HEIGHT, 390)).toEqual({
      blurOpacity: 0,
      height: NOTE_LATEST_HERO_HEIGHT,
      width: 390,
      x: 0,
      y: -40,
    })
  })
})

describe('note detail cover slot', () => {
  it('bleeds under the nav and pins like the list hero', () => {
    expect(noteDetailCoverHeight(116)).toBe(116 + NOTE_COVER_BLEED_BELOW_NAV)
    expect(noteDetailCoverAnchorY(116)).toBe(-116)
    expect(
      noteCoverPinnedFrame(
        noteDetailCoverAnchorY(116) - -116,
        noteDetailCoverHeight(116),
        390,
      ),
    ).toMatchObject({ height: 116 + NOTE_COVER_BLEED_BELOW_NAV, y: 0 })
  })
})
