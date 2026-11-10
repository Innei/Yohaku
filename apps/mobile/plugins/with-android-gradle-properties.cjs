/* eslint-disable @typescript-eslint/no-require-imports */
const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins')

const PROPERTIES = {
  // The AGP path check rejects checkouts whose parent directories contain
  // non-ASCII characters (this repo has been developed in one). The build
  // itself is fine.
  'android.overridePathCheck': 'true',
}

// Which ABIs the release APK carries. Trimming this is the difference between a
// ~60MB and a ~115MB APK; override with YOHAKU_ANDROID_ABIS when you need a
// universal build (e.g. Play Store upload).
const DEFAULT_ABIS = 'arm64-v8a,x86_64'

function upsertProperty(result, key, value) {
  const existing = result.modResults.find(
    (item) => item.type === 'property' && item.key === key,
  )
  if (existing) existing.value = value
  else result.modResults.push({ type: 'property', key, value })
}

/**
 * Adds Android Gradle settings the Expo config has no field for.
 *
 * - `android.overridePathCheck`: non-ASCII checkout paths are rejected by AGP.
 * - `reactNativeArchitectures`: ABI set baked into the APK.
 * - CMake staging directory: on Windows the default `app/.cxx` mirror of the
 *   codegen tree overflows MAX_PATH once node_modules is deep enough, so a short
 *   staging dir keeps the per-source object directories reachable.
 */
function withAndroidGradleProperties(config) {
  config = withGradleProperties(config, (result) => {
    for (const [key, value] of Object.entries(PROPERTIES)) {
      upsertProperty(result, key, value)
    }
    upsertProperty(
      result,
      'reactNativeArchitectures',
      process.env.YOHAKU_ANDROID_ABIS || DEFAULT_ABIS,
    )
    return result
  })

  config = withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes('YOHAKU_CMAKE_STAGING')) return cfg
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /\nandroid \{/,
      `
android {
    // Windows MAX_PATH: the default app/.cxx mirror of the codegen source tree
    // overflows 260 characters with deep node_modules. A short staging
    // directory keeps CMake's per-source object directories reachable.
    externalNativeBuild {
        cmake {
            buildStagingDirectory = file(System.getenv('YOHAKU_CMAKE_STAGING') ?: "$rootDir/../.cxx-staging")
        }
    }
`,
    )
    return cfg
  })

  return config
}

module.exports = withAndroidGradleProperties
