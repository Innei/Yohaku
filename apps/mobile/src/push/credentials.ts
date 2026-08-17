import type { PushInstallationCredential } from './types'

export const PUSH_INSTALLATION_STORAGE_KEY = 'yohaku.push-installation'

export type CredentialStorage = {
  deleteItem: (key: string) => Promise<void>
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
}

export type CredentialConfigMatch = {
  appId: string
  relayUrl: string
}

export type PushCredentialStore = {
  clear: () => Promise<void>
  read: (
    config: CredentialConfigMatch,
  ) => Promise<PushInstallationCredential | null>
  write: (credential: PushInstallationCredential) => Promise<void>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function parseCredential(value: unknown): PushInstallationCredential | null {
  if (!isRecord(value)) return null
  const relayUrl =
    typeof value.relayUrl === 'string' && value.relayUrl ? value.relayUrl : null
  const appId =
    typeof value.appId === 'string' && value.appId ? value.appId : null
  const installationId =
    typeof value.installationId === 'string' && value.installationId
      ? value.installationId
      : null
  const installationSecret =
    typeof value.installationSecret === 'string' &&
    value.installationSecret.length >= 32
      ? value.installationSecret
      : null
  const bindingId =
    value.bindingId === null
      ? null
      : typeof value.bindingId === 'string' && value.bindingId
        ? value.bindingId
        : undefined
  if (!relayUrl || !appId || !installationId || !installationSecret) return null
  return { relayUrl, appId, installationId, installationSecret, bindingId }
}

export function createCredentialStore(
  storage: CredentialStorage,
): PushCredentialStore {
  async function clear() {
    await storage.deleteItem(PUSH_INSTALLATION_STORAGE_KEY)
  }

  return {
    clear,
    async read(config) {
      let raw: string | null
      try {
        raw = await storage.getItem(PUSH_INSTALLATION_STORAGE_KEY)
      } catch {
        return null
      }
      if (!raw) return null
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        await clear().catch(() => {})
        return null
      }
      const credential = parseCredential(parsed)
      if (!credential) {
        await clear().catch(() => {})
        return null
      }
      if (
        credential.relayUrl !== config.relayUrl ||
        credential.appId !== config.appId
      ) {
        await clear().catch(() => {})
        return null
      }
      return credential
    },
    async write(credential) {
      await storage.setItem(
        PUSH_INSTALLATION_STORAGE_KEY,
        JSON.stringify({
          relayUrl: credential.relayUrl,
          appId: credential.appId,
          installationId: credential.installationId,
          installationSecret: credential.installationSecret,
          bindingId: credential.bindingId ?? null,
        }),
      )
    },
  }
}
