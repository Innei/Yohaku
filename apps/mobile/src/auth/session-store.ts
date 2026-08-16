import { useSyncExternalStore } from 'react'

import { ApiError } from '@/api/errors'

export interface SessionUser {
  email: string | null
  handle: string | null
  id: string
  image: string | null
  name: string | null
  provider: string | null
  role: string | null
}

let session: SessionUser | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setSession(next: SessionUser | null) {
  if (session === next) return
  session = next
  for (const listener of listeners) listener()
}

export function getSession(): SessionUser | null {
  return session
}

export function useSession(): SessionUser | null {
  return useSyncExternalStore(subscribe, () => session)
}

// A transient failure (offline, timeout, 5xx) must not log the user out; only
// a definitive answer — fresh payload, null session, or 401 — changes state.
export function reduceSession(
  current: SessionUser | null,
  outcome: { user: SessionUser | null } | { error: unknown },
): SessionUser | null {
  if ('user' in outcome) return outcome.user
  if (outcome.error instanceof ApiError && outcome.error.status === 401) {
    return null
  }
  return current
}
