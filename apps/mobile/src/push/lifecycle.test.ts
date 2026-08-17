import { describe, expect, it, vi } from 'vitest'

import {
  createPushLifecycle,
  FOREGROUND_NOTIFICATION_BEHAVIOR,
} from './lifecycle'
import type { DevicePushTokenLike } from './manager'

const TOKEN = 'cd'.repeat(32)

describe('FOREGROUND_NOTIFICATION_BEHAVIOR', () => {
  it('shows banner, list, and sound, and does not set the badge', () => {
    expect(FOREGROUND_NOTIFICATION_BEHAVIOR).toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    })
  })
})

describe('createPushLifecycle', () => {
  function setup() {
    const appStateListeners = new Set<(state: string) => void>()
    const tokenListeners = new Set<(token: DevicePushTokenLike) => void>()
    const baseUrlListeners = new Set<() => void>()
    const refreshPushState = vi.fn(async () => {})
    const resetForApiBaseUrlSwitch = vi.fn()
    const updateRelayToken = vi.fn(async (_token: string) => {})
    const getDevicePushToken = vi.fn(async () => {
      throw new Error('getDevicePushTokenAsync must not run in the listener')
    })
    const setNotificationHandler = vi.fn()
    const removeAppState = vi.fn()
    const removeToken = vi.fn()
    const removeBaseUrl = vi.fn()

    const lifecycle = createPushLifecycle({
      isConfigured: () => true,
      refreshPushState,
      resetForApiBaseUrlSwitch,
      updateRelayToken,
      setNotificationHandler,
      addAppStateListener: (listener) => {
        appStateListeners.add(listener)
        return {
          remove: () => {
            appStateListeners.delete(listener)
            removeAppState()
          },
        }
      },
      addPushTokenListener: (listener) => {
        tokenListeners.add(listener)
        return {
          remove: () => {
            tokenListeners.delete(listener)
            removeToken()
          },
        }
      },
      subscribeApiBaseUrl: (listener) => {
        baseUrlListeners.add(listener)
        return () => {
          baseUrlListeners.delete(listener)
          removeBaseUrl()
        }
      },
    })

    return {
      appStateListeners,
      tokenListeners,
      baseUrlListeners,
      refreshPushState,
      resetForApiBaseUrlSwitch,
      updateRelayToken,
      getDevicePushToken,
      setNotificationHandler,
      removeAppState,
      removeToken,
      removeBaseUrl,
      lifecycle,
    }
  }

  it('installs the foreground handler and refreshes when push is configured', async () => {
    const ctx = setup()
    ctx.lifecycle.start()
    expect(ctx.setNotificationHandler).toHaveBeenCalledWith({
      handleNotification: expect.any(Function),
    })
    const handler = ctx.setNotificationHandler.mock.calls[0]![0] as {
      handleNotification: () => Promise<unknown>
    }
    await expect(handler.handleNotification()).resolves.toEqual(
      FOREGROUND_NOTIFICATION_BEHAVIOR,
    )
    expect(ctx.refreshPushState).toHaveBeenCalledOnce()
  })

  it('refreshes when the app becomes active', () => {
    const ctx = setup()
    ctx.lifecycle.start()
    ctx.refreshPushState.mockClear()
    for (const listener of ctx.appStateListeners) listener('active')
    expect(ctx.refreshPushState).toHaveBeenCalledOnce()
    for (const listener of ctx.appStateListeners) listener('background')
    expect(ctx.refreshPushState).toHaveBeenCalledOnce()
  })

  it('updates the relay from the token listener without fetching a device token', async () => {
    const ctx = setup()
    ctx.lifecycle.start()
    for (const listener of ctx.tokenListeners) {
      await listener({ type: 'ios', data: TOKEN })
    }
    expect(ctx.updateRelayToken).toHaveBeenCalledWith(TOKEN)
    expect(ctx.getDevicePushToken).not.toHaveBeenCalled()
  })

  it('resets push state on API base URL switch and does not treat the old binding as active', () => {
    const ctx = setup()
    ctx.lifecycle.start()
    for (const listener of ctx.baseUrlListeners) listener()
    expect(ctx.resetForApiBaseUrlSwitch).toHaveBeenCalledOnce()
    expect(ctx.refreshPushState).toHaveBeenCalledTimes(2)
  })

  it('removes listeners on stop', () => {
    const ctx = setup()
    ctx.lifecycle.start()
    ctx.lifecycle.stop()
    expect(ctx.removeAppState).toHaveBeenCalledOnce()
    expect(ctx.removeToken).toHaveBeenCalledOnce()
    expect(ctx.removeBaseUrl).toHaveBeenCalledOnce()
  })
})
