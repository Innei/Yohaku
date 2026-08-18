import { describe, expect, it } from 'vitest'

import { hasProviderIcon, providerIconSvg } from './provider-icon-svg'

describe('providerIconSvg', () => {
  it('paints Google with the official four brand colors', () => {
    const svg = providerIconSvg('google', '#f0f0f0')
    expect(svg).toContain('#4285F4')
    expect(svg).toContain('#34A853')
    expect(svg).toContain('#FBBC05')
    expect(svg).toContain('#EA4335')
    expect(svg).not.toContain('#f0f0f0')
  })

  it('fills GitHub and Apple with the given ink', () => {
    expect(providerIconSvg('github', '#141312')).toContain('fill="#141312"')
    expect(providerIconSvg('apple', '#f8f8f8')).toContain('fill="#f8f8f8"')
  })

  it('returns null for unknown providers', () => {
    expect(providerIconSvg('credential', '#fff')).toBeNull()
    expect(hasProviderIcon('credential')).toBe(false)
    expect(hasProviderIcon('google')).toBe(true)
  })
})
