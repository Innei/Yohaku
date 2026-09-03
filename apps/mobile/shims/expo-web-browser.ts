import { YohakuNative } from '../modules/yohaku'

export function openAuthSessionAsync(url: string, redirectUrl?: string | null) {
  const scheme = redirectUrl ? new URL(redirectUrl).protocol.slice(0, -1) : ''
  return YohakuNative.openAuthSession(url, scheme)
}

export function dismissAuthSession() {
  return YohakuNative.dismissAuthSession()
}
