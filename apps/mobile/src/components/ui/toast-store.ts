import { useSyncExternalStore } from 'react'

export const TOAST_DISMISS_MS = 1800

export type Toast = {
  id: number
  message: string
}

const listeners = new Set<() => void>()

let toast: Toast | null = null
let nextId = 1
let timer: ReturnType<typeof setTimeout> | null = null

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function clearTimer() {
  if (timer === null) return
  clearTimeout(timer)
  timer = null
}

export function getToast(): Toast | null {
  return toast
}

export function dismissToast() {
  clearTimer()
  if (toast === null) return
  toast = null
  emit()
}

export function showToast(message: string) {
  clearTimer()
  toast = { id: nextId, message }
  nextId += 1
  timer = setTimeout(dismissToast, TOAST_DISMISS_MS)
  emit()
}

export function useToast(): Toast | null {
  return useSyncExternalStore(subscribe, getToast)
}
