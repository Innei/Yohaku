import { describe, expect, it } from 'vitest'

import {
  applyManualSigning,
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
