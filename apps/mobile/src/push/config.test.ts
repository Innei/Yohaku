import { describe, expect, it } from 'vitest'

import { loadPushConfig, parsePushConfig } from './config'

describe('parsePushConfig', () => {
  it('is unconfigured when the relay URL is absent', () => {
    expect(parsePushConfig({}, { isDev: true })).toEqual({ configured: false })
    expect(parsePushConfig({ EXPO_PUBLIC_PUSH_APP_ID: 'yohaku' })).toEqual({
      configured: false,
    })
  })

  it('is unconfigured when the relay URL is blank', () => {
    expect(
      parsePushConfig({ EXPO_PUBLIC_PUSH_RELAY_URL: '   ' }, { isDev: true }),
    ).toEqual({ configured: false })
  })

  it('accepts an HTTPS origin and defaults the app id to yohaku', () => {
    expect(
      parsePushConfig(
        { EXPO_PUBLIC_PUSH_RELAY_URL: 'https://push.example.com' },
        { isDev: false },
      ),
    ).toEqual({
      configured: true,
      relayUrl: 'https://push.example.com',
      appId: 'yohaku',
      environment: 'production',
    })
  })

  it('defaults APNs environment to development only in dev', () => {
    const env = { EXPO_PUBLIC_PUSH_RELAY_URL: 'https://push.example.com' }
    expect(parsePushConfig(env, { isDev: true })).toMatchObject({
      configured: true,
      environment: 'development',
    })
    expect(parsePushConfig(env, { isDev: false })).toMatchObject({
      configured: true,
      environment: 'production',
    })
  })

  it('uses an explicit app id and APNs environment', () => {
    expect(
      parsePushConfig(
        {
          EXPO_PUBLIC_PUSH_RELAY_URL: 'https://push.example.com/',
          EXPO_PUBLIC_PUSH_APP_ID: 'space',
          EXPO_PUBLIC_APNS_ENV: 'development',
        },
        { isDev: false },
      ),
    ).toEqual({
      configured: true,
      relayUrl: 'https://push.example.com',
      appId: 'space',
      environment: 'development',
    })
  })

  it('allows HTTP only for localhost, loopback, and .local hosts', () => {
    for (const url of [
      'http://localhost:8787',
      'http://127.0.0.1:8787',
      'http://[::1]:8787',
      'http://relay.local',
    ]) {
      expect(
        parsePushConfig({ EXPO_PUBLIC_PUSH_RELAY_URL: url }, { isDev: true }),
      ).toMatchObject({ configured: true, relayUrl: new URL(url).origin })
    }
  })

  it('rejects a non-local HTTP relay URL', () => {
    expect(() =>
      parsePushConfig(
        { EXPO_PUBLIC_PUSH_RELAY_URL: 'http://push.example.com' },
        { isDev: true },
      ),
    ).toThrow(/https/i)
  })

  it('rejects credentials, path, query, or fragment on the relay URL', () => {
    const invalid = [
      'https://user:pass@push.example.com',
      'https://push.example.com/v1',
      'https://push.example.com?x=1',
      'https://push.example.com#frag',
    ]
    for (const url of invalid) {
      expect(() =>
        parsePushConfig({ EXPO_PUBLIC_PUSH_RELAY_URL: url }, { isDev: true }),
      ).toThrow(/origin/i)
    }
  })

  it('rejects an overlong app id and defaults an empty one to yohaku', () => {
    expect(
      parsePushConfig(
        {
          EXPO_PUBLIC_PUSH_RELAY_URL: 'https://push.example.com',
          EXPO_PUBLIC_PUSH_APP_ID: '',
        },
        { isDev: true },
      ),
    ).toMatchObject({ configured: true, appId: 'yohaku' })
    expect(() =>
      parsePushConfig(
        {
          EXPO_PUBLIC_PUSH_RELAY_URL: 'https://push.example.com',
          EXPO_PUBLIC_PUSH_APP_ID: 'a'.repeat(65),
        },
        { isDev: true },
      ),
    ).toThrow(/app id/i)
  })

  it('rejects an unknown APNs environment', () => {
    expect(() =>
      parsePushConfig(
        {
          EXPO_PUBLIC_PUSH_RELAY_URL: 'https://push.example.com',
          EXPO_PUBLIC_APNS_ENV: 'sandbox',
        },
        { isDev: true },
      ),
    ).toThrow(/environment/i)
  })

  it('never invents a relay URL', () => {
    const parsed = parsePushConfig({}, { isDev: true })
    expect(parsed).toEqual({ configured: false })
    expect(JSON.stringify(parsed)).not.toMatch(/https?:\/\//)
  })
})

describe('loadPushConfig', () => {
  it('does not throw when the relay URL is missing', () => {
    expect(loadPushConfig({}, { isDev: true })).toEqual({ configured: false })
  })

  it('does not throw when a present relay URL is invalid', () => {
    expect(
      loadPushConfig(
        { EXPO_PUBLIC_PUSH_RELAY_URL: 'http://push.example.com' },
        { isDev: true },
      ),
    ).toEqual({ configured: false })
  })
})
