import Storage from 'expo-sqlite/kv-store'

import { site } from '@/site'

const STORAGE_KEY = 'dev.api-base-url'
const DEFAULT_URL = process.env.EXPO_PUBLIC_API_URL || site.apiUrl

// Dev mx-core serves at the bare origin; only prod prefixes /api/v3.
export const API_PRESETS = [
  { id: 'production', url: DEFAULT_URL },
  { id: 'local', url: 'http://localhost:2333' },
] as const

export type ApiPresetId = (typeof API_PRESETS)[number]['id']

function readStored(): string | null {
  try {
    return Storage.getItemSync(STORAGE_KEY)
  } catch {
    return null
  }
}

let current = __DEV__ ? (readStored() ?? DEFAULT_URL) : DEFAULT_URL

const listeners = new Set<() => void>()

export function apiBaseUrl(): string {
  return current
}

export function subscribeApiBaseUrl(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setApiBaseUrl(url: string) {
  if (current === url) return
  current = url
  try {
    if (url === DEFAULT_URL) {
      Storage.removeItemSync(STORAGE_KEY)
    } else {
      Storage.setItemSync(STORAGE_KEY, url)
    }
  } catch {
    // kv-store is best-effort; the in-memory value still updates
  }
  for (const listener of listeners) listener()
}
