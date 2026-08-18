export function presenceRoomQueryKey(roomName: string) {
  return ['activity', 'presence', roomName] as const
}

export type PresenceRecord = {
  identity?: string
  position?: number
  [key: string]: unknown
}

export type PresenceMap = Record<string, PresenceRecord>

export function applyPresenceUpdate(
  room: PresenceMap,
  payload: PresenceRecord,
): PresenceMap {
  if (typeof payload.identity !== 'string' || payload.identity.length === 0) {
    return room
  }
  return { ...room, [payload.identity]: payload }
}

export function applyPresenceLeave(
  room: PresenceMap,
  identity: unknown,
): PresenceMap {
  if (typeof identity !== 'string' || !(identity in room)) return room
  const next = { ...room }
  delete next[identity]
  return next
}
