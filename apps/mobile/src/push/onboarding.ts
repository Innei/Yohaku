import { IOS_AUTHORIZATION_STATUS } from './manager'

export const PUSH_ONBOARDING_STORAGE_KEY = 'yohaku.push-onboarding-decision'

export type PushOnboardingDecision = 'accepted' | 'dismissed'

export type OnboardingStorage = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
}

export function shouldOfferPushOnboarding(input: {
  authorizationStatus: number | null
  configured: boolean
  decision: PushOnboardingDecision | null
}): boolean {
  return (
    input.configured &&
    input.decision == null &&
    input.authorizationStatus === IOS_AUTHORIZATION_STATUS.NOT_DETERMINED
  )
}

/**
 * After splash unmounts, wait before presenting `UIAlertController`.
 * The compact tab bar's 0.82 `sublayerTransform` is still settling in
 * that window; a prompt here freezes the bar at the unscaled system size.
 */
export const PUSH_ONBOARDING_SURFACE_SETTLE_MS = 2500

export function shouldPresentPushOnboardingPrompt(input: {
  authorizationStatus: number | null
  configured: boolean
  decision: PushOnboardingDecision | null
  surfaceSettled: boolean
}): boolean {
  return (
    input.surfaceSettled &&
    shouldOfferPushOnboarding({
      authorizationStatus: input.authorizationStatus,
      configured: input.configured,
      decision: input.decision,
    })
  )
}

export async function readPushOnboardingDecision(
  storage: OnboardingStorage,
): Promise<PushOnboardingDecision | null> {
  try {
    const raw = await storage.getItem(PUSH_ONBOARDING_STORAGE_KEY)
    if (raw === 'accepted' || raw === 'dismissed') return raw
    return null
  } catch {
    return null
  }
}

export async function writePushOnboardingDecision(
  storage: OnboardingStorage,
  decision: PushOnboardingDecision,
): Promise<void> {
  await storage.setItem(PUSH_ONBOARDING_STORAGE_KEY, decision)
}
