import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { api } from '@/api/client'
import { getAuthClient } from '@/auth/client'
import { signInEmailDirect } from '@/auth/direct-auth'
import { refreshSession } from '@/auth/session'
import { getSession } from '@/auth/session-store'
import { signInSocialDirect } from '@/auth/social-flow'
import { showToast } from '@/components/ui/toast-store'
import { useTranslations } from '@/i18n'

export type LoginBusy =
  { kind: 'social'; provider: string } | { kind: 'email' } | null

export function useLogin(enabled = true) {
  const t = useTranslations('auth')
  const providersQuery = useQuery({
    enabled,
    queryFn: () => api.authProviders(),
    queryKey: ['auth', 'providers'],
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
  const providers = providersQuery.isError ? [] : providersQuery.data

  const [busy, setBusy] = useState<LoginBusy>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  const settle = async (retryAfterMs = 0) => {
    await refreshSession()
    if (getSession() !== null) return true
    if (retryAfterMs <= 0) return false
    // The cookie is written from the deep-link handler; the first session read
    // can still race the server's own session write, so give it one more pass.
    await new Promise((resolve) => setTimeout(resolve, retryAfterMs))
    await refreshSession()
    return getSession() !== null
  }

  const signInSocial = async (provider: string) => {
    if (busy) return false
    setBusy({ kind: 'social', provider })
    setLastError(null)
    try {
      // The Expo plugin drives the browser (real expo-web-browser on Android)
      // and stores the cookie it gets from the `yohaku://` redirect.
      const result = await getAuthClient().signIn.social({
        provider,
        callbackURL: '/',
      })
      const { error } = result
      if (error) throw error
      if (await settle(700)) return true
      setLastError('session-empty')
      showToast(t('socialFailed'))
      return false
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.error('[auth] social sign-in failed:', reason, error)
      setLastError(reason)
      showToast(`${t('socialUnavailable')} (${reason.slice(0, 80)})`)
      return false
    } finally {
      setBusy(null)
    }
  }

  const signInEmail = async (email: string, password: string) => {
    if (busy) return false
    setBusy({ kind: 'email' })
    try {
      // Plain fetch + `set-auth-token`, not the Expo plugin: RN hides
      // `set-cookie` on Android, which is why the plugin's signIn.email always
      // looked successful but left the app signed out.
      const result = await signInEmailDirect(email, password)
      if (!result.ok) {
        const code = result.error ?? 'unknown'
        showToast(`${t('emailFailed')} (${code.slice(0, 60)})`)
        return false
      }
      if (await settle(700)) return true
      showToast(t('emailFailed'))
      return false
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      console.error('[auth] email sign-in failed:', reason, error)
      showToast(`${t('emailFailed')} (${reason.slice(0, 60)})`)
      return false
    } finally {
      setBusy(null)
    }
  }

  return {
    providers,
    busy,
    lastError,
    signInSocial,
    signInEmail,
  }
}
