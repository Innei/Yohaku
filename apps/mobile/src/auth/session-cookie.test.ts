import { describe, expect, it } from 'vitest'

import { safeSessionCookie } from './session-cookie'

describe('safeSessionCookie', () => {
  it('returns the cookie when the store is readable', () => {
    expect(safeSessionCookie(() => 'better-auth.session=abc')).toBe(
      'better-auth.session=abc',
    )
  })

  it('returns empty when Keychain rejects the read', () => {
    expect(
      safeSessionCookie(() => {
        throw new Error("KeyChainException: A required entitlement isn't present")
      }),
    ).toBe('')
  })
})
