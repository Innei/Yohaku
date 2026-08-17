import type {
  PushPreferences,
  RegisterInstallationRequest,
  RelayActivationTicketResponse,
  RelayBinding,
  RelayBindingPreferences,
  RelayInstallationResponse,
  UpdateInstallationTokenRequest,
} from './types'
import { relayPreferencesToApp } from './types'

export class RelayError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'RelayError'
  }
}

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>

export type RelayClientOptions = {
  fetch?: FetchLike
  origin: string
  timeoutMs?: number
}

export type RelayClient = {
  createActivationTicket: (
    installationId: string,
    installationSecret: string,
  ) => Promise<RelayActivationTicketResponse>
  getBinding: (
    installationId: string,
    installationSecret: string,
    bindingId: string,
  ) => Promise<RelayBinding>
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
    patch: Partial<RelayBindingPreferences>,
  ) => Promise<PushPreferences>
  updateInstallationToken: (
    installationId: string,
    installationSecret: string,
    body: UpdateInstallationTokenRequest,
  ) => Promise<void>
}

const DEFAULT_TIMEOUT_MS = 10_000
const APNS_TOKEN = /^[\da-f]{64,}$/
const ISO_OFFSET_DATE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

export function installationAuthorization(id: string, secret: string): string {
  return `Installation ${id}.${secret}`
}

export function joinRelayUrl(origin: string, path: string): string {
  const base = origin.endsWith('/') ? origin : `${origin}/`
  const relative = path.startsWith('/') ? path.slice(1) : path
  return new URL(relative, base).href
}

function assertApnsToken(token: string): void {
  if (!APNS_TOKEN.test(token)) {
    throw new Error(
      'APNs token must be lowercase hex of at least 64 characters',
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function stringField(value: unknown, min: number): string | null {
  return typeof value === 'string' && value.length >= min ? value : null
}

function parsePreferences(value: unknown): RelayBindingPreferences | null {
  if (!isRecord(value)) return null
  const content_post = value.content_post
  const content_note = value.content_note
  const content_recently = value.content_recently
  const comment_replied = value.comment_replied
  if (
    typeof content_post !== 'boolean' ||
    typeof content_note !== 'boolean' ||
    typeof content_recently !== 'boolean' ||
    typeof comment_replied !== 'boolean'
  ) {
    return null
  }
  return { content_post, content_note, content_recently, comment_replied }
}

function parseInstallationResponse(value: unknown): RelayInstallationResponse {
  if (!isRecord(value)) throw new Error('Invalid installation response')
  const installation_id = stringField(value.installation_id, 1)
  const installation_secret = stringField(value.installation_secret, 32)
  if (!installation_id || !installation_secret) {
    throw new Error('Invalid installation response')
  }
  return { installation_id, installation_secret }
}

function parseTicketResponse(value: unknown): RelayActivationTicketResponse {
  if (!isRecord(value)) throw new Error('Invalid activation ticket response')
  const ticket = stringField(value.ticket, 32)
  const expires_at =
    typeof value.expires_at === 'string' &&
    ISO_OFFSET_DATE.test(value.expires_at)
      ? value.expires_at
      : null
  if (!ticket || !expires_at) {
    throw new Error('Invalid activation ticket response')
  }
  return { ticket, expires_at }
}

function parseBindingResponse(value: unknown): RelayBinding {
  if (!isRecord(value)) throw new Error('Invalid binding response')
  const binding_id = stringField(value.binding_id, 1)
  const source_id = stringField(value.source_id, 1)
  const installation_id = stringField(value.installation_id, 1)
  const reader_id =
    value.reader_id === null
      ? null
      : typeof value.reader_id === 'string'
        ? value.reader_id
        : null
  const preferences = parsePreferences(value.preferences)
  if (!binding_id || !source_id || !installation_id || !preferences) {
    throw new Error('Invalid binding response')
  }
  return {
    binding_id,
    source_id,
    installation_id,
    reader_id,
    preferences: relayPreferencesToApp(preferences),
  }
}

function parseErrorBody(text: string): { code: string; message: string } {
  try {
    const parsed = JSON.parse(text) as unknown
    if (isRecord(parsed)) {
      const code =
        typeof parsed.error === 'string' && parsed.error
          ? parsed.error
          : 'rejected'
      const message =
        typeof parsed.message === 'string' && parsed.message
          ? parsed.message
          : `Push Relay rejected the request`
      return { code, message }
    }
  } catch {
    // non-JSON body
  }
  return {
    code: 'rejected',
    message: text.slice(0, 200) || 'Push Relay rejected the request',
  }
}

export function createRelayClient(options: RelayClientOptions): RelayClient {
  const fetchImpl = options.fetch ?? globalThis.fetch
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  async function send(
    path: string,
    init: RequestInit,
    success: number,
  ): Promise<string> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(joinRelayUrl(options.origin, path), {
        ...init,
        headers: {
          accept: 'application/json',
          ...(init.body !== undefined
            ? { 'content-type': 'application/json' }
            : null),
          ...(init.headers as Record<string, string> | undefined),
        },
        redirect: 'error',
        signal: controller.signal,
      })
      const text = await response.text().catch(() => '')
      if (response.status !== success) {
        const { code, message } = parseErrorBody(text)
        throw new RelayError(response.status, code, message)
      }
      return text
    } finally {
      clearTimeout(timer)
    }
  }

  function installationHeaders(
    installationId: string,
    installationSecret: string,
  ) {
    return {
      authorization: installationAuthorization(
        installationId,
        installationSecret,
      ),
    }
  }

  return {
    async registerInstallation(body) {
      assertApnsToken(body.apns_token)
      const text = await send(
        '/v1/installations',
        { method: 'POST', body: JSON.stringify(body) },
        201,
      )
      return parseInstallationResponse(text ? JSON.parse(text) : null)
    },

    async updateInstallationToken(installationId, installationSecret, body) {
      assertApnsToken(body.apns_token)
      await send(
        `/v1/installations/${encodeURIComponent(installationId)}/token`,
        {
          method: 'PUT',
          headers: installationHeaders(installationId, installationSecret),
          body: JSON.stringify(body),
        },
        200,
      )
    },

    async createActivationTicket(installationId, installationSecret) {
      const text = await send(
        '/v1/source-activations',
        {
          method: 'POST',
          headers: installationHeaders(installationId, installationSecret),
        },
        201,
      )
      return parseTicketResponse(text ? JSON.parse(text) : null)
    },

    async getBinding(installationId, installationSecret, bindingId) {
      const text = await send(
        `/v1/bindings/${encodeURIComponent(bindingId)}`,
        {
          method: 'GET',
          headers: installationHeaders(installationId, installationSecret),
        },
        200,
      )
      return parseBindingResponse(text ? JSON.parse(text) : null)
    },

    async updateBindingPreferences(
      installationId,
      installationSecret,
      bindingId,
      patch,
    ) {
      const text = await send(
        `/v1/bindings/${encodeURIComponent(bindingId)}/preferences`,
        {
          method: 'PUT',
          headers: installationHeaders(installationId, installationSecret),
          body: JSON.stringify(patch),
        },
        200,
      )
      const parsed = text ? JSON.parse(text) : null
      if (!isRecord(parsed)) throw new Error('Invalid preferences response')
      const preferences = parsePreferences(parsed.preferences)
      if (!preferences) throw new Error('Invalid preferences response')
      return relayPreferencesToApp(preferences)
    },

    async revokeBinding(installationId, installationSecret, bindingId) {
      await send(
        `/v1/bindings/${encodeURIComponent(bindingId)}`,
        {
          method: 'DELETE',
          headers: installationHeaders(installationId, installationSecret),
        },
        200,
      )
    },
  }
}
