export type MembershipPlan = 'monthly' | 'yearly'

export type MembershipProvider =
  | 'apple'
  | 'creem'
  | 'dodo'
  | 'lemonsqueezy'
  | 'manual'
  | 'stripe'

export type MembershipStatus =
  | 'none'
  | 'active'
  | 'on_hold'
  | 'cancelled'
  | 'expired'

export interface MembershipStatusNone {
  status: 'none'
}

export interface MembershipStatusPeriod {
  currentPeriodEnd: string
  plan: MembershipPlan
  provider?: MembershipProvider
  status: Exclude<MembershipStatus, 'none'>
}

export type MembershipStatusResult =
  | MembershipStatusNone
  | MembershipStatusPeriod

export type MembershipBannerKind = 'hidden' | 'active' | 'cta'

export interface MembershipAppleIap {
  enabled: boolean
  monthlyProductId?: string
  yearlyProductId?: string
}

export interface MembershipPlansResult {
  appleIap?: MembershipAppleIap
  enabled: boolean
  plans: unknown[]
}

export type PaywallCtaKind = 'login' | 'none' | 'subscribe'

const DAY_MS = 24 * 60 * 60 * 1000

export function isActiveMembership(
  status?: MembershipStatusResult | null,
): boolean {
  return status?.status === 'active' || status?.status === 'on_hold'
}

export function isAppleManagedMembership(
  status?: MembershipStatusResult | null,
): boolean {
  return status?.status !== 'none' && status?.provider === 'apple'
}

export function remainingMembershipDays(
  endIso: string,
  now = new Date(),
): number {
  const end = Date.parse(endIso)
  if (Number.isNaN(end)) return 0
  return Math.max(0, Math.ceil((end - now.getTime()) / DAY_MS))
}

export function membershipBannerKind({
  loggedIn,
  membershipEnabled,
  status,
}: {
  loggedIn: boolean
  membershipEnabled: boolean
  status: MembershipStatusResult | undefined
}): MembershipBannerKind {
  if (!loggedIn) return 'hidden'
  if (isActiveMembership(status)) return 'active'
  if (membershipEnabled) return 'cta'
  return 'hidden'
}

export function paywallCtaKind(input: {
  appleIapEnabled: boolean
  loggedIn: boolean
  visible: boolean
}): PaywallCtaKind {
  if (!input.visible) return 'none'
  if (!input.loggedIn) return 'login'
  if (input.appleIapEnabled) return 'subscribe'
  return 'none'
}

export type InsightsTapAction = 'login' | 'open' | 'subscribe' | 'web'

export function insightsTapAction(input: {
  checkoutEnabled: boolean
  locked: boolean
  loggedIn: boolean
}): InsightsTapAction {
  if (!input.locked) return 'open'
  if (!input.loggedIn) return 'login'
  if (input.checkoutEnabled) return 'subscribe'
  return 'web'
}
