import { describe, expect, it } from 'vitest'

import { IOS_AUTHORIZATION_STATUS } from './manager'
import {
  PUSH_ONBOARDING_SURFACE_SETTLE_MS,
  readPushOnboardingDecision,
  shouldOfferPushOnboarding,
  shouldPresentPushOnboardingPrompt,
  writePushOnboardingDecision,
} from './onboarding'

describe('shouldOfferPushOnboarding', () => {
  it('offers only once while permission is undetermined and push is configured', () => {
    expect(
      shouldOfferPushOnboarding({
        configured: true,
        authorizationStatus: IOS_AUTHORIZATION_STATUS.NOT_DETERMINED,
        decision: null,
      }),
    ).toBe(true)
    expect(
      shouldOfferPushOnboarding({
        configured: false,
        authorizationStatus: IOS_AUTHORIZATION_STATUS.NOT_DETERMINED,
        decision: null,
      }),
    ).toBe(false)
    expect(
      shouldOfferPushOnboarding({
        configured: true,
        authorizationStatus: IOS_AUTHORIZATION_STATUS.AUTHORIZED,
        decision: null,
      }),
    ).toBe(false)
    expect(
      shouldOfferPushOnboarding({
        configured: true,
        authorizationStatus: IOS_AUTHORIZATION_STATUS.NOT_DETERMINED,
        decision: 'dismissed',
      }),
    ).toBe(false)
  })
})

describe('shouldPresentPushOnboardingPrompt', () => {
  const offerable = {
    configured: true,
    authorizationStatus: IOS_AUTHORIZATION_STATUS.NOT_DETERMINED,
    decision: null,
  } as const

  it('waits until the splash/tab-bar entrance has settled', () => {
    expect(
      shouldPresentPushOnboardingPrompt({
        ...offerable,
        surfaceSettled: false,
      }),
    ).toBe(false)
    expect(
      shouldPresentPushOnboardingPrompt({
        ...offerable,
        surfaceSettled: true,
      }),
    ).toBe(true)
  })

  it('still respects an existing decision after the surface settles', () => {
    expect(
      shouldPresentPushOnboardingPrompt({
        configured: true,
        authorizationStatus: IOS_AUTHORIZATION_STATUS.NOT_DETERMINED,
        decision: 'dismissed',
        surfaceSettled: true,
      }),
    ).toBe(false)
  })

  it('waits a few seconds after splash before presenting the prompt', () => {
    expect(PUSH_ONBOARDING_SURFACE_SETTLE_MS).toBeGreaterThanOrEqual(2500)
  })
})

describe('push onboarding decision storage', () => {
  it('persists accepted and dismissed decisions', async () => {
    const box = new Map<string, string>()
    const storage = {
      getItem: async (key: string) => box.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        box.set(key, value)
      },
    }
    expect(await readPushOnboardingDecision(storage)).toBeNull()
    await writePushOnboardingDecision(storage, 'accepted')
    expect(await readPushOnboardingDecision(storage)).toBe('accepted')
    await writePushOnboardingDecision(storage, 'dismissed')
    expect(await readPushOnboardingDecision(storage)).toBe('dismissed')
  })
})
