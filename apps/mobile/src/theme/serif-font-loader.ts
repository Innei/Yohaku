export type SerifFontDownloadState = 'failed' | 'idle' | 'loading' | 'ready'

export interface SerifFontLoader {
  ensure: () => Promise<boolean>
  getSnapshot: () => SerifFontDownloadState
  subscribe: (listener: () => void) => () => void
}

export function createSerifFontLoader(
  download: () => Promise<boolean>,
): SerifFontLoader {
  let state: SerifFontDownloadState = 'idle'
  let inFlight: Promise<boolean> | null = null
  const listeners = new Set<() => void>()

  const setState = (next: SerifFontDownloadState) => {
    if (state === next) return
    state = next
    for (const listener of listeners) listener()
  }

  return {
    ensure() {
      if (state === 'ready') return Promise.resolve(true)
      if (state === 'failed') return Promise.resolve(false)
      if (inFlight) return inFlight

      inFlight = download()
        .catch(() => false)
        .then((installed) => {
          setState(installed ? 'ready' : 'failed')
          return installed
        })
        .finally(() => {
          inFlight = null
        })
      setState('loading')
      return inFlight
    },
    getSnapshot() {
      return state
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
