import { describe, expect, it } from 'vitest'

import { socketGatewayUrl } from './gateway-url'

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
