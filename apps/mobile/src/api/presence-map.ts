type PresenceEntry = {
  identity?: unknown
  position?: unknown
}

export function readPresenceMap(raw: unknown): Record<string, PresenceEntry> {
  const payload = unwrapData(raw)
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {}
  }
  const presence = (payload as { presence?: unknown }).presence
  if (!presence || typeof presence !== 'object' || Array.isArray(presence)) {
    return {}
  }
  return presence as Record<string, PresenceEntry>
}

function unwrapData(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
  if ('data' in raw) return (raw as { data: unknown }).data
  return raw
}
