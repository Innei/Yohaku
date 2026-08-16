const ALPHABET = '1234567890abcdefghijklmnopqrstuvwxyz'
const ANON_ID = /^[\da-z]{8}$/

export function createAnonymousId(): string {
  let out = ''
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

export function readAnonymousId(stored: string | null): string {
  if (stored && ANON_ID.test(stored)) return stored
  return createAnonymousId()
}

export function resolvePresenceVisitor({
  anonymousId,
  deviceName,
  session,
}: {
  anonymousId: string
  deviceName: string
  session: { id: string; name: string | null; role: string | null } | null
}): {
  displayName?: string
  identity: string
  readerId?: string
} {
  if (session) {
    const displayName = clipDisplayName(session.name)
    const identity =
      session.role === 'owner'
        ? `owner_${session.id}`.toLowerCase()
        : session.id.toLowerCase()
    return {
      identity,
      readerId: session.id,
      ...(displayName ? { displayName } : null),
    }
  }

  const displayName = clipDisplayName(deviceName)
  return {
    identity: anonymousId.toLowerCase(),
    ...(displayName ? { displayName } : null),
  }
}

function clipDisplayName(value: string | null): string | undefined {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return undefined
  return trimmed.slice(0, 50)
}
