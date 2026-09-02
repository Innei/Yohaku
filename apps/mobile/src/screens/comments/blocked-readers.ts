import { useSyncExternalStore } from 'react'

let blockedReaderIds = new Set<string>()
const listeners = new Set<() => void>()

export function blockReaderLocally(readerId: string) {
  if (blockedReaderIds.has(readerId)) return
  blockedReaderIds = new Set(blockedReaderIds).add(readerId)
  for (const listener of listeners) listener()
}

export function isReaderBlocked(readerId: string): boolean {
  return blockedReaderIds.has(readerId)
}

export function useReaderBlocked(readerId?: string | null): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => Boolean(readerId && blockedReaderIds.has(readerId)),
  )
}
