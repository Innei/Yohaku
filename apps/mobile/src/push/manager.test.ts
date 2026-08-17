import { describe, expect, it, vi } from 'vitest'

import { createPushController } from './manager'
import { RelayError } from './relay-client'
import type { PushConfig, PushInstallationCredential } from './types'
import { DEFAULT_PUSH_PREFERENCES } from './types'

const TOKEN = 'ab'.repeat(32)
const TICKET = {
  ticket: 't'.repeat(32),
  expires_at: '2026-08-17T12:00:00.000Z',
}
const CREDENTIAL: PushInstallationCredential = {
  relayUrl: 'https://push.example.com',
  appId: 'yohaku',
  installationId: 'ins_1',
  installationSecret: 's'.repeat(32),
  bindingId: 'bind_1',
}

const CONFIG: Extract<PushConfig, { configured: true }> = {
  configured: true,
  relayUrl: 'https://push.example.com',
  appId: 'yohaku',
  environment: 'development',
}

const IOS_AUTHORIZED = 2
const IOS_DENIED = 1
const IOS_NOT_DETERMINED = 0
const IOS_PROVISIONAL = 3
const IOS_EPHEMERAL = 4

function permission(status: number) {
  return { ios: { status } }
}

function deviceToken(data = TOKEN) {
  return { type: 'ios' as const, data }
}

function relayBinding(preferences = DEFAULT_PUSH_PREFERENCES) {
  return { preferences }
}

function createFakes(overrides: Record<string, unknown> = {}) {
  const credentialBox: { value: PushInstallationCredential | null } = {
    value: null,
  }
  const fakes = {
    config: CONFIG as PushConfig,
    refreshSession: vi.fn(async () => {}),
    getSession: vi.fn(() => null as { id: string } | null),
    getPermissions: vi.fn(async () => permission(IOS_AUTHORIZED)),
    requestPermissions: vi.fn(async () => permission(IOS_AUTHORIZED)),
    getDevicePushToken: vi.fn(async () => deviceToken()),
    registerInstallation: vi.fn(async () => ({
      installation_id: CREDENTIAL.installationId,
      installation_secret: CREDENTIAL.installationSecret,
    })),
    updateInstallationToken: vi.fn(async () => {}),
    createActivationTicket: vi.fn(async () => TICKET),
    getBinding: vi.fn(async () => relayBinding()),
    revokeBinding: vi.fn(async () => {}),
    updateBindingPreferences: vi.fn(async () => ({
      ...DEFAULT_PUSH_PREFERENCES,
      contentPost: false,
    })),
    readCredential: vi.fn(async () => credentialBox.value),
    writeCredential: vi.fn(async (value: PushInstallationCredential) => {
      credentialBox.value = value
    }),
    clearCredential: vi.fn(async () => {
      credentialBox.value = null
    }),
    pushActivate: vi.fn(async () => ({
      enabled: true as const,
      relayUrl: CONFIG.relayUrl,
      bindingId: 'bind_1',
    })),
    ...overrides,
  }
  const controller = createPushController({
    config: () => fakes.config,
    session: {
      refresh: fakes.refreshSession,
      get: fakes.getSession,
    },
    permissions: {
      get: fakes.getPermissions,
      request: fakes.requestPermissions,
    },
    token: { getDevicePushToken: fakes.getDevicePushToken },
    relay: {
      registerInstallation: fakes.registerInstallation,
      updateInstallationToken: fakes.updateInstallationToken,
      createActivationTicket: fakes.createActivationTicket,
      getBinding: fakes.getBinding,
      revokeBinding: fakes.revokeBinding,
      updateBindingPreferences: fakes.updateBindingPreferences,
    },
    credentials: {
      read: fakes.readCredential,
      write: fakes.writeCredential,
      clear: fakes.clearCredential,
    },
    api: {
      pushActivate: fakes.pushActivate,
    },
  })
  return { controller, fakes, credentialBox }
}

describe('createPushController enablePush', () => {
  it('registers a new installation, activates, and loads relay preferences', async () => {
    const { controller, fakes } = createFakes()
    await controller.enablePush()
    expect(fakes.requestPermissions).not.toHaveBeenCalled()
    expect(fakes.registerInstallation).toHaveBeenCalledWith({
      app_id: 'yohaku',
      apns_environment: 'development',
      apns_token: TOKEN,
    })
    expect(fakes.writeCredential).toHaveBeenCalled()
    expect(fakes.pushActivate).toHaveBeenCalledWith({
      relayUrl: CONFIG.relayUrl,
      activationTicket: TICKET.ticket,
    })
    expect(fakes.getBinding).toHaveBeenCalledWith(
      CREDENTIAL.installationId,
      CREDENTIAL.installationSecret,
      'bind_1',
    )
    expect(controller.getState()).toMatchObject({
      configured: true,
      enabled: true,
      working: false,
      bindingId: 'bind_1',
      preferences: DEFAULT_PUSH_PREFERENCES,
      authorizationStatus: IOS_AUTHORIZED,
      error: null,
    })
  })

  it('works without a signed-in session', async () => {
    const { controller, fakes } = createFakes({
      getSession: vi.fn(() => null),
    })
    await controller.enablePush()
    expect(fakes.registerInstallation).toHaveBeenCalledOnce()
    expect(controller.getState().enabled).toBe(true)
  })

  it('requests permission when status is not determined', async () => {
    const { controller, fakes } = createFakes({
      getPermissions: vi.fn(async () => permission(IOS_NOT_DETERMINED)),
    })
    await controller.enablePush()
    expect(fakes.requestPermissions).toHaveBeenCalledOnce()
    expect(controller.getState().enabled).toBe(true)
  })

  it('accepts provisional and ephemeral authorization', async () => {
    for (const status of [IOS_PROVISIONAL, IOS_EPHEMERAL]) {
      const { controller } = createFakes({
        getPermissions: vi.fn(async () => permission(status)),
      })
      await controller.enablePush()
      expect(controller.getState()).toMatchObject({
        enabled: true,
        authorizationStatus: status,
      })
    }
  })

  it('errors when permission is denied and does not fetch a token', async () => {
    const { controller, fakes } = createFakes({
      getPermissions: vi.fn(async () => permission(IOS_DENIED)),
    })
    await controller.enablePush()
    expect(fakes.getDevicePushToken).not.toHaveBeenCalled()
    expect(controller.getState()).toMatchObject({
      enabled: false,
      working: false,
      authorizationStatus: IOS_DENIED,
    })
    expect(controller.getState().error).toMatch(/denied|disabled/i)
  })

  it('updates an existing credential and re-registers after 401', async () => {
    const { controller, fakes, credentialBox } = createFakes()
    credentialBox.value = CREDENTIAL
    fakes.updateInstallationToken
      .mockRejectedValueOnce(new RelayError(401, 'unauthorized', 'invalid'))
      .mockResolvedValue(undefined)
    fakes.registerInstallation.mockResolvedValue({
      installation_id: 'ins_2',
      installation_secret: 'n'.repeat(32),
    })

    await controller.enablePush()

    expect(fakes.clearCredential).toHaveBeenCalled()
    expect(fakes.registerInstallation).toHaveBeenCalledOnce()
    expect(fakes.writeCredential).toHaveBeenCalledWith(
      expect.objectContaining({ installationId: 'ins_2' }),
    )
    expect(controller.getState().enabled).toBe(true)
  })
})

describe('createPushController disablePush', () => {
  it('revokes the relay binding and keeps the installation credential', async () => {
    const { controller, fakes, credentialBox } = createFakes()
    credentialBox.value = CREDENTIAL
    await controller.enablePush()
    await controller.disablePush()
    expect(fakes.revokeBinding).toHaveBeenCalledWith(
      CREDENTIAL.installationId,
      CREDENTIAL.installationSecret,
      'bind_1',
    )
    expect(fakes.clearCredential).not.toHaveBeenCalled()
    expect(credentialBox.value).toEqual(
      expect.objectContaining({
        installationId: 'ins_1',
        bindingId: null,
      }),
    )
    expect(controller.getState()).toMatchObject({
      enabled: false,
      bindingId: null,
      working: false,
    })
  })
})

describe('createPushController updatePushPreferences', () => {
  it('applies an optimistic patch and commits the relay payload', async () => {
    const { controller, fakes, credentialBox } = createFakes()
    credentialBox.value = CREDENTIAL
    await controller.enablePush()
    await controller.updatePushPreferences({ contentPost: false })
    expect(fakes.updateBindingPreferences).toHaveBeenCalledWith(
      CREDENTIAL.installationId,
      CREDENTIAL.installationSecret,
      'bind_1',
      { content_post: false },
    )
    expect(controller.getState().preferences.contentPost).toBe(false)
  })

  it('rolls back the optimistic patch when relay rejects it', async () => {
    const { controller, credentialBox } = createFakes({
      updateBindingPreferences: vi.fn(async () => {
        throw new Error('sync failed')
      }),
    })
    credentialBox.value = CREDENTIAL
    await controller.enablePush()
    const before = controller.getState().preferences
    await controller.updatePushPreferences({ contentNote: false })
    expect(controller.getState().preferences).toEqual(before)
    expect(controller.getState().error).toMatch(/fail/i)
  })
})

describe('createPushController refreshPushState', () => {
  it('does not prompt for permission on a passive refresh', async () => {
    const { controller, fakes, credentialBox } = createFakes({
      getPermissions: vi.fn(async () => permission(IOS_NOT_DETERMINED)),
    })
    credentialBox.value = CREDENTIAL
    await controller.refreshPushState()
    expect(fakes.requestPermissions).not.toHaveBeenCalled()
    expect(fakes.getDevicePushToken).not.toHaveBeenCalled()
    expect(fakes.getBinding).toHaveBeenCalled()
  })

  it('refreshes the native token when enabled, allowed, and a credential exists', async () => {
    const { controller, fakes, credentialBox } = createFakes()
    credentialBox.value = CREDENTIAL
    await controller.refreshPushState()
    expect(fakes.getDevicePushToken).toHaveBeenCalledOnce()
    expect(fakes.updateInstallationToken).toHaveBeenCalledOnce()
    expect(fakes.requestPermissions).not.toHaveBeenCalled()
    expect(controller.getState()).toMatchObject({
      enabled: true,
      bindingId: 'bind_1',
    })
  })

  it('clears local binding state when relay returns 404', async () => {
    const { controller, fakes, credentialBox } = createFakes({
      getBinding: vi.fn(async () => {
        throw new RelayError(404, 'binding_not_found', 'missing')
      }),
    })
    credentialBox.value = CREDENTIAL
    await controller.refreshPushState()
    expect(fakes.writeCredential).toHaveBeenCalledWith(
      expect.objectContaining({ bindingId: null }),
    )
    expect(controller.getState()).toMatchObject({
      enabled: false,
      bindingId: null,
    })
  })

  it('resets binding state on an API base URL switch without revoking relay', async () => {
    const { controller, fakes } = createFakes()
    await controller.enablePush()
    controller.resetForApiBaseUrlSwitch()
    expect(fakes.revokeBinding).not.toHaveBeenCalled()
    expect(controller.getState()).toMatchObject({
      enabled: false,
      bindingId: null,
      error: null,
    })
  })

  it('updates a relay token from a listener payload without fetching one', async () => {
    const { controller, fakes, credentialBox } = createFakes()
    credentialBox.value = CREDENTIAL
    await controller.updateRelayToken(TOKEN)
    expect(fakes.getDevicePushToken).not.toHaveBeenCalled()
    expect(fakes.updateInstallationToken).toHaveBeenCalledWith(
      CREDENTIAL.installationId,
      CREDENTIAL.installationSecret,
      { apns_environment: 'development', apns_token: TOKEN },
    )
  })
})

describe('createPushController refreshReaderAssociation', () => {
  it('reclaims the binding through mx-core after session refresh', async () => {
    const { controller, fakes, credentialBox } = createFakes({
      getSession: vi.fn(() => ({ id: 'reader_1' })),
    })
    credentialBox.value = CREDENTIAL
    await controller.enablePush()
    fakes.pushActivate.mockClear()
    await controller.refreshReaderAssociation()
    expect(fakes.refreshSession).toHaveBeenCalled()
    expect(fakes.pushActivate).toHaveBeenCalledOnce()
  })
})
