export type MembershipRecoveryLifecycleDeps = {
  addAppStateListener: (listener: (state: string) => void) => {
    remove: () => void
  }
  addTransactionListener: (listener: () => void) => {
    remove: () => void
  }
  clearRetryTimer: (timer: ReturnType<typeof setTimeout>) => void
  recover: () => Promise<{ needsRetry: boolean }>
  retryDelayMs: number
  setRetryTimer: (
    listener: () => void,
    delayMs: number,
  ) => ReturnType<typeof setTimeout>
}

export function createMembershipRecoveryLifecycle(
  deps: MembershipRecoveryLifecycleDeps,
) {
  let appStateSubscription: { remove: () => void } | null = null
  let transactionSubscription: { remove: () => void } | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let running = false
  let rerunRequested = false
  let started = false

  const clearRetry = () => {
    if (!retryTimer) return
    deps.clearRetryTimer(retryTimer)
    retryTimer = null
  }

  const scheduleRetry = () => {
    if (!started || retryTimer) return
    retryTimer = deps.setRetryTimer(() => {
      retryTimer = null
      requestRecovery()
    }, deps.retryDelayMs)
  }

  const requestRecovery = () => {
    if (!started) return
    clearRetry()
    if (running) {
      rerunRequested = true
      return
    }

    running = true
    void deps
      .recover()
      .then(({ needsRetry }) => {
        if (needsRetry) scheduleRetry()
      })
      .catch(scheduleRetry)
      .finally(() => {
        running = false
        if (!rerunRequested) return
        rerunRequested = false
        requestRecovery()
      })
  }

  return {
    start() {
      if (started) return
      started = true
      appStateSubscription = deps.addAppStateListener((state) => {
        if (state === 'active') requestRecovery()
      })
      transactionSubscription = deps.addTransactionListener(requestRecovery)
      requestRecovery()
    },
    stop() {
      started = false
      rerunRequested = false
      clearRetry()
      appStateSubscription?.remove()
      transactionSubscription?.remove()
      appStateSubscription = null
      transactionSubscription = null
    },
  }
}
