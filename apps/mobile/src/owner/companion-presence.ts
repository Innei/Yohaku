export const liveDeskQueryKey = ['companion', 'presence', 'public'] as const

export function liveDeskQueryDataFromSocket(
  raw: unknown,
): { state: unknown } | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const record = raw as Record<string, unknown>
  if ('state' in record && !('projection' in record)) {
    return { state: record.state }
  }
  return { state: raw }
}
