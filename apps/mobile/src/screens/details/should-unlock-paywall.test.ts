import { describe, expect, it } from 'vitest'

import { shouldUnlockPaywalledContent } from './should-unlock-paywall'

describe('shouldUnlockPaywalledContent', () => {
  it('refetches when the viewer is the owner', () => {
    expect(
      shouldUnlockPaywalledContent({
        isMember: false,
        isOwner: true,
        locked: true,
      }),
    ).toBe(true)
  })

  it('refetches when the viewer is an active member', () => {
    expect(
      shouldUnlockPaywalledContent({
        isMember: true,
        isOwner: false,
        locked: true,
      }),
    ).toBe(true)
  })

  it('does not refetch a public article', () => {
    expect(
      shouldUnlockPaywalledContent({
        isMember: false,
        isOwner: true,
        locked: false,
      }),
    ).toBe(false)
  })

  it('does not refetch for an anonymous reader', () => {
    expect(
      shouldUnlockPaywalledContent({
        isMember: false,
        isOwner: false,
        locked: true,
      }),
    ).toBe(false)
  })
})
