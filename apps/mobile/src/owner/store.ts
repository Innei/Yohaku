import Storage from 'expo-sqlite/kv-store'
import { useSyncExternalStore } from 'react'

import { hydrateSiteFromOwner } from '@/lib/site-url'
import { site } from '@/site'

import { type OwnerSnapshot, parseSnapshot } from './snapshot'

const STORAGE_KEY = 'yohaku.owner'

const listeners = new Set<() => void>()

function readInitial(): OwnerSnapshot | null {
  try {
    const stored = Storage.getItemSync(STORAGE_KEY)
    const parsed = stored ? parseSnapshot(JSON.parse(stored)) : null
    if (parsed) return parsed
  } catch {
    // kv-store may be unavailable on a restored backup; fall through
  }
  return site.bundledOwner
}

let owner: OwnerSnapshot | null = readInitial()
if (owner) hydrateSiteFromOwner(owner.webUrl, owner.siteHost)

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getOwner(): OwnerSnapshot | null {
  return owner
}

export function setOwner(next: OwnerSnapshot) {
  if (owner && sameOwner(owner, next)) return
  owner = next
  hydrateSiteFromOwner(next.webUrl, next.siteHost)
  try {
    Storage.setItemSync(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // cache is best-effort; an unwritable store must not block the splash
  }
  for (const listener of listeners) listener()
}

export function useOwner(): OwnerSnapshot | null {
  return useSyncExternalStore(subscribe, getOwner)
}

function sameOwner(a: OwnerSnapshot, b: OwnerSnapshot): boolean {
  return (
    a.name === b.name &&
    a.avatarUrl === b.avatarUrl &&
    a.siteHost === b.siteHost &&
    a.webUrl === b.webUrl &&
    JSON.stringify(a.socialIds ?? null) === JSON.stringify(b.socialIds ?? null)
  )
}
