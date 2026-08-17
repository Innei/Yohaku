import { describe, expect, it } from 'vitest'

import { IOS_AUTHORIZATION_STATUS } from './manager'
import {
  readPushOnboardingDecision,
  shouldOfferPushOnboarding,
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
