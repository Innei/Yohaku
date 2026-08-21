export function safeSessionCookie(read: () => string): string {
  try {
    return read()
  } catch {
    // Unsigned or entitlement-mismatched builds throw from Keychain.
    // Public list endpoints do not need a cookie; swallow and continue.
    return ''
  }
}
