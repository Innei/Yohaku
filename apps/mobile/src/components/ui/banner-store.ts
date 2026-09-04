import { useSyncExternalStore } from 'react'

export type BannerAction = {
  onPress: () => void
  title: string
}

export type Banner = {
  action?: BannerAction
  id: number
  message?: string
  title: string
}

const listeners = new Set<() => void>()

let banner: Banner | null = null
let nextId = 1

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getBanner(): Banner | null {
  return banner
}

export function dismissBanner() {
  if (banner === null) return
  banner = null
  emit()
}

export function showBanner(next: Omit<Banner, 'id'>) {
  banner = { id: nextId, ...next }
  nextId += 1
  emit()
}

export function useBanner(): Banner | null {
  return useSyncExternalStore(subscribe, getBanner)
}
