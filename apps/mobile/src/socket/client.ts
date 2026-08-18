import type { WsClient, WsClientState } from '@mx-space/ws-client'
import { createWsClient } from '@mx-space/ws-client'

import { apiBaseUrl } from '@/api/base-url'
import { camelize } from '@/api/camelize'
import { getSessionCookie } from '@/auth/client'
import { getLocale } from '@/i18n/locale-store'
import { queryClient } from '@/lib/query-client'

import { getAnonymousSessionId } from './anonymous-id'
import { GATEWAY_EVENTS } from './events'
import { socketGatewayConnectUrl, socketGatewayUrl } from './gateway-url'
import {
  applyPresenceLeave,
  applyPresenceUpdate,
  presenceRoomQueryKey,
  type PresenceMap,
  type PresenceRecord,
} from './presence-sync'
import { socketTrace } from './trace'
import { currentPresenceVisitor } from './visitor'

interface Uplink {
  event: 'room.join' | 'room.leave' | 'lang.update' | 'session.update'
  payload: Record<string, string>
}

export interface GatewayDebug {
  sid: string | null
  state: WsClientState | 'idle'
  url: string | null
}

let client: WsClient | null = null
let currentUrl: string | null = null
let sessionId: string | null = null
let disposeStateListener: (() => void) | null = null
let disposeEventListeners: (() => void) | null = null
const pending: Uplink[] = []
const connectListeners = new Set<() => void>()
const debugListeners = new Set<() => void>()
let debug: GatewayDebug = { sid: null, state: 'idle', url: null }

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

export function getGatewayDebug(): GatewayDebug {
  return debug
}

export function subscribeGatewayDebug(listener: () => void) {
  debugListeners.add(listener)
  return () => debugListeners.delete(listener)
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
  const connectUrl = socketGatewayConnectUrl(apiBaseUrl(), {
    lang: getLocale(),
    socket_session_id: anonymousId,
  })
  setDebug({ sid: anonymousId, state: 'connecting', url: connectUrl })
  socketTrace.record({
    dir: 'state',
    event: 'connecting',
    payload: { url: connectUrl },
  })
  try {
    const ws = instrumentClient(
      createWsClient({
        url: connectUrl,
        webSocketImpl: GatewayWebSocket,
      }),
    )
    client = ws
    disposeEventListeners = listenGatewayEvents(ws)
    disposeStateListener = ws.on('$state', (state) => {
      setDebug({ state, sid: sessionId })
      socketTrace.record({ dir: 'state', event: state })
      if (state === 'open') void flushPending()
    })
  } catch (error) {
    socketTrace.record({
      dir: 'state',
      event: 'error',
      payload: {
        message: error instanceof Error ? error.message : String(error),
      },
    })
    setDebug({ state: 'closed', sid: null })
  }
}

export function reconnectGateway() {
  disconnectGateway()
  connectGateway()
}

export function disconnectGateway() {
  if (!client) return
  client.close()
  disposeEventListeners?.()
  disposeEventListeners = null
  disposeStateListener?.()
  disposeStateListener = null
  client = null
  currentUrl = null
  sessionId = null
  setDebug({ sid: null, state: 'idle', url: null })
}

export function emitJoin(roomName: string) {
  return dispatchUplink({ event: 'room.join', payload: { room: roomName } })
}

export function emitLeave(roomName: string) {
  return dispatchUplink({ event: 'room.leave', payload: { room: roomName } })
}

export function emitUpdateLang(lang: string) {
  return dispatchUplink({ event: 'lang.update', payload: { lang } })
}

export function emitUpdateSid() {
  const { identity } = currentPresenceVisitor()
  sessionId = identity
  setDebug({ sid: identity })
  return dispatchUplink({
    event: 'session.update',
    payload: { sessionId: identity },
  })
}

async function dispatchUplink(uplink: Uplink): Promise<void> {
  if (!client || client.state !== 'open') {
    pending.push(uplink)
    return
  }
  try {
    await client.request(uplink.event, uplink.payload)
  } catch (error) {
    socketTrace.record({
      dir: 'state',
      event: `${uplink.event}:error`,
      payload: {
        code: errorCode(error),
        message: error instanceof Error ? error.message : String(error),
      },
    })
  }
}

async function flushPending() {
  await emitUpdateSid()
  await emitUpdateLang(getLocale())
  const queued = pending.splice(0)
  for (const item of queued) {
    await dispatchUplink(item)
  }
  for (const listener of connectListeners) listener()
}

function instrumentClient(ws: WsClient): WsClient {
  return {
    on: ws.on.bind(ws),
    close: ws.close.bind(ws),
    send(event, payload) {
      socketTrace.record({ dir: 'out', event, payload })
      ws.send(event, payload)
    },
    request(event, payload, opts) {
      socketTrace.record({ dir: 'out', event, payload })
      return ws.request(event, payload, opts)
    },
    get state() {
      return ws.state
    },
  }
}

function listenGatewayEvents(ws: WsClient) {
  const stops = GATEWAY_EVENTS.map((event) =>
    ws.on(event, (payload) => {
      socketTrace.record({ dir: 'in', event, payload })
      handleGatewayEvent(event, payload)
    }),
  )
  return () => {
    for (const stop of stops) stop()
  }
}

function handleGatewayEvent(event: string, raw: unknown) {
  if (event === 'activity.update_presence') {
    const payload = camelize<PresenceRecord & { roomName?: string }>(raw)
    if (typeof payload.roomName !== 'string') return
    queryClient.setQueryData(
      presenceRoomQueryKey(payload.roomName),
      (old: PresenceMap | undefined) => applyPresenceUpdate(old ?? {}, payload),
    )
    return
  }
  if (event === 'activity.leave_presence') {
    const payload = camelize<{ identity?: string; roomName?: string }>(raw)
    if (typeof payload.roomName !== 'string') return
    queryClient.setQueryData(
      presenceRoomQueryKey(payload.roomName),
      (old: PresenceMap | undefined) =>
        applyPresenceLeave(old ?? {}, payload.identity),
    )
    return
  }
  if (event === 'companion_presence.changed') {
    void queryClient.invalidateQueries({
      queryKey: ['companion', 'presence', 'public'],
    })
  }
}

function setDebug(patch: Partial<GatewayDebug>) {
  debug = { ...debug, ...patch }
  for (const listener of debugListeners) listener()
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined
  }
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}
