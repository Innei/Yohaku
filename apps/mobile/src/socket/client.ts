import type { WsClient } from '@mx-space/ws-client'
import { createWsClient } from '@mx-space/ws-client'

import { apiBaseUrl } from '@/api/base-url'
import { getSessionCookie } from '@/auth/client'
import { getLocale } from '@/i18n/locale-store'

import { getAnonymousSessionId } from './anonymous-id'
import { socketGatewayUrl } from './gateway-url'
import { currentPresenceVisitor } from './visitor'

interface Uplink {
  event: 'room.join' | 'room.leave' | 'lang.update' | 'session.update'
  payload: Record<string, string>
}

let client: WsClient | null = null
let currentUrl: string | null = null
let sessionId: string | null = null
let disposeStateListener: (() => void) | null = null
const pending: Uplink[] = []
const connectListeners = new Set<() => void>()

// React Native's WebSocket accepts an options object with headers as a third
// constructor argument; the standard signature has no such parameter, so the
// wrapper is what lets the session cookie reach the handshake.
const NativeWebSocket = WebSocket as unknown as new (
  url: string,
  protocols?: string | string[] | null,
  options?: { headers?: Record<string, string> },
) => WebSocket

const GatewayWebSocket = class {
  constructor(url: string) {
    return new NativeWebSocket(url, null, {
      headers: {
        cookie: getSessionCookie(),
        'user-agent': 'Yohaku-Mobile/1.0 (iOS)',
      },
    })
  }
} as unknown as typeof WebSocket

export function subscribeGatewayConnect(listener: () => void) {
  connectListeners.add(listener)
  return () => connectListeners.delete(listener)
}

export function getGatewaySid(): string | undefined {
  return client?.state === 'open' ? (sessionId ?? undefined) : undefined
}

export function connectGateway() {
  if (!apiBaseUrl()) return
  const url = socketGatewayUrl(apiBaseUrl())
  if (
    client &&
    currentUrl === url &&
    (client.state === 'open' || client.state === 'connecting')
  ) {
    return
  }
  disconnectGateway()
  currentUrl = url
  const anonymousId = getAnonymousSessionId()
  sessionId = anonymousId
  const ws = createWsClient({
    url,
    query: {
      lang: getLocale(),
      socket_session_id: anonymousId,
    },
    webSocketImpl: GatewayWebSocket,
  })
  client = ws
  disposeStateListener = ws.on('$state', (state) => {
    if (state === 'open') flushPending()
  })
}

export function reconnectGateway() {
  disconnectGateway()
  connectGateway()
}

export function disconnectGateway() {
  if (!client) return
  disposeStateListener?.()
  disposeStateListener = null
  client.close()
  client = null
  currentUrl = null
  sessionId = null
}

export function emitJoin(roomName: string) {
  sendUplink({ event: 'room.join', payload: { room: roomName } })
}

export function emitLeave(roomName: string) {
  sendUplink({ event: 'room.leave', payload: { room: roomName } })
}

export function emitUpdateLang(lang: string) {
  sendUplink({ event: 'lang.update', payload: { lang } })
}

export function emitUpdateSid() {
  const { identity } = currentPresenceVisitor()
  sessionId = identity
  sendUplink({ event: 'session.update', payload: { sessionId: identity } })
}

function sendUplink(uplink: Uplink) {
  if (client?.state === 'open') {
    client.send(uplink.event, uplink.payload)
    return
  }
  pending.push(uplink)
}

function flushPending() {
  emitUpdateSid()
  emitUpdateLang(getLocale())
  const queued = pending.splice(0)
  for (const item of queued) {
    client?.send(item.event, item.payload)
  }
  for (const listener of connectListeners) listener()
}
