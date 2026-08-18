import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAppConfig } from '../../app.config'

const originalEnvironment = process.env.EXPO_PUBLIC_APNS_ENV

const loadConfig = (environment: 'development' | 'production') => {
  process.env.EXPO_PUBLIC_APNS_ENV = environment
  return createAppConfig()
}

afterEach(() => {
  vi.resetModules()
  if (originalEnvironment === undefined) {
    delete process.env.EXPO_PUBLIC_APNS_ENV
  } else {
    process.env.EXPO_PUBLIC_APNS_ENV = originalEnvironment
  }
})

describe('mobile notification native config', () => {
  it.each(['development', 'production'] as const)(
    'uses the %s APNs environment consistently',
    (environment) => {
      const config = loadConfig(environment)
      expect(config.ios?.entitlements?.['aps-environment']).toBe(environment)
      expect(
        config.plugins?.find(
          (plugin: unknown) =>
            Array.isArray(plugin) && plugin[0] === 'expo-notifications',
        ),
      ).toEqual(['expo-notifications', { mode: environment }])
    },
  )

  it('enables communication notifications and native extension generation', () => {
    const config = loadConfig('development')
    expect(
      config.ios?.entitlements?.[
        'com.apple.developer.usernotifications.communication'
      ],
    ).toBe(true)
    expect(config.ios?.infoPlist?.NSUserActivityTypes).toContain(
      'INSendMessageIntent',
    )
    expect(config.plugins).toContain('@bacons/apple-targets')
    expect(config.plugins).toContain(
      './plugins/with-notification-localizations.cjs',
    )
  })
})
