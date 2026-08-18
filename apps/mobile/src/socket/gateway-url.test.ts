import { describe, expect, it } from 'vitest'

import { socketGatewayConnectUrl, socketGatewayUrl } from './gateway-url'

describe('socketGatewayUrl', () => {
  it('strips the /api/v3 prefix and upgrades to wss in production', () => {
    expect(socketGatewayUrl('https://mx.example.com/api/v3')).toBe(
      'wss://mx.example.com/ws/web',
    )
    expect(socketGatewayUrl('https://mx.example.com/api/v3/')).toBe(
      'wss://mx.example.com/ws/web',
    )
  })

  it('keeps a bare origin and downgrades to ws for local mx-core', () => {
    expect(socketGatewayUrl('http://localhost:2333')).toBe(
      'ws://localhost:2333/ws/web',
    )
    expect(socketGatewayUrl('http://localhost:2333/')).toBe(
      'ws://localhost:2333/ws/web',
    )
  })
})

describe('socketGatewayConnectUrl', () => {
  it('appends handshake query without parsing the ws URL', () => {
    expect(
      socketGatewayConnectUrl('http://localhost:2333', {
        lang: 'zh-TW',
        socket_session_id: 'anon0001',
      }),
    ).toBe(
      'ws://localhost:2333/ws/web?lang=zh-TW&socket_session_id=anon0001',
    )
  })

  it('encodes query values', () => {
    expect(
      socketGatewayConnectUrl('https://mx.example.com/api/v3', {
        lang: 'zh',
        socket_session_id: 'a b',
      }),
    ).toBe('wss://mx.example.com/ws/web?lang=zh&socket_session_id=a%20b')
  })
})
