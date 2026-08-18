import Storage from 'expo-sqlite/kv-store'

import { readAnonymousId } from './identity'

const STORAGE_KEY = 'yohaku.socket-session'

export function getAnonymousSessionId(): string {
  const stored = readStoredId()
  const id = readAnonymousId(stored)
  if (id !== stored) {
    try {
      Storage.setItemSync(STORAGE_KEY, id)
    } catch {
      // kv-store may be unavailable on a restored backup
    }
  }
  return id
}

function readStoredId(): string | null {
  try {
    return Storage.getItemSync(STORAGE_KEY)
  } catch {
    return null
  }
}
