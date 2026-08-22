/* eslint-disable @typescript-eslint/no-require-imports -- Expo loads local config plugins through CommonJS. */

const { withXcodeProject } = require('expo/config-plugins')

/**
 * Simulator Debug builds from recent Xcode still ad-hoc sign the app and skip
 * injecting `application-identifier`. Keychain then throws
 * `errSecMissingEntitlement`.
 *
 * `ENTITLEMENTS_REQUIRED` + `CODE_SIGN_INJECT_BASE_ENTITLEMENTS` force that
 * identifier in. `ENABLE_DEBUG_DYLIB=NO` avoids the preview-dylib signing
 * path that leaves the `.app` entitlements empty.
 *
 * @param {Record<string, string> | undefined} buildSettings
 */
function applyKeychainSigningSettings(buildSettings) {
  if (!buildSettings) return buildSettings
  const isAppTarget =
    buildSettings.CODE_SIGN_ENTITLEMENTS ||
    buildSettings.PRODUCT_NAME === 'Yohaku'
  if (!isAppTarget) return buildSettings
  buildSettings.ENTITLEMENTS_REQUIRED = 'YES'
  buildSettings.CODE_SIGN_INJECT_BASE_ENTITLEMENTS = 'YES'
  buildSettings.ENABLE_DEBUG_DYLIB = 'NO'
  return buildSettings
}

function withIosKeychainSigning(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults
    if (typeof project.updateBuildProperty === 'function') {
      project.updateBuildProperty('ENTITLEMENTS_REQUIRED', 'YES')
      project.updateBuildProperty('CODE_SIGN_INJECT_BASE_ENTITLEMENTS', 'YES')
      project.updateBuildProperty('ENABLE_DEBUG_DYLIB', 'NO')
    }
    const configurations = project.pbxXCBuildConfigurationSection()
    for (const key of Object.keys(configurations)) {
      applyKeychainSigningSettings(configurations[key]?.buildSettings)
    }
    return config
  })
}

module.exports = withIosKeychainSigning
module.exports.applyKeychainSigningSettings = applyKeychainSigningSettings
