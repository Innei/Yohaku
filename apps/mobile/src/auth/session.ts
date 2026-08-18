import { api } from '@/api/client'

import { getAuthClient } from './client'
import type { SessionUser } from './session-store'
import { getSession, reduceSession, setSession } from './session-store'

function toSessionUser(raw: Awaited<ReturnType<typeof api.authSession>>) {
  if (!raw?.id) return null
  return {
    id: raw.id,
    name: raw.name ?? null,
    email: raw.email ?? null,
    image: raw.image ?? null,
    handle: raw.handle ?? null,
    role: raw.role ?? null,
    provider: raw.provider ?? null,
  } satisfies SessionUser
}

let inflight: Promise<void> | null = null

export function refreshSession(): Promise<void> {
  inflight ??= (async () => {
    try {
      const user = toSessionUser(await api.authSession())
      setSession(reduceSession(getSession(), { user }))
    } catch (error) {
      setSession(reduceSession(getSession(), { error }))
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export async function signOut(): Promise<void> {
  try {
    await getAuthClient().signOut()
  } finally {
    setSession(null)
  }
}

export async function deleteAccount(): Promise<void> {
  const client = getAuthClient() as ReturnType<typeof getAuthClient> & {
    deleteUser?: () => Promise<unknown>
  }
  if (typeof client.deleteUser !== 'function') {
    throw new Error('deleteUser unavailable')
  }
  await client.deleteUser()
  setSession(null)
}
