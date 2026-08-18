import type { ApnsEnvironment, PushConfig } from './types'

export type PushEnv = {
  EXPO_PUBLIC_APNS_ENV?: string
  EXPO_PUBLIC_PUSH_APP_ID?: string
  EXPO_PUBLIC_PUSH_RELAY_URL?: string
} & Record<string, string | undefined>

export type ParsePushConfigOptions = {
  isDev?: boolean
}

const DEFAULT_APP_ID = 'yohaku'
const MAX_APP_ID_LENGTH = 64

function text(value: string | undefined): string {
  return value?.trim() ?? ''
}

function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  )
}

function parseRelayOrigin(raw: string): string {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Relay URL must be an origin')
  }
  const local = isLocalHost(url.hostname)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    throw new Error('Relay URL must use HTTPS outside a local development host')
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== '/' && url.pathname !== '')
  ) {
    throw new Error(
      'Relay URL must be an origin without credentials, path, query, or fragment',
    )
  }
  return url.origin
}

function parseAppId(raw: string): string {
  if (!raw || raw.length > MAX_APP_ID_LENGTH) {
    throw new Error('Push app id must be nonempty and at most 64 characters')
  }
  return raw
}

function parseEnvironment(raw: string, isDev: boolean): ApnsEnvironment {
  if (!raw) return isDev ? 'development' : 'production'
  if (raw === 'development' || raw === 'production') return raw
  throw new Error('APNs environment must be development or production')
}

export function parsePushConfig(
  env: PushEnv,
  options: ParsePushConfigOptions = {},
): PushConfig {
  const relayRaw = text(env.EXPO_PUBLIC_PUSH_RELAY_URL)
  if (!relayRaw) return { configured: false }

  const appIdRaw = text(env.EXPO_PUBLIC_PUSH_APP_ID)
  return {
    configured: true,
    relayUrl: parseRelayOrigin(relayRaw),
    appId: parseAppId(appIdRaw || DEFAULT_APP_ID),
    environment: parseEnvironment(
      text(env.EXPO_PUBLIC_APNS_ENV),
      !!options.isDev,
    ),
  }
}

function readExpoPublicPushEnv(): PushEnv {
  // Expo only statically inlines `process.env.EXPO_PUBLIC_*` occurrences.
  // Reading via an intermediate `env` object may keep values empty in the
  // production bundle, which would hide the whole push settings UI.
  return {
    EXPO_PUBLIC_APNS_ENV: process.env.EXPO_PUBLIC_APNS_ENV,
    EXPO_PUBLIC_PUSH_APP_ID: process.env.EXPO_PUBLIC_PUSH_APP_ID,
    EXPO_PUBLIC_PUSH_RELAY_URL: process.env.EXPO_PUBLIC_PUSH_RELAY_URL,
  }
}

export function loadPushConfig(
  env: PushEnv = readExpoPublicPushEnv(),
  options: ParsePushConfigOptions = { isDev: __DEV__ },
): PushConfig {
  try {
    return parsePushConfig(env, options)
  } catch {
    return { configured: false }
  }
}
