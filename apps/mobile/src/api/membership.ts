export type MembershipPlan = 'monthly' | 'yearly'

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
  status: Exclude<MembershipStatus, 'none'>
}

export type MembershipStatusResult =
  | MembershipStatusNone
  | MembershipStatusPeriod

export type MembershipBannerKind = 'hidden' | 'active' | 'cta'

const DAY_MS = 24 * 60 * 60 * 1000

export function isActiveMembership(
  status?: MembershipStatusResult | null,
): boolean {
  return status?.status === 'active' || status?.status === 'on_hold'
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
