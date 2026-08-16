import fs from 'node:fs'

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
  associatedDomains?: string[]
  bundleId?: string
  icon?: string
  iosIcon?: string
  scheme?: string
}

const workspaceRoot = findWorkspaceRoot(__dirname)
const overlayDir = resolveOverlayDir(workspaceRoot)
const overlay = overlayDir ? overlayFiles(overlayDir) : null
const overlayExpo = readOverlayExpo(overlay?.expoJson ?? null)
const site = {
  bundleId: overlayExpo?.bundleId ?? PUBLIC_BUNDLE_ID,
  scheme: overlayExpo?.scheme ?? PUBLIC_SCHEME,
}

function readOverlayExpo(file: string | null): OverlayExpo | null {
  if (!file) return null
  return JSON.parse(fs.readFileSync(file, 'utf8')) as OverlayExpo
}

const config: ExpoConfig = {
  name: 'Yohaku',
  slug: 'yohaku',
  version: '1.0.0',
  orientation: 'portrait',
  icon: overlayExpo?.icon ?? './assets/images/icon.png',
  scheme: site.scheme,
  userInterfaceStyle: 'automatic',
  platforms: ['ios'],
  ios: {
    bundleIdentifier: site.bundleId,
    supportsTablet: false,
    icon: overlayExpo?.iosIcon ?? './assets/expo.icon',
    associatedDomains: overlayExpo?.associatedDomains ?? [],
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ['audio'],
    },
  },
  plugins: [
    'expo-router',
    './plugins/with-ios-scene-lifecycle.cjs',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#faf9f6',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
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
    'expo-secure-store',
    'expo-localization',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    siteBundleId: site.bundleId,
    siteScheme: site.scheme,
    overlayPresent: overlayDir !== null,
  },
}

export default config
