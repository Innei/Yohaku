import { useSyncExternalStore } from 'react'

export type SyncStatus = 'idle' | 'syncing' | 'error'

let status: SyncStatus = 'idle'
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setSyncStatus(next: SyncStatus) {
  if (status === next) return
  status = next
  for (const listener of listeners) listener()
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribe, () => status)
}
