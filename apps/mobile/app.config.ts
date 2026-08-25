import fs from 'node:fs'
import path from 'node:path'

import type { ExpoConfig } from 'expo/config'

import {
  findWorkspaceRoot,
  overlayFiles,
  resolveOverlayDir,
} from './workspace-root.cjs'

// Keep in lockstep with `publicSite` in src/site-config.ts.
const PUBLIC_SCHEME = 'yohaku'
const PUBLIC_BUNDLE_ID = 'dev.yohaku.app'

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
  const updates = overlayDir
    ? resolveOverlayUpdates(overlayDir, overlayExpo)
    : undefined
  const site = {
    bundleId: overlayExpo?.bundleId ?? PUBLIC_BUNDLE_ID,
    scheme: overlayExpo?.scheme ?? PUBLIC_SCHEME,
  }
  const apns = apnsEnvironment()

  return {
    name: 'Yohaku',
    slug: 'yohaku',
    version: '1.0.1',
    orientation: 'portrait',
    icon: overlayExpo?.icon ?? './assets/images/icon.png',
    scheme: site.scheme,
    userInterfaceStyle: 'automatic',
    platforms: ['ios'],
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
        LSApplicationQueriesSchemes: ['orpheus', 'qqmusic'],
        NSUserActivityTypes: ['INSendMessageIntent'],
        UIBackgroundModes: ['audio', 'remote-notification'],
      },
      entitlements: {
        'aps-environment': apns,
        'com.apple.developer.usernotifications.communication': true,
        'keychain-access-groups': [
          `$(AppIdentifierPrefix)${site.bundleId}`,
        ],
      },
      ...(overlayExpo?.appleTeamId
        ? { appleTeamId: overlayExpo.appleTeamId }
        : {}),
    },
    plugins: [
      'expo-router',
      '@bacons/apple-targets',
      './plugins/with-notification-localizations.cjs',
      './plugins/with-ios-scene-lifecycle.cjs',
      './plugins/with-wipe-www-bundle.cjs',
      './plugins/with-ios-keychain-signing.cjs',
      './plugins/with-ios-mermaid-pods.cjs',
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
        },
      ],
      'expo-sqlite',
      'expo-localization',
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
