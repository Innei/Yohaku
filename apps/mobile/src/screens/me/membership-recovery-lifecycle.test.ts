import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createMembershipRecoveryLifecycle } from './membership-recovery-lifecycle'

describe('createMembershipRecoveryLifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('recovers on launch, StoreKit updates, and foreground entry', async () => {
    let appStateListener: ((state: string) => void) | undefined
    let transactionListener: (() => void) | undefined
    const recover = vi.fn().mockResolvedValue({ needsRetry: false })
    const lifecycle = createMembershipRecoveryLifecycle({
      addAppStateListener: (listener) => {
        appStateListener = listener
        return { remove: vi.fn() }
      },
      addTransactionListener: (listener) => {
        transactionListener = listener
        return { remove: vi.fn() }
      },
      clearRetryTimer: clearTimeout,
      recover,
      retryDelayMs: 30_000,
      setRetryTimer: setTimeout,
    })

    lifecycle.start()
    await vi.waitFor(() => expect(recover).toHaveBeenCalledTimes(1))
    transactionListener?.()
    await vi.waitFor(() => expect(recover).toHaveBeenCalledTimes(2))
    appStateListener?.('background')
    expect(recover).toHaveBeenCalledTimes(2)
    appStateListener?.('active')
    await vi.waitFor(() => expect(recover).toHaveBeenCalledTimes(3))

    lifecycle.stop()
  })

  it('automatically retries unfinished delivery after a transient failure', async () => {
    const recover = vi
      .fn()
      .mockResolvedValueOnce({ needsRetry: true })
      .mockResolvedValueOnce({ needsRetry: false })
    const lifecycle = createMembershipRecoveryLifecycle({
      addAppStateListener: () => ({ remove: vi.fn() }),
      addTransactionListener: () => ({ remove: vi.fn() }),
      clearRetryTimer: clearTimeout,
      recover,
      retryDelayMs: 30_000,
      setRetryTimer: setTimeout,
    })

    lifecycle.start()
    await vi.waitFor(() => expect(recover).toHaveBeenCalledTimes(1))
    await vi.advanceTimersByTimeAsync(30_000)
    expect(recover).toHaveBeenCalledTimes(2)

    lifecycle.stop()
  })

  it('removes listeners and cancels scheduled recovery when stopped', async () => {
    const removeAppState = vi.fn()
    const removeTransaction = vi.fn()
    const recover = vi.fn().mockResolvedValue({ needsRetry: true })
    const lifecycle = createMembershipRecoveryLifecycle({
      addAppStateListener: () => ({ remove: removeAppState }),
      addTransactionListener: () => ({ remove: removeTransaction }),
      clearRetryTimer: clearTimeout,
      recover,
      retryDelayMs: 30_000,
      setRetryTimer: setTimeout,
    })

    lifecycle.start()
    await vi.waitFor(() => expect(recover).toHaveBeenCalledTimes(1))
    lifecycle.stop()
    await vi.advanceTimersByTimeAsync(30_000)

    expect(recover).toHaveBeenCalledTimes(1)
    expect(removeAppState).toHaveBeenCalledOnce()
    expect(removeTransaction).toHaveBeenCalledOnce()
  })
})
