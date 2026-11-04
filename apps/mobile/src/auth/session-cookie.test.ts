import { describe, expect, it } from 'vitest'

import { safeSessionCookie } from './session-cookie'

describe('safeSessionCookie', () => {
  it('returns the cookie when the store is readable', async () => {
    await expect(
      safeSessionCookie(async () => 'better-auth.session=abc'),
    ).resolves.toBe('better-auth.session=abc')
  })

  it('returns empty when Keychain rejects the read', async () => {
    await expect(
      safeSessionCookie(() => {
        throw new Error(
          "KeyChainException: A required entitlement isn't present",
        )
      }),
    ).resolves.toBe('')
  })

  it('returns empty when the asynchronous Keychain read rejects', async () => {
    await expect(
      safeSessionCookie(async () => {
        throw new Error('Keychain unavailable')
      }),
    ).resolves.toBe('')
  })
})
