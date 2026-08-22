import { fetch } from 'expo/fetch'
import * as Notifications from 'expo-notifications'
import { useSyncExternalStore } from 'react'

import { api } from '@/api/client'
import { refreshSession } from '@/auth/session'
import { getSession } from '@/auth/session-store'
import { secretStoreAsync } from '@/lib/secret-store'

import { loadPushConfig } from './config'
import { createCredentialStore } from './credentials'
import { createPushController } from './manager'
import { createRelayClient } from './relay-client'
import type { PushConfig } from './types'

function readConfig(): PushConfig {
  return loadPushConfig()
}

const unconfiguredRelay = {
  registerInstallation: async () => {
    throw new Error('Push is not configured')
  },
  updateInstallationToken: async () => {
    throw new Error('Push is not configured')
  },
  createActivationTicket: async () => {
    throw new Error('Push is not configured')
  },
  getBinding: async () => {
    throw new Error('Push is not configured')
  },
  updateBindingPreferences: async () => {
    throw new Error('Push is not configured')
  },
  revokeBinding: async () => {
    throw new Error('Push is not configured')
  },
}

function createProductionRelay() {
  const config = readConfig()
  if (!config.configured) return unconfiguredRelay
  return createRelayClient({
    origin: config.relayUrl,
    fetch,
  })
}

export function createProductionPushController() {
  return createPushController({
    config: readConfig,
    session: {
      refresh: refreshSession,
      get: getSession,
    },
    permissions: {
      get: () => Notifications.getPermissionsAsync(),
      request: () =>
        Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: false,
            allowSound: true,
          },
        }),
    },
    token: {
      getDevicePushToken: () => Notifications.getDevicePushTokenAsync(),
    },
    relay: createProductionRelay(),
    credentials: createCredentialStore(secretStoreAsync),
    api: {
      pushActivate: api.pushActivate,
    },
  })
}

let controller: ReturnType<typeof createPushController> | null = null

export function getPushController() {
  controller ??= createProductionPushController()
  return controller
}

export function enablePush() {
  return getPushController().enablePush()
}

export function disablePush() {
  return getPushController().disablePush()
}

export function updatePushPreferences(
  patch: Parameters<
    ReturnType<typeof createPushController>['updatePushPreferences']
  >[0],
) {
  return getPushController().updatePushPreferences(patch)
}

export function refreshPushState() {
  return getPushController().refreshPushState()
}

export function refreshReaderAssociation() {
  return getPushController().refreshReaderAssociation()
}

export function usePushState() {
  const current = getPushController()
  return useSyncExternalStore(current.subscribe, current.getState)
}
