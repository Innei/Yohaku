import type { SessionUser } from '@/auth/session-store'

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
