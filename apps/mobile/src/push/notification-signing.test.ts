import { describe, expect, it } from 'vitest'

import {
  applyManualSigning,
  resolveManualSigningOptions,
  signingSettingsFor,
} from '../../scripts/manual-signing.mjs'

const options = {
  appBundleIdentifier: 'dev.yohaku.app',
  appProfile: 'Yohaku',
  extensionProfile: 'Yohaku Notification Service App Store',
  teamId: 'TEAMID123',
}

describe('signingSettingsFor', () => {
  it('signs the app target with the app store profile', () => {
    expect(signingSettingsFor('dev.yohaku.app', options)).toEqual({
      CODE_SIGN_STYLE: 'Manual',
      CODE_SIGN_IDENTITY: '"Apple Distribution"',
      DEVELOPMENT_TEAM: 'TEAMID123',
      PROVISIONING_PROFILE_SPECIFIER: '"Yohaku"',
    })
  })

  it('signs the notification service target with its own profile', () => {
    expect(
      signingSettingsFor('dev.yohaku.app.notification-service', options)
        ?.PROVISIONING_PROFILE_SPECIFIER,
    ).toBe('"Yohaku Notification Service App Store"')
  })

  it('leaves unrelated targets and incomplete configurations untouched', () => {
    expect(signingSettingsFor('dev.yohaku.app.other', options)).toBeNull()
    expect(
      signingSettingsFor('dev.yohaku.app', { ...options, appProfile: '' }),
    ).toBeNull()
    expect(
      signingSettingsFor('dev.yohaku.app.notification-service', {
        ...options,
        extensionProfile: undefined,
      }),
    ).toBeNull()
  })
})

describe('resolveManualSigningOptions', () => {
  const profiles = {
    YOHAKU_APP_PROFILE_NAME: 'Yohaku',
    YOHAKU_EXTENSION_PROFILE_NAME: 'Yohaku Notification Service App Store',
  }

  it('prefers YOHAKU_APPLE_TEAM_ID over APPLE_TEAM_ID and expo config', () => {
    expect(
      resolveManualSigningOptions(
        {
          ...profiles,
          YOHAKU_APPLE_TEAM_ID: 'TEAMID123',
          APPLE_TEAM_ID: 'TEAMID456',
        },
        {
          ios: {
            bundleIdentifier: 'dev.yohaku.app',
            appleTeamId: 'TEAMID789',
          },
        },
      ).teamId,
    ).toBe('TEAMID123')
  })

  it('falls back to APPLE_TEAM_ID when the Yohaku-prefixed team env is unset', () => {
    expect(
      resolveManualSigningOptions(
        { ...profiles, APPLE_TEAM_ID: 'TEAMID123' },
        { ios: { bundleIdentifier: 'dev.yohaku.app' } },
      ).teamId,
    ).toBe('TEAMID123')
  })

  it('treats an empty YOHAKU_APPLE_TEAM_ID as missing', () => {
    expect(
      resolveManualSigningOptions(
        {
          ...profiles,
          YOHAKU_APPLE_TEAM_ID: '',
          APPLE_TEAM_ID: 'TEAMID123',
        },
        {
          ios: {
            bundleIdentifier: 'dev.yohaku.app',
            appleTeamId: 'TEAMID789',
          },
        },
      ).teamId,
    ).toBe('TEAMID123')
  })

  it('falls back to expo appleTeamId when neither team env is set', () => {
    expect(
      resolveManualSigningOptions(profiles, {
        ios: { bundleIdentifier: 'dev.yohaku.app', appleTeamId: 'TEAMID123' },
      }).teamId,
    ).toBe('TEAMID123')
  })

  it('prefers the expo bundle id over YOHAKU_BUNDLE_ID', () => {
    expect(
      resolveManualSigningOptions(
        {
          ...profiles,
          YOHAKU_APPLE_TEAM_ID: 'TEAMID123',
          YOHAKU_BUNDLE_ID: 'dev.overlay.app',
        },
        { ios: { bundleIdentifier: 'dev.yohaku.app' } },
      ).appBundleIdentifier,
    ).toBe('dev.yohaku.app')
  })

  it('falls back to YOHAKU_BUNDLE_ID when expo config has no bundle id', () => {
    expect(
      resolveManualSigningOptions(
        {
          ...profiles,
          YOHAKU_APPLE_TEAM_ID: 'TEAMID123',
          YOHAKU_BUNDLE_ID: 'dev.overlay.app',
        },
        { ios: {} },
      ).appBundleIdentifier,
    ).toBe('dev.overlay.app')
  })
})

describe('applyManualSigning', () => {
  const createProject = () => {
    const sections: Record<string, { buildSettings: Record<string, string> }> =
      {
        app: { buildSettings: { PRODUCT_BUNDLE_IDENTIFIER: 'dev.yohaku.app' } },
        extension: {
          buildSettings: {
            PRODUCT_BUNDLE_IDENTIFIER: '"dev.yohaku.app.notification-service"',
            CODE_SIGN_STYLE: 'Automatic',
          },
        },
        pods: { buildSettings: { PRODUCT_NAME: 'Pods' } },
      }
    return {
      sections,
      // pbxproj sections interleave comment strings with configuration objects.
      pbxXCBuildConfigurationSection: () => ({
        ...sections,
        comment: '/* comment */',
      }),
    }
  }

  it('rewrites every app and extension configuration exactly once', () => {
    const project = createProject()

    expect(applyManualSigning(project, options)).toBe(2)
    expect(project.sections.app.buildSettings).toMatchObject({
      CODE_SIGN_STYLE: 'Manual',
      PROVISIONING_PROFILE_SPECIFIER: '"Yohaku"',
    })
    expect(project.sections.extension.buildSettings).toMatchObject({
      CODE_SIGN_STYLE: 'Manual',
      PROVISIONING_PROFILE_SPECIFIER: '"Yohaku Notification Service App Store"',
    })
    expect(project.sections.pods.buildSettings).toEqual({
      PRODUCT_NAME: 'Pods',
    })
  })

  it('refuses to patch when a profile name is missing', () => {
    const project = createProject()

    expect(() =>
      applyManualSigning(project, { ...options, extensionProfile: '' }),
    ).toThrow(/extension profile/i)
    expect(project.sections.app.buildSettings.CODE_SIGN_STYLE).toBeUndefined()
  })
})
