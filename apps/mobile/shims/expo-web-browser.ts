import { AppState, Linking, Platform } from 'react-native'

/**
 * `expo-web-browser` shim.
 *
 * The iOS app replaces the auth browser with YohakuKit (ASWebAuthentication-
 * Session) because the native host owns the cookie hand-off. On Android the
 * module used to relay `yohaku:///?cookie=…` through a native AuthRelay; that
 * Kotlin module is gone, and expo-web-browser's own `openAuthSessionAsync`
 * resolves with `dismiss` before the deep link lands.
 *
 * This shim keeps the whole flow in JS: open the URL with `Linking.openURL`,
 * listen for the app's scheme, and hand the full redirect URL back to
 * better-auth. It has no dependency on the real package, so the auth path
 * cannot fail with "Cannot find module".
 */

type AuthSessionResult =
  | { type: 'success'; url: string }
  | { type: 'cancel' | 'dismiss' | 'locked' }

export const WebBrowserPresentationStyle = {
  AUTOMATIC: 'automatic',
  FULL_SCREEN: 0,
  PAGE_SHEET: 1,
  FORM_SHEET: 2,
  CURRENT_CONTEXT: 3,
  OVER_FULL_SCREEN: 4,
  OVER_PAGE_SHEET: 5,
} as const

export const WebBrowserResultType = {
  CANCEL: 'cancel',
  DISMISS: 'dismiss',
  LOCKED: 'locked',
  SUCCESS: 'success',
  OPENED: 'opened',
} as const

export function maybeCompleteAuthSession() {
  return { type: 'success' as const }
}

export function warmUpAsync() {
  return Promise.resolve()
}

export function coolDownAsync() {
  return Promise.resolve()
}

export function dismissBrowser() {
  return Promise.resolve()
}

export function dismissAuthSession() {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { YohakuNative } = require('../modules/yohaku')
    return YohakuNative.dismissAuthSession()
  }
  return Promise.resolve()
}

export async function openBrowserAsync(url: string, _options?: unknown) {
  await Linking.openURL(url)
  return { type: 'opened' as const }
}

export function openAuthSessionAsync(
  url: string,
  redirectUrl?: string | null,
): Promise<AuthSessionResult> | unknown {
  if (Platform.OS === 'ios') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { YohakuNative } = require('../modules/yohaku')
    const scheme = redirectUrl ? new URL(redirectUrl).protocol.slice(0, -1) : ''
    return YohakuNative.openAuthSession(url, scheme)
  }
  return androidAuthSession(url, redirectUrl)
}

function androidAuthSession(
  url: string,
  redirectUrl?: string | null,
): Promise<AuthSessionResult> {
  const scheme = redirectUrl ? redirectUrl.split('://')[0] : ''
  const matches = (incoming: string) =>
    scheme ? incoming.startsWith(`${scheme}://`) : true

  return new Promise<AuthSessionResult>((resolve) => {
    let settled = false
    let subscription: { remove: () => void } | null = null
    let appStateSub: { remove: () => void } | null = null

    const finish = (value: AuthSessionResult) => {
      if (settled) return
      settled = true
      subscription?.remove()
      appStateSub?.remove()
      subscription = null
      appStateSub = null
      resolve(value)
    }

    const accept = (incoming: string) => {
      if (matches(incoming)) finish({ type: 'success', url: incoming })
    }

    subscription = Linking.addEventListener('url', (event) => accept(event.url))
    // A singleTask Activity resumed by the browser does not always re-emit the
    // Linking 'url' event; re-check the launch URL when the app comes forward.
    appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return
      void Linking.getInitialURL().then((url) => { if (url) accept(url) })
    })
    void Linking.getInitialURL().then((url) => { if (url) accept(url) })

    void Linking.openURL(url).catch(() => finish({ type: 'dismiss' }))

    // A redirect opens the app and leaves the browser behind; there is no
    // reliable "tab closed" signal when we are not driving a Custom Tab, so a
    // long timeout only exists to avoid hanging forever.
    setTimeout(() => finish({ type: 'cancel' }), 5 * 60 * 1000)
  })
}
