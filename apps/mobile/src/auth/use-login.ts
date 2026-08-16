import { useEffect, useState } from 'react'

import { api } from '@/api/client'
import { getAuthClient } from '@/auth/client'
import { refreshSession } from '@/auth/session'
import { getSession } from '@/auth/session-store'

export type LoginBusy =
  { kind: 'social'; provider: string } | { kind: 'email' } | null

export function useLogin() {
  const [providers, setProviders] = useState<string[] | null>(null)
  useEffect(() => {
    let alive = true
    api
      .authProviders()
      .then((list) => {
        if (alive) setProviders(list)
      })
      .catch(() => {
        if (alive) setProviders([])
      })
    return () => {
      alive = false
    }
  }, [])

  const [busy, setBusy] = useState<LoginBusy>(null)

  const settle = async () => {
    await refreshSession()
    return getSession() !== null
  }

  const signInSocial = async (provider: string) => {
    if (busy) return false
    setBusy({ kind: 'social', provider })
    try {
      await getAuthClient().signIn.social({
        provider,
        callbackURL: '/',
      })
      return await settle()
    } finally {
      setBusy(null)
    }
  }

  const signInEmail = async (email: string, password: string) => {
    if (busy) return false
    setBusy({ kind: 'email' })
    try {
      const { error } = await getAuthClient().signIn.email({ email, password })
      if (error) return false
      return await settle()
    } catch {
      return false
    } finally {
      setBusy(null)
    }
  }

  return {
    providers,
    busy,
    signInSocial,
    signInEmail,
  }
}
