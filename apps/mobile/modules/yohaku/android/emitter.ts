import type { EventSubscription } from 'expo-modules-core'

type Listener = (payload: any) => void

export interface Emitter {
  addListener: (event: string, listener: Listener) => EventSubscription
  emit: (event: string, payload?: any) => void
}

/**
 * Minimal replacement for the native Expo module event emitter. The Android
 * port runs the TTS/player glue in JS, so events originate here instead of
 * from a Swift module.
 */
export function createEmitter(): Emitter {
  const listeners = new Map<string, Set<Listener>>()
  return {
    addListener(event, listener) {
      let set = listeners.get(event)
      if (!set) {
        set = new Set()
        listeners.set(event, set)
      }
      set.add(listener)
      return {
        remove() {
          set.delete(listener)
        },
      }
    },
    emit(event, payload) {
      const set = listeners.get(event)
      if (!set) return
      for (const listener of [...set]) {
        try {
          listener(payload)
        } catch {
          // A throwing listener must not break playback bookkeeping.
        }
      }
    },
  }
}
