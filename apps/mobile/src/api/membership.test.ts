import { describe, expect, it } from 'vitest'

import {
  insightsTapAction,
  isActiveMembership,
  isAppleManagedMembership,
  membershipBannerKind,
  paywallCtaKind,
  remainingMembershipDays,
} from './membership'

describe('isAppleManagedMembership', () => {
  it('only delegates management for Apple-backed memberships', () => {
    const period = {
      currentPeriodEnd: '2026-09-01T00:00:00.000Z',
      plan: 'yearly' as const,
      status: 'active' as const,
    }

    expect(isAppleManagedMembership({ ...period, provider: 'apple' })).toBe(true)
    expect(isAppleManagedMembership({ ...period, provider: 'dodo' })).toBe(false)
    expect(isAppleManagedMembership(period)).toBe(false)
    expect(isAppleManagedMembership({ status: 'none' })).toBe(false)
  })
})

describe('isActiveMembership', () => {
  it('treats active and on_hold as entitled', () => {
    expect(
      isActiveMembership({
        currentPeriodEnd: '2026-09-01T00:00:00.000Z',
        plan: 'monthly',
        status: 'active',
      }),
    ).toBe(true)
    expect(
      isActiveMembership({
        currentPeriodEnd: '2026-09-01T00:00:00.000Z',
        plan: 'yearly',
        status: 'on_hold',
      }),
    ).toBe(true)
  })

  it('does not treat none, expired, or cancelled as entitled', () => {
    expect(isActiveMembership({ status: 'none' })).toBe(false)
    expect(
      isActiveMembership({
        currentPeriodEnd: '2026-08-01T00:00:00.000Z',
        plan: 'monthly',
        status: 'expired',
      }),
    ).toBe(false)
    expect(
      isActiveMembership({
        currentPeriodEnd: '2026-08-01T00:00:00.000Z',
        plan: 'monthly',
        status: 'cancelled',
      }),
    ).toBe(false)
    expect(isActiveMembership(undefined)).toBe(false)
  })
})

describe('remainingMembershipDays', () => {
  it('counts remaining days until period end', () => {
    const now = new Date('2026-08-01T00:00:00.000Z')
    expect(remainingMembershipDays('2026-08-24T00:00:00.000Z', now)).toBe(23)
  })

  it('returns 1 when less than a day remains', () => {
    const now = new Date('2026-08-24T20:00:00.000Z')
    expect(remainingMembershipDays('2026-08-24T22:00:00.000Z', now)).toBe(1)
  })

  it('returns 0 when the period has ended', () => {
    const now = new Date('2026-08-25T00:00:00.000Z')
    expect(remainingMembershipDays('2026-08-24T00:00:00.000Z', now)).toBe(0)
  })
})

describe('membershipBannerKind', () => {
  it('hides for signed-out viewers', () => {
    expect(
      membershipBannerKind({
        loggedIn: false,
        membershipEnabled: true,
        status: undefined,
      }),
    ).toBe('hidden')
  })

  it('shows the join CTA for the owner when they are not a member', () => {
    expect(
      membershipBannerKind({
        loggedIn: true,
        membershipEnabled: true,
        status: { status: 'none' },
      }),
    ).toBe('cta')
  })

  it('shows the active banner for a member', () => {
    expect(
      membershipBannerKind({
        loggedIn: true,
        membershipEnabled: true,
        status: {
          currentPeriodEnd: '2026-09-01T00:00:00.000Z',
          plan: 'yearly',
          status: 'active',
        },
      }),
    ).toBe('active')
  })

  it('shows the join CTA when membership is enabled but the reader is not a member', () => {
    expect(
      membershipBannerKind({
        loggedIn: true,
        membershipEnabled: true,
        status: { status: 'none' },
      }),
    ).toBe('cta')
  })

  it('hides when membership is disabled and the reader is not a member', () => {
    expect(
      membershipBannerKind({
        loggedIn: true,
        membershipEnabled: false,
        status: { status: 'none' },
      }),
    ).toBe('hidden')
  })
})

describe('paywallCtaKind', () => {
  it('asks signed-out readers to log in', () => {
    expect(
      paywallCtaKind({
        appleIapEnabled: true,
        loggedIn: false,
        visible: true,
      }),
    ).toBe('login')
  })

  it('offers subscribe when signed in and IAP is configured', () => {
    expect(
      paywallCtaKind({
        appleIapEnabled: true,
        loggedIn: true,
        visible: true,
      }),
    ).toBe('subscribe')
  })

  it('hides the button when IAP is not configured', () => {
    expect(
      paywallCtaKind({
        appleIapEnabled: false,
        loggedIn: true,
        visible: true,
      }),
    ).toBe('none')
  })

  it('hides everything when the gate is not visible', () => {
    expect(
      paywallCtaKind({
        appleIapEnabled: true,
        loggedIn: true,
        visible: false,
      }),
    ).toBe('none')
  })
})

describe('insightsTapAction', () => {
  it('opens Yohaku when the article is not locked', () => {
    expect(
      insightsTapAction({
        checkoutEnabled: true,
        locked: false,
        loggedIn: false,
      }),
    ).toBe('open')
  })

  it('sends signed-out readers to log in when locked', () => {
    expect(
      insightsTapAction({
        checkoutEnabled: true,
        locked: true,
        loggedIn: false,
      }),
    ).toBe('login')
  })

  it('starts checkout when locked and the reader can buy', () => {
    expect(
      insightsTapAction({
        checkoutEnabled: true,
        locked: true,
        loggedIn: true,
      }),
    ).toBe('subscribe')
  })

  it('opens the web article when locked and IAP is not configured', () => {
    expect(
      insightsTapAction({
        checkoutEnabled: false,
        locked: true,
        loggedIn: true,
      }),
    ).toBe('web')
  })
})
