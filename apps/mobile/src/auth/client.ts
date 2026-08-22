import { expoClient } from '@better-auth/expo/client'
import { createAuthClient } from 'better-auth/react'

import { apiBaseUrl } from '@/api/base-url'
import { secretStore } from '@/lib/secret-store'
import { site } from '@/site'

import { safeSessionCookie } from './session-cookie'

type AuthClient = ReturnType<typeof buildClient>

type ExpoClientPlugin = ReturnType<typeof expoClient>

const AUTH_SCHEME = site.scheme
const AUTH_ORIGIN = `${AUTH_SCHEME}://`

function buildClient(baseURL: string) {
  // better-auth 1.6.24+ ships a BetterFetch generic regression that makes the
  // expo plugin's getActions fail the BetterAuthClientPlugin contract at type
  // level (better-auth/better-auth#10515); runtime is unaffected. Widening
  // only getActions' parameters keeps the rest of the plugin type intact so
  // getCookie and route inference survive.
  const plugin = expoClient({
    scheme: AUTH_SCHEME,
    storagePrefix: 'yohaku',
    storage: secretStore,
  }) as Omit<ExpoClientPlugin, 'getActions'> & {
    getActions: (...args: any[]) => ReturnType<ExpoClientPlugin['getActions']>
  }

  return createAuthClient({
    baseURL,
    // Native fetch can send an Origin header directly. This also makes
    // cookie-bearing requests pass Better Auth's CSRF origin validation when
    // the server-side Expo hook cannot promote `expo-origin` early enough.
    fetchOptions: { headers: { origin: AUTH_ORIGIN } },
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

export function getSessionCookie(): string {
  return safeSessionCookie(() => getAuthClient().getCookie())
}
