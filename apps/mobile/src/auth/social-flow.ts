import { getSetCookie } from '@better-auth/expo/client'
import { AppState, Linking } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import { setRawSessionCookie } from '@/auth/client'
import { secretStore } from '@/lib/secret-store'

/**
 * Standalone social sign-in. `@better-auth/expo`'s browser plugin is not used
 * because it dynamically imports expo-web-browser, which fails on Android with
 * "Cannot find module". This implementation only needs `Linking`:
 *
 * 1. POST /auth/sign-in/social → provider authorize URL
 * 2. Open the expo-authorization-proxy URL in the system browser
 * 3. A global listener (installed at app start) receives the yohaku:// redirect,
 *    validates `?cookie=` against /auth/session, and persists it.
 */

const COOKIE_KEY = 'yohaku_cookie'
export const REDIRECT_SCHEME = 'yohaku://'

type RedirectHandler = (result: { ok: boolean; error?: string }) => void
let pending: RedirectHandler | null = null
let globalListener: { remove(): void } | null = null
let appStateSub: { remove(): void } | null = null
let lastHandledUrl = ''

/** Install once at app startup so a cold-start deep link is never missed. */
export function installSocialRedirectListener() {
  if (globalListener) return
  const process = (url: string) => {
    if (!url.startsWith(REDIRECT_SCHEME) || url === lastHandledUrl) return
    lastHandledUrl = url
    void handleRedirect(url).then((result) => {
      pending?.(result)
      pending = null
    })
  }
  globalListener = Linking.addEventListener('url', ({ url }) => process(url))
  // A singleTask Activity reused from the browser does not always re-emit the
  // Linking 'url' event; re-read the launch URL on every foreground resume.
  appStateSub = AppState.addEventListener('change', (state) => {
    if (state !== 'active') return
    void Linking.getInitialURL().then((url) => {
      if (url) process(url)
    })
  })
  void Linking.getInitialURL().then((url) => {
    if (url) process(url)
  })
}

export async function signInSocialDirect(
  provider: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${apiBaseUrl()}/auth/sign-in/social`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: REDIRECT_SCHEME,
        'expo-origin': REDIRECT_SCHEME,
        'x-skip-oauth-proxy': 'true',
      },
      body: JSON.stringify({
        provider,
        callbackURL: `${REDIRECT_SCHEME}/`,
        disableRedirect: true,
      }),
    })
    const data = await res.json()
    if (!data?.url) {
      return { ok: false, error: `Server returned no auth URL (${res.status})` }
    }

    const proxyUrl = `${apiBaseUrl()}/auth/expo-authorization-proxy?authorizationURL=${encodeURIComponent(data.url)}`

    const result = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
      pending = resolve
      // Open the browser. If it fails, fail fast; a successful OAuth always
      // returns through the deep link handled by the global listener.
      Linking.openURL(proxyUrl).catch(() => {
        pending = null
        resolve({ ok: false, error: 'Could not open browser' })
      })
      setTimeout(() => {
        if (pending === resolve) {
          pending = null
          resolve({ ok: false, error: 'Sign-in timed out' })
        }
      }, 300_000)
    })
    return result
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Handle a yohaku:///?cookie=… redirect, independent of who opened the browser. */
export async function handleRedirect(
  redirectUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  // Persist synchronously, BEFORE any await. The browser callback is a trusted
  // server redirect; a hanging validation fetch must never strand the cookie.
  let cookieHeader: string | null = null
  try {
    const q = redirectUrl.indexOf('cookie=')
    cookieHeader = q >= 0
      ? decodeURIComponent(redirectUrl.slice(q + 7).replace(/\+/g, ' ').split('&')[0])
      : null
  } catch {
    cookieHeader = null
  }
  if (!cookieHeader) return { ok: false, error: 'No session cookie in redirect' }

  const rawCookie = toRequestCookie(cookieHeader)
  if (!rawCookie) return { ok: false, error: `Unparseable cookie (${cookieHeader.length}B)` }

  try {
    const prev = secretStore.getItem(COOKIE_KEY)
    secretStore.setItem(COOKIE_KEY, getSetCookie(cookieHeader, prev ?? undefined))
    setRawSessionCookie(rawCookie)
  } catch (e) {
    return { ok: false, error: `Store failed: ${String(e)}` }
  }
  // Refresh the UI session immediately with the new cookie.
  void import('@/auth/session')
    .then((m) => m.refreshSession())
    .catch((e) => console.log('[social] refresh failed', String(e)))

  return { ok: true }
}

/** Set-Cookie header → Cookie request header (`a=1; b=2`). */
function toRequestCookie(header: string): string {
  return header
    .split(/,(?=\s*[^;=]+=)/)
    .map((segment) => segment.split(';')[0].trim())
    .filter((pair) => pair.includes('='))
    .join('; ')
}
