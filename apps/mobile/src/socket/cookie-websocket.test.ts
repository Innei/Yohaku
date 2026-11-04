import { createWsClient } from '@mx-space/ws-client'
import { beforeEach, expect, it, vi } from 'vitest'

import { createCookieWebSocket } from './cookie-websocket'

const NativeSocket = vi.fn(function () {
  return { close: vi.fn(), send: vi.fn() }
})

beforeEach(() => vi.clearAllMocks())

it('waits for the cookie before opening the native handshake', async () => {
  let resolveCookie!: (cookie: string) => void
  const cookie = new Promise<string>((resolve) => {
    resolveCookie = resolve
  })
  const Socket = createCookieWebSocket(NativeSocket as any, () => cookie)
  const socket = new Socket('wss://example.com')
  socket.onopen = vi.fn()
  expect(NativeSocket).not.toHaveBeenCalled()
  resolveCookie('session=abc')
  await vi.waitFor(() => expect(NativeSocket).toHaveBeenCalledOnce())
  expect(NativeSocket).toHaveBeenCalledWith('wss://example.com', null, {
    headers: { cookie: 'session=abc', 'user-agent': 'Yohaku-Mobile/1.0 (iOS)' },
  })
  const native = NativeSocket.mock.results[0]!.value
  native.onopen(new Event('open'))
  expect(socket.onopen).toHaveBeenCalledOnce()
  socket.send('message')
  expect(native.send).toHaveBeenCalledWith('message')
  socket.close()
  expect(native.close).toHaveBeenCalledOnce()
})

it('does not open a socket after it is closed while reading the cookie', async () => {
  let resolveCookie!: (cookie: string) => void
  const cookie = new Promise<string>((resolve) => {
    resolveCookie = resolve
  })
  const Socket = createCookieWebSocket(NativeSocket as any, () => cookie)
  const socket = new Socket('wss://example.com')
  socket.close()
  resolveCookie('session=abc')
  await cookie
  expect(NativeSocket).not.toHaveBeenCalled()
})

it('reads a fresh cookie when the gateway automatically reconnects', async () => {
  const readCookie = vi
    .fn()
    .mockResolvedValueOnce('old')
    .mockResolvedValueOnce('new')
  const Socket = createCookieWebSocket(NativeSocket as any, readCookie)
  const client = createWsClient({
    url: 'wss://example.com',
    webSocketImpl: Socket,
    backoff: { baseMs: 1, maxMs: 1 },
  })
  try {
    await vi.waitFor(() => expect(NativeSocket).toHaveBeenCalledOnce())
    NativeSocket.mock.results[0]!.value.onclose(new Event('close'))
    await vi.waitFor(() => expect(NativeSocket).toHaveBeenCalledTimes(2))
    expect(
      NativeSocket.mock.calls.map((call: any) => call[2].headers.cookie),
    ).toEqual(['old', 'new'])
  } finally {
    client.close()
  }
})

it('reports setup failure as a closed connection so the client can retry', async () => {
  const Socket = createCookieWebSocket(NativeSocket as any, async () => {
    throw new Error('unavailable')
  })
  const socket = new Socket('wss://example.com')
  socket.onclose = vi.fn()
  await vi.waitFor(() => expect(socket.onclose).toHaveBeenCalledOnce())
  expect(NativeSocket).not.toHaveBeenCalled()
})
