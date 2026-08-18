import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { AppState } from 'react-native'

import { subscribeApiBaseUrl } from '@/api/base-url'

import { loadPushConfig } from './config'
import { createPushLifecycle } from './lifecycle'
import { getPushController } from './runtime'

export function usePushLifecycle(sessionId: string | undefined) {
  useEffect(() => {
    const controller = getPushController()
    const lifecycle = createPushLifecycle({
      isConfigured: () => loadPushConfig().configured,
      refreshPushState: () => controller.refreshPushState(),
      resetForApiBaseUrlSwitch: () => controller.resetForApiBaseUrlSwitch(),
      updateRelayToken: (token) => controller.updateRelayToken(token),
      setNotificationHandler: (handler) => {
        Notifications.setNotificationHandler({
          handleNotification: async () => handler.handleNotification(),
        })
      },
      addAppStateListener: (listener) =>
        AppState.addEventListener('change', listener),
      addPushTokenListener: (listener) =>
        Notifications.addPushTokenListener(listener),
      subscribeApiBaseUrl,
    })
    lifecycle.start()
    return () => lifecycle.stop()
  }, [])

  useEffect(() => {
    void getPushController().refreshReaderAssociation()
  }, [sessionId])
}
