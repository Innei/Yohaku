import type { SessionUser } from '@/auth/session-store'

export type GuestCardKind = 'signedOut' | 'reader' | 'owner'

export function guestCardKind(session: SessionUser | null): GuestCardKind {
  if (!session) return 'signedOut'
  if (session.role === 'owner') return 'owner'
  return 'reader'
}

export function guestCardHref(kind: GuestCardKind): '/login' | '/reader' {
  return kind === 'signedOut' ? '/login' : '/reader'
}

export function showReaderHero(session: SessionUser | null): boolean {
  return session?.role !== 'owner'
}

export function tabAccessibilityLabel(
  owner: { name: string; siteHost: string } | null,
  fallback: string,
): string {
  const name = owner?.name.trim() ?? ''
  if (name) return name
  const host = owner?.siteHost.trim() ?? ''
  if (host) return host
  return fallback
}
