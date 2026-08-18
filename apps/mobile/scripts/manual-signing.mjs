// The app and the notification service extension have distinct App IDs, so each
// target needs its own provisioning profile. xcodebuild can only express one
// PROVISIONING_PROFILE_SPECIFIER per invocation, and @bacons/apple-targets
// hardcodes automatic signing for generated targets, so CI patches the
// generated project after prebuild instead.

const EXTENSION_SUFFIX = '.notification-service'

const quote = (value) => `"${value}"`
const unquote = (value) =>
  typeof value === 'string' ? value.replaceAll(/^"|"$/g, '') : value

const firstPresent = (...values) =>
  values.find((value) => typeof value === 'string' && value.length > 0)

// Remote deploy historically sets APPLE_TEAM_ID / YOHAKU_BUNDLE_ID; overlay
// reading can also fill ios.appleTeamId and ios.bundleIdentifier. Accept all
// of those so signing does not require a Yohaku-prefixed env rename.
export const resolveManualSigningOptions = (env, appConfig) => ({
  appBundleIdentifier: firstPresent(
    appConfig?.ios?.bundleIdentifier,
    env.YOHAKU_BUNDLE_ID,
  ),
  appProfile: env.YOHAKU_APP_PROFILE_NAME,
  extensionProfile: env.YOHAKU_EXTENSION_PROFILE_NAME,
  teamId: firstPresent(
    env.YOHAKU_APPLE_TEAM_ID,
    env.APPLE_TEAM_ID,
    appConfig?.ios?.appleTeamId,
  ),
})

export const signingSettingsFor = (bundleIdentifier, options) => {
  const { appBundleIdentifier, appProfile, extensionProfile, teamId } = options
  if (!teamId || !appBundleIdentifier) return null

  const profile =
    bundleIdentifier === appBundleIdentifier
      ? appProfile
      : bundleIdentifier === `${appBundleIdentifier}${EXTENSION_SUFFIX}`
        ? extensionProfile
        : null
  if (!profile) return null

  return {
    CODE_SIGN_STYLE: 'Manual',
    CODE_SIGN_IDENTITY: quote('Apple Distribution'),
    DEVELOPMENT_TEAM: teamId,
    PROVISIONING_PROFILE_SPECIFIER: quote(profile),
  }
}

export const applyManualSigning = (project, options) => {
  if (!options.teamId) throw new Error('Apple team id is required')
  if (!options.appProfile) throw new Error('App profile name is required')
  if (!options.extensionProfile) {
    throw new Error('Notification service extension profile name is required')
  }

  const configurations = project.pbxXCBuildConfigurationSection() ?? {}
  let patched = 0
  for (const entry of Object.values(configurations)) {
    const buildSettings = entry?.buildSettings
    if (!buildSettings) continue
    const settings = signingSettingsFor(
      unquote(buildSettings.PRODUCT_BUNDLE_IDENTIFIER),
      options,
    )
    if (!settings) continue
    Object.assign(buildSettings, settings)
    patched += 1
  }
  return patched
}
