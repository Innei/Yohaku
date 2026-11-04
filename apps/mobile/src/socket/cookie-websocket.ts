type NativeSocketConstructor = new (
  url: string,
  protocols?: string | string[] | null,
  options?: { headers?: Record<string, string> },
) => WebSocket

// ws-client uses these handlers, send and close. Delay the native constructor
// until cookie access finishes, including on each automatic reconnect.
export function createCookieWebSocket(
  NativeSocket: NativeSocketConstructor,
  readCookie: () => Promise<string>,
): typeof WebSocket {
  return class {
    onopen: WebSocket['onopen'] = null
    onmessage: WebSocket['onmessage'] = null
    onerror: WebSocket['onerror'] = null
    onclose: WebSocket['onclose'] = null
    private socket: WebSocket | null = null
    private closed = false

    constructor(url: string) {
      void this.open(url)
    }

    private async open(url: string) {
      try {
        const cookie = await readCookie()
        if (this.closed) return
        const socket = new NativeSocket(url, null, {
          headers: { cookie, 'user-agent': 'Yohaku-Mobile/1.0 (iOS)' },
        })
        this.socket = socket
        socket.onopen = (event) => this.onopen?.call(socket, event)
        socket.onmessage = (event) => this.onmessage?.call(socket, event)
        socket.onerror = (event) => this.onerror?.call(socket, event)
        socket.onclose = (event) => this.onclose?.call(socket, event)
      } catch (error) {
        if (this.closed) return
        this.onclose?.call(
          this as unknown as WebSocket,
          {
            type: 'close',
            code: 1006,
            reason: error instanceof Error ? error.message : String(error),
            wasClean: false,
          } as CloseEvent,
        )
      }
    }

    send(data: Parameters<WebSocket['send']>[0]) {
      if (!this.socket) throw new Error('WebSocket is not open')
      this.socket.send(data)
    }

    close(code?: number, reason?: string) {
      this.closed = true
      this.socket?.close(code, reason)
    }
  } as unknown as typeof WebSocket
}
