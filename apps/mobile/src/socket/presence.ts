export function articleRoomName(id: string): string {
  return `article-${id}`
}

export function shouldJoinPresenceRoom(
  articleId: string | undefined | null,
  openOnWeb: boolean,
): articleId is string {
  return Boolean(articleId) && !openOnWeb
}

export function buildUpdatePresenceBody({
  displayName,
  identity,
  position,
  readerId,
  roomName,
  sid,
  ts,
}: {
  displayName?: string
  identity: string
  position: number
  readerId?: string
  roomName: string
  sid: string
  ts: number
}) {
  return {
    identity,
    position,
    roomName,
    sid,
    ts,
    ...(displayName ? { displayName } : null),
    ...(readerId ? { readerId } : null),
  }
}
