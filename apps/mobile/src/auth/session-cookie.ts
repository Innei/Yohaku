export async function safeSessionCookie(
  read: () => string | Promise<string>,
): Promise<string> {
  try {
    return await read()
  } catch {
    // Unsigned or entitlement-mismatched builds throw from Keychain.
    // Public list endpoints do not need a cookie; swallow and continue.
    return ''
  }
}
