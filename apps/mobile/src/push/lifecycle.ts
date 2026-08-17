import type { DevicePushTokenLike } from './manager'

export const FOREGROUND_NOTIFICATION_BEHAVIOR = {
  shouldPlaySound: true,
  shouldSetBadge: false,
  shouldShowBanner: true,
  shouldShowList: true,
} as const

export type PushLifecycleDeps = {
  addAppStateListener: (listener: (state: string) => void) => {
    remove: () => void
  }
  addPushTokenListener: (listener: (token: DevicePushTokenLike) => void) => {
    remove: () => void
  }
  isConfigured: () => boolean
  refreshPushState: () => Promise<void>
  resetForApiBaseUrlSwitch: () => void
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<typeof FOREGROUND_NOTIFICATION_BEHAVIOR>
  }) => void
  subscribeApiBaseUrl: (listener: () => void) => () => void
  updateRelayToken: (apnsToken: string) => Promise<void>
}

export function createPushLifecycle(deps: PushLifecycleDeps) {
  let appState: { remove: () => void } | null = null
  let token: { remove: () => void } | null = null
  let unsubscribeBaseUrl: (() => void) | null = null
  let started = false

  function refreshIfAvailable() {
    if (!deps.isConfigured()) return
    void deps.refreshPushState()
  }

  return {
    start() {
      if (started) return
      started = true
      deps.setNotificationHandler({
        handleNotification: async () => FOREGROUND_NOTIFICATION_BEHAVIOR,
      })
      refreshIfAvailable()
      appState = deps.addAppStateListener((state) => {
        if (state === 'active') refreshIfAvailable()
      })
      token = deps.addPushTokenListener((deviceToken) => {
        if (
          deviceToken.type !== 'ios' ||
          typeof deviceToken.data !== 'string'
        ) {
          return
        }
        void deps.updateRelayToken(deviceToken.data)
      })
      unsubscribeBaseUrl = deps.subscribeApiBaseUrl(() => {
        // The previous API origin is already replaced when this fires.
        deps.resetForApiBaseUrlSwitch()
        refreshIfAvailable()
      })
    },
    stop() {
      started = false
      appState?.remove()
      token?.remove()
      unsubscribeBaseUrl?.()
      appState = null
      token = null
      unsubscribeBaseUrl = null
    },
  }
}
