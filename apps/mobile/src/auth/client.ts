import { expoClient } from '@better-auth/expo/client'
import { createAuthClient } from 'better-auth/react'

import { apiBaseUrl } from '@/api/base-url'
import { secretStore } from '@/lib/secret-store'
import { site } from '@/site'

import { safeSessionCookie } from './session-cookie'

type AuthClient = ReturnType<typeof buildClient>

const AUTH_SCHEME = site.scheme
const AUTH_ORIGIN = `${AUTH_SCHEME}://`
const RAW_COOKIE_KEY = 'yohaku_cookie_raw'

function buildClient(baseURL: string) {
  const plugin = expoClient({
    scheme: AUTH_SCHEME,
    storagePrefix: 'yohaku',
    storage: secretStore,
  })

  return createAuthClient({
    baseURL,
    // Native fetch can send an Origin header directly. This also makes
    // cookie-bearing requests pass Better Auth's CSRF origin validation when
    // the server-side Expo hook cannot promote `expo-origin` early enough.
    fetchOptions: { headers: { origin: AUTH_ORIGIN }, timeout: 15_000 },
    plugins: [plugin],
  })
}

let cached: { baseURL: string; client: AuthClient } | null = null

// The API base URL can swap at runtime without reloading the app, so
// the client is memoized per baseURL instead of created once at module scope.
export function getAuthClient(): AuthClient {
  const baseURL = `${apiBaseUrl()}/auth`
  if (cached?.baseURL !== baseURL) {
    cached = { baseURL, client: buildClient(baseURL) }
  }
  return cached.client
}

export async function getSessionCookie(): Promise<string> {
  // Both sign-in paths write the plugin's cookie map (`yohaku_cookie`): social
  // through the Expo plugin, email through direct-auth's getSetCookie. Reading
  // the map first lets the plugin's fresh write win; the raw value is a fallback
  // for builds where the plugin map is unavailable (Android hides set-cookie, so
  // the raw cookie is the only thing a manual sign-in can store).
  const fromClient = await safeSessionCookie(() =>
    getAuthClient().getCookie(),
  )
  if (fromClient) return fromClient
  return safeSessionCookie(() => secretStore.getItem(RAW_COOKIE_KEY) ?? '')
}

export function setRawSessionCookie(cookie: string) {
  secretStore.setItem(RAW_COOKIE_KEY, cookie)
}

export function clearRawSessionCookie() {
  secretStore.deleteItem(RAW_COOKIE_KEY)
}
