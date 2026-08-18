export type SocketTraceDirection = 'in' | 'out' | 'state'

export interface SocketTraceEntry {
  at: number
  dir: SocketTraceDirection
  event: string
  payload?: unknown
}

export const SOCKET_TRACE_LIMIT = 80
const SUMMARY_MAX = 180

export function summarizeSocketPayload(
  payload: unknown,
  max = SUMMARY_MAX,
): string {
  if (payload === undefined) return ''
  try {
    const json = JSON.stringify(payload)
    if (!json || json === 'undefined') return ''
    return json.length > max ? `${json.slice(0, max)}…` : json
  } catch {
    return String(payload)
  }
}

export function createSocketTrace(limit = SOCKET_TRACE_LIMIT) {
  let entries: readonly SocketTraceEntry[] = []
  const listeners = new Set<() => void>()

  const notify = () => {
    for (const listener of listeners) listener()
  }

  return {
    record(
      entry: Omit<SocketTraceEntry, 'at'> & { at?: number },
    ): SocketTraceEntry {
      const next: SocketTraceEntry = {
        at: entry.at ?? Date.now(),
        dir: entry.dir,
        event: entry.event,
        payload: entry.payload,
      }
      entries = [...entries, next].slice(-limit)
      notify()
      return next
    },
    list(): readonly SocketTraceEntry[] {
      return entries
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    summarize: summarizeSocketPayload,
    clear() {
      entries = []
      notify()
    },
  }
}

export const socketTrace = createSocketTrace()
