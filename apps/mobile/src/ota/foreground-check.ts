export type OtaForegroundCheckDeps = {
  addAppStateListener: (listener: (state: string) => void) => {
    remove: () => void
  }
  checkForUpdate: () => Promise<{ isAvailable: boolean }>
  fetchUpdate: () => Promise<unknown>
  isEnabled: () => boolean
}

export function createOtaForegroundCheck(deps: OtaForegroundCheckDeps) {
  let appState: { remove: () => void } | null = null
  let inFlight = false
  let seenBackground = false
  let started = false

  async function checkAfterBackground() {
    if (!deps.isEnabled() || inFlight) return
    inFlight = true
    try {
      const result = await deps.checkForUpdate()
      if (result.isAvailable) await deps.fetchUpdate()
    } catch {
      // Foreground checks must not surface; the next cold start still retries.
    } finally {
      inFlight = false
    }
  }

  return {
    start() {
      if (started) return
      started = true
      appState = deps.addAppStateListener((state) => {
        if (state === 'background') {
          seenBackground = true
          return
        }
        if (state === 'active' && seenBackground) {
          seenBackground = false
          void checkAfterBackground()
        }
      })
    },
    stop() {
      started = false
      seenBackground = false
      appState?.remove()
      appState = null
    },
  }
}
