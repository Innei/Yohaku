import { getSetCookie } from '@better-auth/expo/client'

import { apiBaseUrl } from '@/api/base-url'
import { setRawSessionCookie } from '@/auth/client'
import { secretStore } from '@/lib/secret-store'

/**
 * Direct Better Auth sign-in that does not depend on the Expo plugin's
 * `Set-Cookie` interception. React Native's fetch hides `set-cookie` on
 * Android, but the server exposes the same token in `set-auth-token`
 * (see `Access-Control-Expose-Headers`), which we can always read.
 */

const COOKIE_KEY = 'yohaku_cookie'
const SESSION_COOKIE_NAME = '__Secure-better-auth.session_token'
const AUTH_ORIGIN = 'yohaku://'

/** Store a verified session token as a cookie the app can send back. */
function storeSessionToken(token: string) {
  if (!token) return false
  const setCookie = `${SESSION_COOKIE_NAME}=${token}; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Lax`
  try {
    const prev = secretStore.getItem(COOKIE_KEY)
    secretStore.setItem(COOKIE_KEY, getSetCookie(setCookie, prev ?? undefined))
    setRawSessionCookie(`${SESSION_COOKIE_NAME}=${token}`)
    return true
  } catch {
    // Even if the plugin map write fails, the raw cookie is enough.
    setRawSessionCookie(`${SESSION_COOKIE_NAME}=${token}`)
    return true
  }
}

/**
 * Sign in with email/password via a plain fetch. Returns a user id on success,
 * or a specific error string. The caller refreshes the session afterwards.
 */
export async function signInEmailDirect(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${apiBaseUrl()}/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: AUTH_ORIGIN,
        'expo-origin': AUTH_ORIGIN,
        'x-skip-oauth-proxy': 'true',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok || body?.code) {
      return {
        ok: false,
        error: `${body?.code ?? `HTTP_${res.status}`}`.slice(0, 80),
      }
    }

    // `set-auth-token` is the exposed header; `set-cookie` is hidden on RN.
    const token = res.headers.get('set-auth-token') ?? ''
    // Fallback: some deployments put the signed token in the JSON body.
    const bodyToken = typeof body?.token === 'string' ? body.token : ''
    const usable = token || bodyToken
    if (!usable) {
      return { ok: false, error: 'No session token in response' }
    }
    if (!storeSessionToken(usable)) {
      return { ok: false, error: 'Could not store session' }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Build a Cookie header value from the stored token (used by getSessionCookie). */
export function tokenToCookie(token: string) {
  return `${SESSION_COOKIE_NAME}=${token}`
}
