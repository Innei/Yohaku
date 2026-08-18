const safeSegment = (raw: string) => {
  if (!raw || /[#?\\]/.test(raw)) return false
  try {
    const decoded = decodeURIComponent(raw)
    for (const char of decoded) {
      const code = char.charCodeAt(0)
      if (code <= 0x1F || code === 0x7F) return false
    }
    return (
      decoded !== '.' &&
      decoded !== '..' &&
      !decoded.includes('/') &&
      !decoded.includes('\\')
    )
  } catch {
    return false
  }
}

export const notificationTargetPath = (data: unknown): string | null => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const path = (data as Record<string, unknown>).target_path
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.length > 512 ||
    path.includes('?') ||
    path.includes('#')
  ) {
    return null
  }

  const segments = path.slice(1).split('/')
  if (!segments.every(safeSegment)) return null

  if (segments[0] === 'posts' && segments.length === 3) return path
  if (
    segments[0] === 'notes' &&
    segments.length === 2 &&
    /^\d+$/.test(segments[1]!)
  ) {
    return path
  }
  if (
    (segments[0] === 'thinking' || segments[0] === 'comments') &&
    segments.length === 2 &&
    /^[\w-]{1,128}$/.test(segments[1]!)
  ) {
    return path
  }
  return null
}

export const createNotificationResponseHandler = (
  navigate: (path: string) => void,
) => {
  const handledIdentifiers = new Set<string>()

  return (response: unknown) => {
    if (!response || typeof response !== 'object') return false
    const notification = (response as Record<string, unknown>).notification
    if (!notification || typeof notification !== 'object') return false
    const request = (notification as Record<string, unknown>).request
    if (!request || typeof request !== 'object') return false
    const requestRecord = request as Record<string, unknown>
    const identifier =
      typeof requestRecord.identifier === 'string'
        ? requestRecord.identifier
        : null
    if (identifier && handledIdentifiers.has(identifier)) return false
    const content = requestRecord.content
    if (!content || typeof content !== 'object') return false
    const target = notificationTargetPath(
      (content as Record<string, unknown>).data,
    )
    if (!target) return false

    if (identifier) handledIdentifiers.add(identifier)
    navigate(target)
    return true
  }
}
