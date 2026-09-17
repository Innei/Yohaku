import { describe, expect, it } from 'vitest'

import type { SessionUser } from '@/auth/session-store'

import { showReaderHero, tabAccessibilityLabel } from './guest-card'

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

describe('reader identity', () => {
  it('hides the reader portrait for the owner', () => {
    expect(showReaderHero(null)).toBe(true)
    expect(showReaderHero(reader)).toBe(true)
    expect(showReaderHero(owner)).toBe(false)
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
