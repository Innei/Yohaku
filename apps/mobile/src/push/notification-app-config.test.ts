import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAppConfig, resolveOverlayUpdates } from '../../app.config'

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

  it('pins OTA runtimeVersion to the native fingerprint', () => {
    const config = loadConfig('development')
    expect(config.runtimeVersion).toEqual({ policy: 'fingerprint' })
  })

  it('does not block launch waiting for an OTA fetch', () => {
    expect(
      resolveOverlayUpdates('/tmp', { updates: { url: 'https://ota.example' } })
        ?.fallbackToCacheTimeout,
    ).toBe(0)
  })

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

  it('does not request Face ID or link expo-secure-store', () => {
    const config = loadConfig('production')
    expect(config.ios?.infoPlist).not.toHaveProperty('NSFaceIDUsageDescription')
    expect(config.plugins).not.toContain('expo-secure-store')
  })

  it('passes Expo a project-relative OTA signing certificate path', () => {
    const overlayDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'yohaku-ota-overlay-'),
    )
    const certificate = path.join(overlayDir, 'certs', 'certificate.pem')
    fs.mkdirSync(path.dirname(certificate), { recursive: true })
    fs.writeFileSync(certificate, 'test certificate')

    try {
      const updates = resolveOverlayUpdates(overlayDir, {
        updates: { codeSigningCertificate: 'certs/certificate.pem' },
      })
      const configured = updates?.codeSigningCertificate

      expect(configured).toBeDefined()
      expect(path.isAbsolute(configured!)).toBe(false)
      expect(path.resolve(__dirname, '../..', configured!)).toBe(certificate)
    } finally {
      fs.rmSync(overlayDir, { force: true, recursive: true })
    }
  })
})
