export interface FatalErrorSnapshot {
  message: string
  stack: string | null
}

let snapshot: FatalErrorSnapshot | null = null
const listeners = new Set<() => void>()
let recoveryHostCount = 0

function normalizeFatalError(error: unknown): FatalErrorSnapshot {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack ?? null }
  }

  return { message: String(error), stack: null }
}

export function captureFatalError(error: unknown): boolean {
  if (recoveryHostCount === 0 || snapshot) return false
  snapshot = normalizeFatalError(error)
  for (const listener of listeners) listener()
  return true
}

export function registerFatalErrorHost() {
  recoveryHostCount += 1
  return () => {
    recoveryHostCount = Math.max(0, recoveryHostCount - 1)
  }
}

export function clearFatalError() {
  if (!snapshot) return
  snapshot = null
  for (const listener of listeners) listener()
}

export function getFatalErrorSnapshot(): FatalErrorSnapshot | null {
  return snapshot
}

export function subscribeFatalError(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
