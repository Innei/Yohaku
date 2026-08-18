export const INJECTION_QUEUE_CAPACITY = 8
export const INJECTION_QUEUE_MAX_ATTEMPTS = 60

export type InjectionDropReason = 'attempts' | 'capacity'

export interface InjectionQueueOptions {
  capacity?: number
  maxAttempts?: number
  onDrop?: (reason: InjectionDropReason, script: string) => void
  schedule: (run: () => void) => void
  send: (script: string) => Promise<unknown> | null | undefined
}

export interface InjectionQueue {
  dispose: () => void
  push: (script: string) => void
  readonly size: number
}

/*
 * Expo emits `$$props` from a mount effect, but the native view is only findable
 * once Fabric has run its mount transaction on the UI thread — so the first
 * `injectJavaScript` of every mount rejects with `ViewNotFound` and the payload
 * is gone for good, since `$$props` is emitted once per change rather than
 * replayed. Retrying the head of a FIFO keeps that payload alive and keeps a
 * newer emission from overtaking an older one on its way to the page.
 */
export function createInjectionQueue({
  capacity = INJECTION_QUEUE_CAPACITY,
  maxAttempts = INJECTION_QUEUE_MAX_ATTEMPTS,
  onDrop,
  schedule,
  send,
}: InjectionQueueOptions): InjectionQueue {
  const queue: string[] = []
  let busy = false
  let disposed = false
  let attempts = 0
  // The head stays in the queue while it is being sent, so that dropping the
  // oldest entry really drops the oldest one. That lets the head change under a
  // send that is still in flight; bumping this makes the stale settlement give
  // up its claim on the queue instead of shifting off whatever took its place.
  let generation = 0

  const drop = (reason: InjectionDropReason) => {
    const dropped = queue.shift()
    generation += 1
    attempts = 0
    if (dropped !== undefined) onDrop?.(reason, dropped)
  }

  const settle = (gen: number, sent: boolean) => {
    if (disposed) return
    busy = false
    if (gen !== generation) {
      pump()
      return
    }
    if (sent) {
      queue.shift()
      attempts = 0
      pump()
      return
    }
    attempts += 1
    if (attempts >= maxAttempts) {
      drop('attempts')
      pump()
      return
    }
    schedule(pump)
  }

  function pump() {
    if (busy || disposed || queue.length === 0) return
    busy = true
    const gen = generation
    const result = send(queue[0])
    if (result == null) {
      settle(gen, false)
      return
    }
    result.then(
      () => settle(gen, true),
      () => settle(gen, false),
    )
  }

  return {
    // The retry loop cannot tell "the view has not mounted yet" from "the view
    // is gone" — both make `send` return nothing — so an unmount has to say so,
    // or every teardown burns the full attempt budget before giving up.
    dispose() {
      disposed = true
      queue.length = 0
    },
    push(script: string) {
      if (disposed) return
      queue.push(script)
      while (queue.length > capacity) {
        drop('capacity')
      }
      pump()
    },
    get size() {
      return queue.length
    },
  }
}
