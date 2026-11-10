import fs from 'node:fs'
import path from 'node:path'

import type { ExpoConfig } from 'expo/config'

import {
  findWorkspaceRoot,
  overlayFiles,
  resolveOverlayDir,
} from './workspace-root.cjs'

// Keep in lockstep with `publicSite` in src/site-config.ts. Both read the same
// `site.config.json`, which is the single file a fork edits to point the app at
// its own blog.
const siteConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'site.config.json'), 'utf8'),
) as {
  androidPackage: string
  appName: string
  bundleId: string
  scheme: string
  siteUrl: string
}

const PUBLIC_SCHEME = siteConfig.scheme
const PUBLIC_BUNDLE_ID = siteConfig.bundleId
const PUBLIC_VERSION = '1.0.1'

// Android identity. The Play Store package id is permanent, so it lives here
// next to the iOS bundle id instead of inside the overlay machinery.
const ANDROID_PACKAGE = siteConfig.androidPackage
const APP_DISPLAY_NAME = siteConfig.appName
const SITE_HOST = new URL(siteConfig.siteUrl).hostname

interface OverlayExpo {
  appleTeamId?: string
  associatedDomains?: string[]
  bundleId?: string
  eas?: {
    build?: {
      production?: {
        env?: Record<string, string>
      }
    }
    projectId?: string
  }
  icon?: string
  iosIcon?: string
  scheme?: string
  updates?: {
    url?: string
    enabled?: boolean
    fallbackToCacheTimeout?: number
    codeSigningCertificate?: string
    codeSigningMetadata?: {
      alg: string
      keyid: string
    }
    requestHeaders?: Record<string, string>
  }
  version?: string
}

function readOverlayExpo(file: string | null): OverlayExpo | null {
  if (!file) return null
  return JSON.parse(fs.readFileSync(file, 'utf8')) as OverlayExpo
}

function applyOverlayEnv(overlayExpo: OverlayExpo | null) {
  const env = overlayExpo?.eas?.build?.production?.env
  if (!env) return
  for (const [key, value] of Object.entries(env)) {
    if (value && !process.env[key]) process.env[key] = value
  }
}

function apnsEnvironment(): 'development' | 'production' {
  return process.env.EXPO_PUBLIC_APNS_ENV === 'production'
    ? 'production'
    : 'development'
}

export function shouldEmbedOtaCodeSigning(
  env: NodeJS.ProcessEnv = process.env,
) {
  return (
    env.EAS_BUILD === 'true' ||
    env.CONFIGURATION === 'Release' ||
    env.YOHAKU_OTA_SIGN === 'true'
  )
}

export function updatesForCurrentBuild(
  updates: ExpoConfig['updates'] | undefined,
): ExpoConfig['updates'] | undefined {
  if (!updates || shouldEmbedOtaCodeSigning()) return updates
  return {
    enabled: updates.enabled,
    fallbackToCacheTimeout: updates.fallbackToCacheTimeout,
    requestHeaders: updates.requestHeaders,
    url: updates.url,
  }
}

export function resolveOverlayUpdates(
  overlayDir: string,
  overlayExpo: OverlayExpo | null,
): ExpoConfig['updates'] | undefined {
  const updates = overlayExpo?.updates
  if (!updates) return undefined

  const certificateRel = updates.codeSigningCertificate
  const absoluteCertificate = certificateRel
    ? path.resolve(overlayDir, certificateRel)
    : undefined
  if (absoluteCertificate && !fs.existsSync(absoluteCertificate)) {
    throw new Error(
      `OTA code-signing certificate missing: ${absoluteCertificate}`,
    )
  }
  // Expo resolves this field relative to the app project. Passing an absolute
  // path makes its config plugin prepend the project root a second time.
  const codeSigningCertificate = absoluteCertificate
    ? path.relative(__dirname, absoluteCertificate)
    : undefined

  return {
    url: updates.url,
    enabled: updates.enabled ?? true,
    fallbackToCacheTimeout: updates.fallbackToCacheTimeout ?? 0,
    ...(codeSigningCertificate
      ? {
          codeSigningCertificate,
          codeSigningMetadata: updates.codeSigningMetadata,
        }
      : {}),
    requestHeaders: updates.requestHeaders,
  }
}

export function createAppConfig(): ExpoConfig {
  const workspaceRoot = findWorkspaceRoot(__dirname)
  const overlayDir = resolveOverlayDir(workspaceRoot)
  const overlay = overlayDir ? overlayFiles(overlayDir) : null
  const overlayExpo = readOverlayExpo(overlay?.expoJson ?? null)
  applyOverlayEnv(overlayExpo)
  const updates = updatesForCurrentBuild(
    overlayDir ? resolveOverlayUpdates(overlayDir, overlayExpo) : undefined,
  )
  const site = {
    bundleId: overlayExpo?.bundleId ?? PUBLIC_BUNDLE_ID,
    scheme: overlayExpo?.scheme ?? PUBLIC_SCHEME,
  }
  const apns = apnsEnvironment()

  return {
    name: APP_DISPLAY_NAME,
    slug: 'yohaku',
    version: overlayExpo?.version ?? PUBLIC_VERSION,
    orientation: 'portrait',
    icon: overlayExpo?.icon ?? './assets/images/icon.png',
    scheme: site.scheme,
    userInterfaceStyle: 'automatic',
    platforms: ['ios', 'android'],
    locales: {
      'zh-Hans': './locales/zh-Hans.json',
      'zh-Hant': './locales/zh-Hant.json',
      ja: './locales/ja.json',
      en: './locales/en.json',
      ko: './locales/ko.json',
    },
    ios: {
      bundleIdentifier: site.bundleId,
      supportsTablet: false,
      icon: overlayExpo?.iosIcon ?? './assets/expo.icon',
      associatedDomains: overlayExpo?.associatedDomains ?? [],
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        CFBundleAllowMixedLocalizations: true,
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: [
          'orpheus',
          'qqmusic',
          'bilibili',
          'bluesky',
          'discord',
          'github',
          'mqqwpa',
          'sinaweibo',
          'steam',
          'tg',
          'twitter',
        ],
        NSUserActivityTypes: ['INSendMessageIntent'],
        UIBackgroundModes: ['audio', 'remote-notification'],
      },
      entitlements: {
        'aps-environment': apns,
        'com.apple.developer.usernotifications.communication': true,
        'keychain-access-groups': [`$(AppIdentifierPrefix)${site.bundleId}`],
      },
      ...(overlayExpo?.appleTeamId
        ? { appleTeamId: overlayExpo.appleTeamId }
        : {}),
    },
    android: {
      package: ANDROID_PACKAGE,
      versionCode: 1,
      icon: './assets/images/icon.png',
      adaptiveIcon: {
        backgroundColor: '#232323',
        foregroundImage: './assets/images/android-icon-foreground.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      // Android 16 makes edge-to-edge mandatory; Expo 58 rejects the old key.
      predictiveBackGestureEnabled: true,
      softwareKeyboardLayoutMode: 'resize',
      // Deep links for the site (https) and for the custom auth scheme. The
      // scheme entry is generated from `scheme` as well; the https filter is
      // what lets a browser open a post inside the app.
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: SITE_HOST }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      permissions: ['INTERNET', 'VIBRATE', 'WAKE_LOCK', 'POST_NOTIFICATIONS'],
      // expo-audio and the dev client add permissions this reader never uses.
      blockedPermissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
    },
    plugins: [
      'expo-router',
      ['expo-dev-client', { toolsButton: false }],
      '@bacons/apple-targets',
      './plugins/with-notification-localizations.cjs',
      './plugins/with-ios-scene-lifecycle.cjs',
      './plugins/with-wipe-www-bundle.cjs',
      './plugins/with-ios-keychain-signing.cjs',
      './plugins/with-ios-vendored-pods.cjs',
      './plugins/with-duo-surfaces.cjs',
      './plugins/with-android-gradle-properties.cjs',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#faf9f6',
          image: './assets/images/splash-icon.png',
          imageWidth: 120,
          dark: {
            backgroundColor: '#282828',
            image: './assets/images/splash-icon-dark.png',
          },
        },
      ],
      [
        'expo-build-properties',
        {
          ios: {
            deploymentTarget: '18.0',
          },
          android: {
            // expo-modules (58.1.x) AAR metadata requires API 37.
            compileSdkVersion: 37,
            minSdkVersion: 26,
            targetSdkVersion: 36,
            // R8 stays off until the port's reflection-heavy modules have
            // verified keep rules; this only trades APK size for safety.
            enableMinifyInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false,
          },
        },
      ],
      'expo-sqlite',
      'expo-localization',
      'expo-web-browser',
      [
        'expo-notifications',
        {
          mode: apns,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      siteBundleId: site.bundleId,
      siteScheme: site.scheme,
      overlayPresent: overlayDir !== null,
      ...(overlayExpo?.eas?.projectId
        ? { eas: { projectId: overlayExpo.eas.projectId } }
        : {}),
    },
    runtimeVersion: {
      policy: 'fingerprint',
    },
    ...(updates ? { updates } : {}),
  }
}

export default createAppConfig()
