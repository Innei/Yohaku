import { RelayError } from './relay-client'
import type {
  PushActivation,
  PushConfig,
  PushInstallationCredential,
  PushPreferences,
  RegisterInstallationRequest,
  RelayActivationTicketResponse,
  RelayInstallationResponse,
  UpdateInstallationTokenRequest,
} from './types'
import { appPreferencesToRelay, DEFAULT_PUSH_PREFERENCES } from './types'

export const IOS_AUTHORIZATION_STATUS = {
  NOT_DETERMINED: 0,
  DENIED: 1,
  AUTHORIZED: 2,
  PROVISIONAL: 3,
  EPHEMERAL: 4,
} as const

export type PushUiState = {
  authorizationStatus: number | null
  bindingId: string | null
  configured: boolean
  enabled: boolean
  error: string | null
  preferences: PushPreferences
  working: boolean
}

export type DevicePushTokenLike = {
  data: unknown
  type: string
}

export type PushControllerDeps = {
  api: {
    pushActivate: (body: {
      activationTicket: string
      relayUrl: string
    }) => Promise<PushActivation>
  }
  config: () => PushConfig
  credentials: {
    clear: () => Promise<void>
    read: (config: {
      appId: string
      relayUrl: string
    }) => Promise<PushInstallationCredential | null>
    write: (credential: PushInstallationCredential) => Promise<void>
  }
  permissions: {
    get: () => Promise<{ ios?: { status: number } | null } | null>
    request: () => Promise<{ ios?: { status: number } | null } | null>
  }
  relay: {
    createActivationTicket: (
      installationId: string,
      installationSecret: string,
    ) => Promise<RelayActivationTicketResponse>
    getBinding: (
      installationId: string,
      installationSecret: string,
      bindingId: string,
    ) => Promise<{ preferences: PushPreferences }>
    registerInstallation: (
      body: RegisterInstallationRequest,
    ) => Promise<RelayInstallationResponse>
    revokeBinding: (
      installationId: string,
      installationSecret: string,
      bindingId: string,
    ) => Promise<void>
    updateBindingPreferences: (
      installationId: string,
      installationSecret: string,
      bindingId: string,
      patch: ReturnType<typeof appPreferencesToRelay>,
    ) => Promise<PushPreferences>
    updateInstallationToken: (
      installationId: string,
      installationSecret: string,
      body: UpdateInstallationTokenRequest,
    ) => Promise<void>
  }
  session: {
    get: () => { id: string } | null
    refresh: () => Promise<void>
  }
  token: {
    getDevicePushToken: () => Promise<DevicePushTokenLike>
  }
}

const APNS_TOKEN = /^[\da-f]{64,}$/

function configuredConfig(
  config: PushConfig,
): Extract<PushConfig, { configured: true }> | null {
  return config.configured ? config : null
}

function isAllowed(status: number | null): boolean {
  return (
    status === IOS_AUTHORIZATION_STATUS.AUTHORIZED ||
    status === IOS_AUTHORIZATION_STATUS.PROVISIONAL ||
    status === IOS_AUTHORIZATION_STATUS.EPHEMERAL
  )
}

function iosStatus(
  value: { ios?: { status: number } | null } | null | undefined,
): number | null {
  const status = value?.ios?.status
  return typeof status === 'number' ? status : null
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function apnsTokenFromDevicePushToken(
  token: DevicePushTokenLike,
): string {
  if (token.type !== 'ios' || typeof token.data !== 'string') {
    throw new Error('A native iOS APNs token is required')
  }
  const normalized = token.data.toLowerCase()
  if (!APNS_TOKEN.test(normalized)) {
    throw new Error(
      'APNs token must be lowercase hex of at least 64 characters',
    )
  }
  return normalized
}

function initialState(config: PushConfig): PushUiState {
  return {
    configured: config.configured,
    authorizationStatus: null,
    enabled: false,
    working: false,
    bindingId: null,
    preferences: { ...DEFAULT_PUSH_PREFERENCES },
    error: null,
  }
}

export function createPushController(deps: PushControllerDeps) {
  let state = initialState(deps.config())
  const listeners = new Set<() => void>()

  function emit() {
    for (const listener of listeners) listener()
  }

  function setState(patch: Partial<PushUiState>) {
    state = { ...state, ...patch }
    emit()
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  async function persistCredential(
    credential: PushInstallationCredential,
    bindingId: string | null,
  ) {
    await deps.credentials.write({ ...credential, bindingId })
  }

  async function ensureInstallation(
    config: Extract<PushConfig, { configured: true }>,
    apnsToken: string,
  ): Promise<PushInstallationCredential> {
    const existing = await deps.credentials.read({
      relayUrl: config.relayUrl,
      appId: config.appId,
    })
    const body = {
      apns_environment: config.environment,
      apns_token: apnsToken,
    }
    if (existing) {
      try {
        await deps.relay.updateInstallationToken(
          existing.installationId,
          existing.installationSecret,
          body,
        )
        return existing
      } catch (error) {
        if (!(error instanceof RelayError) || error.status !== 401) throw error
        await deps.credentials.clear()
      }
    }
    const registered = await deps.relay.registerInstallation({
      app_id: config.appId,
      ...body,
    })
    const credential: PushInstallationCredential = {
      relayUrl: config.relayUrl,
      appId: config.appId,
      installationId: registered.installation_id,
      installationSecret: registered.installation_secret,
      bindingId: null,
    }
    await deps.credentials.write(credential)
    return credential
  }

  async function activateInstallation(
    config: Extract<PushConfig, { configured: true }>,
    credential: PushInstallationCredential,
  ) {
    const ticket = await deps.relay.createActivationTicket(
      credential.installationId,
      credential.installationSecret,
    )
    const activated = await deps.api.pushActivate({
      relayUrl: config.relayUrl,
      activationTicket: ticket.ticket,
    })
    const bindingId = activated.bindingId
    await persistCredential(credential, bindingId)
    const binding = await deps.relay.getBinding(
      credential.installationId,
      credential.installationSecret,
      bindingId,
    )
    setState({
      configured: true,
      enabled: true,
      working: false,
      bindingId,
      preferences: binding.preferences,
      error: null,
    })
  }

  async function enablePush() {
    if (state.working) return
    const config = configuredConfig(deps.config())
    if (!config) {
      setState({
        configured: false,
        enabled: false,
        error: 'Push is not configured',
      })
      return
    }
    setState({ configured: true, working: true, error: null })
    try {
      let status = iosStatus(await deps.permissions.get())
      if (status === IOS_AUTHORIZATION_STATUS.NOT_DETERMINED) {
        status = iosStatus(await deps.permissions.request())
      }
      setState({ authorizationStatus: status })
      if (status === IOS_AUTHORIZATION_STATUS.DENIED) {
        setState({
          working: false,
          enabled: false,
          error: 'Notifications are disabled in iOS Settings.',
        })
        return
      }
      if (!isAllowed(status)) {
        setState({
          working: false,
          enabled: false,
          error: 'Notifications were not allowed.',
        })
        return
      }
      const apnsToken = apnsTokenFromDevicePushToken(
        await deps.token.getDevicePushToken(),
      )
      const credential = await ensureInstallation(config, apnsToken)
      await deps.session.refresh()
      await activateInstallation(config, credential)
    } catch (error) {
      setState({
        working: false,
        enabled: false,
        error: errorMessage(error),
      })
    }
  }

  async function disablePush() {
    if (state.working) return
    const config = configuredConfig(deps.config())
    const bindingId = state.bindingId
    if (!config || !bindingId) {
      setState({ enabled: false, bindingId: null, error: null })
      return
    }
    setState({ working: true, error: null })
    try {
      const credential = await deps.credentials.read({
        relayUrl: config.relayUrl,
        appId: config.appId,
      })
      if (credential) {
        await deps.relay.revokeBinding(
          credential.installationId,
          credential.installationSecret,
          bindingId,
        )
        await persistCredential(credential, null)
      }
      setState({
        working: false,
        enabled: false,
        bindingId: null,
        error: null,
      })
    } catch (error) {
      setState({ working: false, error: errorMessage(error) })
    }
  }

  async function updatePushPreferences(patch: Partial<PushPreferences>) {
    const config = configuredConfig(deps.config())
    const bindingId = state.bindingId
    if (!config || !bindingId) return
    const credential = await deps.credentials.read({
      relayUrl: config.relayUrl,
      appId: config.appId,
    })
    if (!credential) return

    const previous = state.preferences
    setState({
      preferences: { ...previous, ...patch },
      error: null,
    })
    try {
      const next = await deps.relay.updateBindingPreferences(
        credential.installationId,
        credential.installationSecret,
        bindingId,
        appPreferencesToRelay(patch),
      )
      setState({ preferences: next })
    } catch (error) {
      setState({
        preferences: previous,
        error: errorMessage(error),
      })
    }
  }

  async function refreshPushState() {
    const config = configuredConfig(deps.config())
    if (!config) {
      setState({
        configured: false,
        enabled: false,
        bindingId: null,
      })
      return
    }
    try {
      const authorizationStatus = iosStatus(await deps.permissions.get())
      setState({ configured: true, authorizationStatus })

      const credential = await deps.credentials.read({
        relayUrl: config.relayUrl,
        appId: config.appId,
      })
      const bindingId = credential?.bindingId ?? state.bindingId
      if (!credential?.bindingId) {
        setState({
          enabled: false,
          bindingId: null,
          error: null,
        })
        return
      }

      try {
        const binding = await deps.relay.getBinding(
          credential.installationId,
          credential.installationSecret,
          bindingId,
        )
        setState({
          enabled: true,
          bindingId,
          preferences: binding.preferences,
          error: null,
        })
      } catch (error) {
        if (error instanceof RelayError && error.status === 404) {
          await persistCredential(credential, null)
          setState({ enabled: false, bindingId: null, error: null })
          return
        }
        throw error
      }

      if (!isAllowed(authorizationStatus)) return

      const apnsToken = apnsTokenFromDevicePushToken(
        await deps.token.getDevicePushToken(),
      )
      const nextCredential = await ensureInstallation(config, apnsToken)
      if (nextCredential.installationId !== credential.installationId) {
        await activateInstallation(config, nextCredential)
      }
    } catch (error) {
      setState({ error: errorMessage(error) })
    }
  }

  async function refreshReaderAssociation() {
    const config = configuredConfig(deps.config())
    if (!config || !state.bindingId) return
    const credential = await deps.credentials.read({
      relayUrl: config.relayUrl,
      appId: config.appId,
    })
    if (!credential?.bindingId) return
    try {
      await deps.session.refresh()
      await activateInstallation(config, credential)
    } catch (error) {
      setState({ error: errorMessage(error) })
    }
  }

  async function updateRelayToken(apnsToken: string) {
    const config = configuredConfig(deps.config())
    if (!config) return
    let token: string
    try {
      token = apnsTokenFromDevicePushToken({ type: 'ios', data: apnsToken })
    } catch {
      return
    }
    const existing = await deps.credentials.read({
      relayUrl: config.relayUrl,
      appId: config.appId,
    })
    if (!existing) return
    try {
      const credential = await ensureInstallation(config, token)
      if (
        credential.installationId !== existing.installationId &&
        state.bindingId
      ) {
        await activateInstallation(config, credential)
      }
    } catch (error) {
      setState({ error: errorMessage(error) })
    }
  }

  function resetForApiBaseUrlSwitch() {
    // setApiBaseUrl notifies after `current` is already the new origin, so
    // the previous mx-core host is gone. Do not attempt a best-effort
    // deactivate against the new API; just drop local binding state so the
    // old binding cannot be treated as active.
    setState({
      enabled: false,
      bindingId: null,
      error: null,
      working: false,
    })
  }

  return {
    disablePush,
    enablePush,
    getState: () => state,
    refreshPushState,
    refreshReaderAssociation,
    resetForApiBaseUrlSwitch,
    subscribe,
    updatePushPreferences,
    updateRelayToken,
  }
}
