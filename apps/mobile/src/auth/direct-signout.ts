import { apiBaseUrl } from '@/api/base-url'
import { clearRawSessionCookie, getSessionCookie } from '@/auth/client'
import { secretStore } from '@/lib/secret-store'

/**
 * Sign-out without the Better Auth client.
 *
 * The client's `signOut()` round-trips through the plugin's cookie handling,
 * which can fail (and leave the UI signed in) when the stored cookie is stale
 * or was written by the direct email path. A plain DELETE plus a local wipe is
 * deterministic.
 */

const COOKIE_KEY = 'yohaku_cookie'
const SESSION_CACHE_KEY = 'yohaku_session_data'

export async function signOutDirect(): Promise<void> {
  const cookie = getSessionCookie()
  try {
    if (cookie) {
      await fetch(`${apiBaseUrl()}/auth/sign-out`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          cookie,
          origin: 'yohaku://',
          'x-skip-oauth-proxy': 'true',
        },
        body: JSON.stringify({}),
      })
    }
  } catch {
    // A failed server call must not keep the user signed in locally.
  } finally {
    // Wipe every local trace of the session, including the plugin's map.
    try {
      secretStore.deleteItem(COOKIE_KEY)
      secretStore.deleteItem(SESSION_CACHE_KEY)
    } catch {
      // best effort
    }
    clearRawSessionCookie()
  }
}
