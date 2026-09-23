import { describe, expect, it } from 'vitest'

import type { SessionUser } from '@/auth/session-store'

import {
  accountAvatarUri,
  guestCardHref,
  guestCardKind,
  tabAccessibilityLabel,
} from './guest-card'

const reader: SessionUser = {
  id: '1',
  name: '阿崔',
  email: null,
  image: 'https://example.com/r.png',
  handle: 'cuix',
  role: 'reader',
  provider: 'github',
}

const owner: SessionUser = { ...reader, role: 'owner', name: 'Innei' }

const ownerFace = {
  avatarUrl: 'https://example.com/owner.png',
  name: 'Innei',
  siteHost: 'innei.in',
  webUrl: 'https://innei.in',
}

describe('guest card', () => {
  it('routes signed-out to login and others to reader', () => {
    expect(guestCardKind(null)).toBe('signedOut')
    expect(guestCardHref('signedOut')).toBe('/login')
    expect(guestCardKind(reader)).toBe('reader')
    expect(guestCardHref('reader')).toBe('/reader')
    expect(guestCardKind(owner)).toBe('owner')
    expect(guestCardHref('owner')).toBe('/reader')
  })
})

describe('accountAvatarUri', () => {
  it('prefers the session image', () => {
    expect(accountAvatarUri(reader, ownerFace)).toBe('https://example.com/r.png')
  })

  it('falls back to the owner avatar when the session has no image', () => {
    expect(accountAvatarUri({ ...reader, image: null }, ownerFace)).toBe(
      'https://example.com/owner.png',
    )
    expect(accountAvatarUri(null, ownerFace)).toBe(
      'https://example.com/owner.png',
    )
  })

  it('returns null when neither side has an image', () => {
    expect(accountAvatarUri(null, null)).toBeNull()
    expect(
      accountAvatarUri(
        { ...reader, image: null },
        { ...ownerFace, avatarUrl: null },
      ),
    ).toBeNull()
  })
})

describe('tabAccessibilityLabel', () => {
  it('prefers owner name, then host, then fallback', () => {
    expect(
      tabAccessibilityLabel({ name: 'Innei', siteHost: 'innei.in' }, '余白'),
    ).toBe('Innei')
    expect(
      tabAccessibilityLabel({ name: '', siteHost: 'innei.in' }, '余白'),
    ).toBe('innei.in')
    expect(tabAccessibilityLabel(null, '余白')).toBe('余白')
  })
})
