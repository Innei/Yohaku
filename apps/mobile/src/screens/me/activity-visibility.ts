import type { SessionUser } from '@/auth/session-store'

export function showMyComments(session: SessionUser | null): boolean {
  return session !== null
}

export function showDeleteAccount(session: SessionUser | null): boolean {
  return session !== null && session.role !== 'owner'
}
