import { describe, expect, it, vi } from 'vitest'

import { createOtaForegroundCheck } from './foreground-check'

function flush() {
  return Promise.resolve()
}

describe('createOtaForegroundCheck', () => {
  function setup(options?: {
    enabled?: boolean
    available?: boolean
    check?: () => Promise<{ isAvailable: boolean }>
  }) {
    const appStateListeners = new Set<(state: string) => void>()
    const removeAppState = vi.fn()
    const checkForUpdate =
      options?.check ??
      vi.fn(async () => ({ isAvailable: options?.available ?? false }))
    const fetchUpdate = vi.fn(async () => ({ isNew: true }))

    const lifecycle = createOtaForegroundCheck({
      isEnabled: () => options?.enabled ?? true,
      checkForUpdate,
      fetchUpdate,
      addAppStateListener: (listener) => {
        appStateListeners.add(listener)
        return {
          remove: () => {
            appStateListeners.delete(listener)
            removeAppState()
          },
        }
      },
    })

    return {
      appStateListeners,
      checkForUpdate,
      fetchUpdate,
      removeAppState,
      lifecycle,
      emit(state: string) {
        for (const listener of appStateListeners) listener(state)
      },
    }
  }

  it('does not check on start or when returning from inactive', async () => {
    const ctx = setup()
    ctx.lifecycle.start()
    ctx.emit('inactive')
    ctx.emit('active')
    await flush()
    expect(ctx.checkForUpdate).not.toHaveBeenCalled()
  })

  it('checks after a background resume and fetches only when an update is available', async () => {
    const ctx = setup({ available: true })
    ctx.lifecycle.start()
    ctx.emit('background')
    ctx.emit('inactive')
    ctx.emit('active')
    await flush()
    expect(ctx.checkForUpdate).toHaveBeenCalledOnce()
    expect(ctx.fetchUpdate).toHaveBeenCalledOnce()
  })

  it('does not fetch when no update is available', async () => {
    const ctx = setup({ available: false })
    ctx.lifecycle.start()
    ctx.emit('background')
    ctx.emit('active')
    await flush()
    expect(ctx.checkForUpdate).toHaveBeenCalledOnce()
    expect(ctx.fetchUpdate).not.toHaveBeenCalled()
  })

  it('skips when updates are disabled', async () => {
    const ctx = setup({ enabled: false, available: true })
    ctx.lifecycle.start()
    ctx.emit('background')
    ctx.emit('active')
    await flush()
    expect(ctx.checkForUpdate).not.toHaveBeenCalled()
  })

  it('does not start a second check while one is in flight', async () => {
    let resolveCheck: (value: { isAvailable: boolean }) => void = () => {}
    const checkForUpdate = vi.fn(
      () =>
        new Promise<{ isAvailable: boolean }>((resolve) => {
          resolveCheck = resolve
        }),
    )
    const ctx = setup({ check: checkForUpdate })
    ctx.lifecycle.start()
    ctx.emit('background')
    ctx.emit('active')
    ctx.emit('background')
    ctx.emit('active')
    expect(checkForUpdate).toHaveBeenCalledOnce()
    resolveCheck({ isAvailable: false })
    await flush()
  })

  it('removes the AppState listener on stop', () => {
    const ctx = setup()
    ctx.lifecycle.start()
    ctx.lifecycle.stop()
    expect(ctx.removeAppState).toHaveBeenCalledOnce()
    ctx.emit('background')
    ctx.emit('active')
    expect(ctx.checkForUpdate).not.toHaveBeenCalled()
  })
})
