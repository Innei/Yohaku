import { describe, expect, it } from 'vitest'

import {
  displaySite,
  hostFromUrl,
  parseSnapshot,
  snapshotFromAggregate,
} from './snapshot'

const sampleOwner = {
  name: 'Ada',
  avatarUrl: 'https://cdn.example.com/a.png',
  siteHost: 'example.com',
  webUrl: 'https://example.com',
  socialIds: null,
}

describe('hostFromUrl', () => {
  it('strips protocol and www', () => {
    expect(hostFromUrl('https://www.example.com/')).toBe('example.com')
    expect(hostFromUrl('example.com')).toBe('example.com')
  })

  it('returns empty for garbage', () => {
    expect(hostFromUrl('')).toBe('')
    expect(hostFromUrl('not a host')).toBe('')
  })
})

describe('displaySite', () => {
  it('uppercases the host', () => {
    expect(displaySite('example.com')).toBe('EXAMPLE.COM')
  })
})

describe('snapshotFromAggregate', () => {
  it('reads camelized aggregate fields', () => {
    expect(
      snapshotFromAggregate({
        user: {
          name: 'Ada',
          avatar: 'https://cdn.example.com/a.png',
        },
        seo: { title: 'Blog' },
        url: { webUrl: 'https://example.com' },
      }),
    ).toEqual({
      name: 'Ada',
      avatarUrl: 'https://cdn.example.com/a.png',
      siteHost: 'example.com',
      webUrl: 'https://example.com',
      socialIds: null,
    })
  })

  it('falls back to seo.title and user.image', () => {
    expect(
      snapshotFromAggregate({
        user: { image: 'https://cdn.example.com/a.png' },
        seo: { title: '余白' },
        url: { webUrl: 'https://example.com' },
      }),
    ).toEqual({
      name: '余白',
      avatarUrl: 'https://cdn.example.com/a.png',
      siteHost: 'example.com',
      webUrl: 'https://example.com',
      socialIds: null,
    })
  })

  it('rejects a payload with no usable name', () => {
    expect(
      snapshotFromAggregate({
        user: { avatar: 'https://cdn.example.com/a.png' },
        url: { webUrl: 'https://example.com' },
      }),
    ).toBeNull()
  })

  it('rejects a payload with no site', () => {
    expect(
      snapshotFromAggregate({
        user: { name: 'Ada' },
      }),
    ).toBeNull()
  })

  it('ignores a non-http avatar', () => {
    const snapshot = snapshotFromAggregate({
      user: { name: 'Ada', avatar: 'ftp://x/a.png' },
      url: { webUrl: 'https://example.com' },
    })
    expect(snapshot?.avatarUrl).toBeNull()
  })
})

describe('parseSnapshot', () => {
  it('accepts a complete snapshot', () => {
    expect(parseSnapshot(sampleOwner)).toEqual(sampleOwner)
  })

  it('rejects incomplete records', () => {
    expect(parseSnapshot({ name: 'Ada' })).toBeNull()
    expect(parseSnapshot(null)).toBeNull()
    expect(parseSnapshot('x')).toBeNull()
  })
})
